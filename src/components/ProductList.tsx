import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Edit2, Trash2, Package, DollarSign, Calendar } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: string;
  name: string;
  vendor_id: string | null;
  sku: string | null;
  category: string;
  type: string | null;
  description: string | null;
  msrp: number | null;
  average_cost: number | null;
  last_purchase_cost: number | null;
  last_purchase_date: string | null;
  last_purchase_provider_id: string | null;
  vendor?: { name: string };
  provider?: { name: string };
}

interface Vendor {
  id: string;
  name: string;
}

interface Provider {
  id: string;
  name: string;
}

export default function ProductList() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    vendor_id: '',
    sku: '',
    category: 'software',
    type: '',
    description: '',
    msrp: '',
    average_cost: '',
    last_purchase_cost: '',
    last_purchase_date: '',
    last_purchase_provider_id: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, vendorsRes, providersRes] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            vendor:vendors(name),
            provider:providers!products_last_purchase_provider_id_fkey(name)
          `)
          .eq('organization_id', profile!.organization_id)
          .order('name'),
        supabase
          .from('vendors')
          .select('id, name')
          .eq('organization_id', profile!.organization_id)
          .order('name'),
        supabase
          .from('providers')
          .select('id, name')
          .eq('organization_id', profile!.organization_id)
          .order('name')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (vendorsRes.error) throw vendorsRes.error;
      if (providersRes.error) throw providersRes.error;

      setProducts(productsRes.data || []);
      setVendors(vendorsRes.data || []);
      setProviders(providersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        vendor_id: formData.vendor_id || null,
        sku: formData.sku || null,
        category: formData.category,
        type: formData.type || null,
        description: formData.description || null,
        msrp: formData.msrp ? parseFloat(formData.msrp) : null,
        average_cost: formData.average_cost ? parseFloat(formData.average_cost) : null,
        last_purchase_cost: formData.last_purchase_cost ? parseFloat(formData.last_purchase_cost) : null,
        last_purchase_date: formData.last_purchase_date || null,
        last_purchase_provider_id: formData.last_purchase_provider_id || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            ...productData,
            organization_id: profile!.organization_id,
            created_by: profile!.id
          });

        if (error) throw error;
      }

      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      vendor_id: product.vendor_id || '',
      sku: product.sku || '',
      category: product.category,
      type: product.type || '',
      description: product.description || '',
      msrp: product.msrp?.toString() || '',
      average_cost: product.average_cost?.toString() || '',
      last_purchase_cost: product.last_purchase_cost?.toString() || '',
      last_purchase_date: product.last_purchase_date || '',
      last_purchase_provider_id: product.last_purchase_provider_id || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. It may be in use.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      vendor_id: '',
      sku: '',
      category: 'software',
      type: '',
      description: '',
      msrp: '',
      average_cost: '',
      last_purchase_cost: '',
      last_purchase_date: '',
      last_purchase_provider_id: ''
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'software': return 'bg-blue-100 text-blue-700';
      case 'hardware': return 'bg-purple-100 text-purple-700';
      case 'service': return 'bg-green-100 text-green-700';
      case 'cloud': return 'bg-cyan-100 text-cyan-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-darkGray">Products</h1>
          <p className="text-mediumGray">Manage your product catalog</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Add Product
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="software">Software</option>
          <option value="hardware">Hardware</option>
          <option value="service">Service</option>
          <option value="cloud">Cloud</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">MSRP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Last Purchase</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-mediumGray uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-mediumGray">No products found. Add your first product to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <Package size={16} className="text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium text-darkGray">{product.name}</div>
                          {product.type && (
                            <div className="text-xs text-mediumGray">{product.type}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(product.category)}`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-darkGray">{product.vendor?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-mediumGray font-mono text-sm">{product.sku || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-darkGray font-medium">{formatCurrency(product.msrp)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {product.last_purchase_cost && (
                          <div className="text-darkGray font-medium">{formatCurrency(product.last_purchase_cost)}</div>
                        )}
                        {product.last_purchase_date && (
                          <div className="text-xs text-mediumGray">{formatDate(product.last_purchase_date)}</div>
                        )}
                        {!product.last_purchase_cost && !product.last_purchase_date && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-primary hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-danger hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-darkGray">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">
                    Product Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Microsoft 365 Business Premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="software">Software</option>
                    <option value="hardware">Hardware</option>
                    <option value="service">Service</option>
                    <option value="cloud">Cloud</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Vendor</label>
                  <select
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">SKU / Part Number</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., M365-BP-001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Type / Model</label>
                <input
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Annual Subscription, Perpetual License"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Product description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">MSRP</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={16} />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.msrp}
                      onChange={(e) => setFormData({ ...formData, msrp: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Average Cost</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={16} />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.average_cost}
                      onChange={(e) => setFormData({ ...formData, average_cost: e.target.value })}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium text-darkGray mb-3">Last Purchase Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-darkGray mb-1">Cost</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={16} />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.last_purchase_cost}
                        onChange={(e) => setFormData({ ...formData, last_purchase_cost: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-darkGray mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.last_purchase_date}
                      onChange={(e) => setFormData({ ...formData, last_purchase_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-darkGray mb-1">Provider</label>
                    <select
                      value={formData.last_purchase_provider_id}
                      onChange={(e) => setFormData({ ...formData, last_purchase_provider_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select provider...</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update Product' : 'Add Product'}
                </Button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-darkGray hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
