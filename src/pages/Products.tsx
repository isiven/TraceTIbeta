import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: string;
  organization_id: string;
  name: string;
  vendor_id: string | null;
  vendor?: { id: string; name: string };
  sku: string | null;
  category: 'software' | 'hardware' | 'service' | 'cloud';
  type: string | null;
  description: string | null;
  msrp: number | null;
  average_cost: number | null;
  last_purchase_cost: number | null;
  last_purchase_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Vendor {
  id: string;
  name: string;
}

const PRODUCT_SUGGESTIONS: { [key: string]: string[] } = {
  Microsoft: ['Microsoft 365', 'Windows Server', 'SQL Server', 'Azure', 'Teams', 'Exchange Server'],
  Cisco: ['Catalyst Switch', 'ASA Firewall', 'Meraki', 'Webex', 'ISE'],
  Dell: ['PowerEdge Server', 'Latitude Laptop', 'OptiPlex Desktop', 'EqualLogic Storage'],
  HP: ['ProLiant Server', 'EliteBook', 'LaserJet Printer', '3PAR Storage'],
  Adobe: ['Creative Cloud', 'Acrobat Pro', 'Photoshop', 'Illustrator'],
  VMware: ['vSphere', 'ESXi', 'vCenter', 'NSX', 'vSAN'],
  Veeam: ['Backup & Replication', 'ONE', 'Availability Suite']
};

export default function Products() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    vendor_id: '',
    sku: '',
    category: 'software' as Product['category'],
    type: '',
    description: '',
    msrp: '',
    notes: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile]);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (vendorFilter !== 'all') {
      filtered = filtered.filter(p => p.vendor_id === vendorFilter);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, categoryFilter, vendorFilter, products]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [productsRes, vendorsRes] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            vendor:vendors(id, name)
          `)
          .eq('organization_id', profile!.organization_id)
          .order('name', { ascending: true }),
        supabase
          .from('vendors')
          .select('id, name')
          .eq('organization_id', profile!.organization_id)
          .order('name', { ascending: true })
      ]);

      if (productsRes.error) throw productsRes.error;
      if (vendorsRes.error) throw vendorsRes.error;

      setProducts(productsRes.data || []);
      setFilteredProducts(productsRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        vendor_id: product.vendor_id || '',
        sku: product.sku || '',
        category: product.category,
        type: product.type || '',
        description: product.description || '',
        msrp: product.msrp?.toString() || '',
        notes: product.notes || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        vendor_id: '',
        sku: '',
        category: 'software',
        type: '',
        description: '',
        msrp: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      vendor_id: '',
      sku: '',
      category: 'software',
      type: '',
      description: '',
      msrp: '',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    setSaving(true);
    try {
      const productData = {
        name: formData.name,
        vendor_id: formData.vendor_id || null,
        sku: formData.sku || null,
        category: formData.category,
        type: formData.type || null,
        description: formData.description || null,
        msrp: formData.msrp ? parseFloat(formData.msrp) : null,
        notes: formData.notes || null
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            ...productData,
            organization_id: profile.organization_id,
            created_by: profile.id
          });

        if (error) throw error;
      }

      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'software': return 'bg-blue-100 text-blue-700';
      case 'hardware': return 'bg-gray-100 text-gray-700';
      case 'service': return 'bg-green-100 text-green-700';
      case 'cloud': return 'bg-cyan-100 text-cyan-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getProductSuggestions = () => {
    if (!formData.vendor_id) return [];
    const vendor = vendors.find(v => v.id === formData.vendor_id);
    if (!vendor) return [];
    return PRODUCT_SUGGESTIONS[vendor.name] || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-mediumGray">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[300px] flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="software">Software</option>
            <option value="hardware">Hardware</option>
            <option value="service">Service</option>
            <option value="cloud">Cloud</option>
          </select>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-darkGray mb-2">
            {products.length === 0 ? 'No products yet' : 'No products match your filters'}
          </h3>
          <p className="text-mediumGray mb-6">
            {products.length === 0
              ? 'Add your first product to get started.'
              : 'Try adjusting your search or filters.'}
          </p>
          {products.length === 0 && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} />
              Add First Product
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Product Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Vendor</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">SKU</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Category</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Type</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-darkGray">Last Cost</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-darkGray">Avg Cost</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-darkGray">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-darkGray">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-mediumGray">
                      {product.vendor ? product.vendor.name : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-mediumGray font-mono">{product.sku || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(product.category)}`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-mediumGray">{product.type || '-'}</td>
                    <td className="px-6 py-4 text-sm text-mediumGray text-right font-medium">
                      {formatCurrency(product.last_purchase_cost)}
                    </td>
                    <td className="px-6 py-4 text-sm text-mediumGray text-right font-medium">
                      {formatCurrency(product.average_cost)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-1 text-mediumGray hover:text-primary transition-colors"
                          title="Edit product"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-1 text-mediumGray hover:text-danger transition-colors"
                          title="Delete product"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-darkGray">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={handleCloseModal} className="text-mediumGray hover:text-darkGray">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">
                  Vendor <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value, name: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
                {vendors.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">No vendors found. Please add a vendor first.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">
                  Product Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  list="product-suggestions"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  disabled={!formData.vendor_id}
                />
                <datalist id="product-suggestions">
                  {getProductSuggestions().map(suggestion => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="software">Software</option>
                    <option value="hardware">Hardware</option>
                    <option value="service">Service</option>
                    <option value="cloud">Cloud</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Type</label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="e.g., Subscription, Perpetual, SaaS"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">MSRP</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.msrp}
                  onChange={(e) => setFormData({ ...formData, msrp: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-darkGray rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
