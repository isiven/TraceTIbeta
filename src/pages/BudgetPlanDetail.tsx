import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, X, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface BudgetPlan {
  id: string;
  fiscal_year: number;
  name: string;
  description: string | null;
  status: string;
  total_amount: number;
}

interface BudgetItem {
  id: string;
  category: string;
  item_type: string;
  department: string | null;
  vendor_id: string | null;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  frequency: string;
  vendor?: { name: string };
  product?: { name: string };
}

interface Vendor {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

export default function BudgetPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [plan, setPlan] = useState<BudgetPlan | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    category: 'software',
    item_type: 'new_purchase',
    department: '',
    vendor_id: '',
    product_id: '',
    description: '',
    quantity: 1,
    unit_cost: '',
    frequency: 'one-time',
    notes: ''
  });

  useEffect(() => {
    if (profile?.organization_id && id) {
      fetchData();
    }
  }, [profile, id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [planRes, itemsRes, vendorsRes, productsRes] = await Promise.all([
        supabase.from('budget_plans').select('*').eq('id', id).single(),
        supabase.from('budget_items').select(`*, vendor:vendors(name), product:products(name)`).eq('budget_plan_id', id).order('created_at', { ascending: false }),
        supabase.from('vendors').select('id, name').eq('organization_id', profile!.organization_id).order('name'),
        supabase.from('products').select('id, name').eq('organization_id', profile!.organization_id).order('name')
      ]);

      if (planRes.error) throw planRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setPlan(planRes.data);
      setItems(itemsRes.data || []);
      setVendors(vendorsRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromExpiring = async () => {
    if (!confirm('This will analyze expiring licenses, hardware, and contracts for the fiscal year and create budget items automatically. Continue?')) return;

    setGenerating(true);
    try {
      const fiscalYearStart = `${plan!.fiscal_year}-01-01`;
      const fiscalYearEnd = `${plan!.fiscal_year}-12-31`;

      const [licensesRes, hardwareRes, contractsRes] = await Promise.all([
        supabase.from('licenses').select('*, product:products(name, vendor_id), vendor:vendors(name)').eq('organization_id', profile!.organization_id).gte('expiration_date', fiscalYearStart).lte('expiration_date', fiscalYearEnd),
        supabase.from('hardware').select('*, product:products(name, manufacturer_id)').eq('organization_id', profile!.organization_id).gte('warranty_expiration', fiscalYearStart).lte('warranty_expiration', fiscalYearEnd),
        supabase.from('support_contracts').select('*, vendor:vendors(name)').eq('organization_id', profile!.organization_id).gte('renewal_date', fiscalYearStart).lte('renewal_date', fiscalYearEnd)
      ]);

      const newItems = [];

      for (const license of licensesRes.data || []) {
        if (license.renewal_cost && license.renewal_cost > 0) {
          newItems.push({
            budget_plan_id: id,
            category: 'software',
            item_type: 'renewal',
            department: license.department,
            vendor_id: license.vendor_id,
            product_id: license.product_id,
            related_license_id: license.id,
            description: `Renewal: ${license.software_name}`,
            quantity: 1,
            unit_cost: license.renewal_cost,
            frequency: 'yearly'
          });
        }
      }

      for (const hardware of hardwareRes.data || []) {
        if (hardware.purchase_cost && hardware.purchase_cost > 0) {
          const estimatedCost = hardware.purchase_cost * 0.8;
          newItems.push({
            budget_plan_id: id,
            category: 'hardware',
            item_type: 'replacement',
            department: hardware.department,
            product_id: hardware.product_id,
            related_hardware_id: hardware.id,
            description: `Replacement: ${hardware.model}`,
            quantity: 1,
            unit_cost: estimatedCost,
            frequency: 'one-time'
          });
        }
      }

      for (const contract of contractsRes.data || []) {
        if (contract.annual_cost && contract.annual_cost > 0) {
          newItems.push({
            budget_plan_id: id,
            category: 'service',
            item_type: 'renewal',
            department: contract.department,
            vendor_id: contract.vendor_id,
            related_contract_id: contract.id,
            description: `Renewal: ${contract.contract_name}`,
            quantity: 1,
            unit_cost: contract.annual_cost,
            frequency: 'yearly'
          });
        }
      }

      if (newItems.length > 0) {
        const { error } = await supabase.from('budget_items').insert(newItems);
        if (error) throw error;
        await fetchData();
        alert(`Successfully generated ${newItems.length} budget items from expiring assets!`);
      } else {
        alert('No expiring assets found for this fiscal year.');
      }
    } catch (error) {
      console.error('Error generating items:', error);
      alert('Failed to generate items. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenModal = (item?: BudgetItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        category: item.category,
        item_type: item.item_type,
        department: item.department || '',
        vendor_id: item.vendor_id || '',
        product_id: item.product_id || '',
        description: item.description,
        quantity: item.quantity,
        unit_cost: item.unit_cost.toString(),
        frequency: item.frequency,
        notes: ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        category: 'software',
        item_type: 'new_purchase',
        department: '',
        vendor_id: '',
        product_id: '',
        description: '',
        quantity: 1,
        unit_cost: '',
        frequency: 'one-time',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      const itemData = {
        category: formData.category,
        item_type: formData.item_type,
        department: formData.department || null,
        vendor_id: formData.vendor_id || null,
        product_id: formData.product_id || null,
        description: formData.description,
        quantity: formData.quantity,
        unit_cost: parseFloat(formData.unit_cost),
        frequency: formData.frequency
      };

      if (editingItem) {
        const { error } = await supabase.from('budget_items').update(itemData).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('budget_items').insert({ ...itemData, budget_plan_id: id });
        if (error) throw error;
      }

      await fetchData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Delete this budget item?')) return;

    try {
      const { error } = await supabase.from('budget_items').delete().eq('id', itemId);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getCategoryBadge = (category: string) => {
    const colors: any = {
      software: 'bg-blue-100 text-blue-700',
      hardware: 'bg-gray-100 text-gray-700',
      service: 'bg-green-100 text-green-700',
      cloud: 'bg-cyan-100 text-cyan-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors.other;
  };

  if (loading || !plan) {
    return <div className="flex items-center justify-center h-64"><div className="text-mediumGray">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/app/budgets')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-darkGray">{plan.name}</h1>
            <p className="text-mediumGray">FY {plan.fiscal_year} - {formatCurrency(plan.total_amount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleGenerateFromExpiring} disabled={generating} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-darkGray rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Sparkles size={20} />
            {generating ? 'Generating...' : 'Generate from Expiring'}
          </button>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            <Plus size={20} />
            Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-mediumGray mb-1">Total Items</div>
          <div className="text-2xl font-bold text-darkGray">{items.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-mediumGray mb-1">Total Budget</div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(plan.total_amount)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-mediumGray mb-1">Status</div>
          <div className="text-2xl font-bold text-darkGray capitalize">{plan.status}</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-mediumGray mb-4">No budget items yet</p>
          <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            <Plus size={20} />
            Add First Item
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Description</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Category</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Vendor</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Qty</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-darkGray">Unit Cost</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-darkGray">Total</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-darkGray">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-darkGray">{item.description}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(item.category)}`}>{item.category}</span></td>
                  <td className="px-6 py-4 text-sm text-mediumGray">{item.vendor?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-mediumGray">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-mediumGray text-right">{formatCurrency(item.unit_cost)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-darkGray text-right">{formatCurrency(item.total_cost)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(item)} className="p-1 text-mediumGray hover:text-primary"><Pencil size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-mediumGray hover:text-danger"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-darkGray">{editingItem ? 'Edit' : 'Add'} Budget Item</h2>
              <button onClick={() => setShowModal(false)} className="text-mediumGray hover:text-darkGray"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Category <span className="text-danger">*</span></label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" required>
                    <option value="software">Software</option>
                    <option value="hardware">Hardware</option>
                    <option value="service">Service</option>
                    <option value="cloud">Cloud</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Type <span className="text-danger">*</span></label>
                  <select value={formData.item_type} onChange={(e) => setFormData({ ...formData, item_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" required>
                    <option value="new_purchase">New Purchase</option>
                    <option value="renewal">Renewal</option>
                    <option value="replacement">Replacement</option>
                    <option value="upgrade">Upgrade</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Description <span className="text-danger">*</span></label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Vendor</label>
                  <select value={formData.vendor_id} onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                    <option value="">Select vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Product</label>
                  <select value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Quantity <span className="text-danger">*</span></label>
                  <input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Unit Cost <span className="text-danger">*</span></label>
                  <input type="number" step="0.01" min="0" value={formData.unit_cost} onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Frequency</label>
                  <select value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                    <option value="one-time">One-time</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Department</label>
                <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 text-darkGray rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">{saving ? 'Saving...' : editingItem ? 'Update' : 'Add'} Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
