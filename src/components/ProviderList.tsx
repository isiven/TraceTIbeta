import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Edit2, Trash2, Store, Globe, Mail, Phone, User } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Provider {
  id: string;
  name: string;
  type: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  payment_terms: string | null;
  website: string | null;
  notes: string | null;
}

export default function ProviderList() {
  const { profile } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'distributor',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    payment_terms: '',
    website: '',
    notes: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchProviders();
    }
  }, [profile]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('organization_id', profile!.organization_id)
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('providers')
          .update({
            name: formData.name,
            type: formData.type,
            contact_name: formData.contact_name || null,
            contact_email: formData.contact_email || null,
            contact_phone: formData.contact_phone || null,
            payment_terms: formData.payment_terms || null,
            website: formData.website || null,
            notes: formData.notes || null
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('providers')
          .insert({
            organization_id: profile!.organization_id,
            name: formData.name,
            type: formData.type,
            contact_name: formData.contact_name || null,
            contact_email: formData.contact_email || null,
            contact_phone: formData.contact_phone || null,
            payment_terms: formData.payment_terms || null,
            website: formData.website || null,
            notes: formData.notes || null,
            created_by: profile!.id
          });

        if (error) throw error;
      }

      fetchProviders();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving provider:', error);
      alert('Failed to save provider. Please try again.');
    }
  };

  const handleEdit = (provider: Provider) => {
    setEditingId(provider.id);
    setFormData({
      name: provider.name,
      type: provider.type,
      contact_name: provider.contact_name || '',
      contact_email: provider.contact_email || '',
      contact_phone: provider.contact_phone || '',
      payment_terms: provider.payment_terms || '',
      website: provider.website || '',
      notes: provider.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      const { error } = await supabase
        .from('providers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      alert('Failed to delete provider. It may be in use.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'distributor',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      payment_terms: '',
      website: '',
      notes: ''
    });
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || provider.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'distributor': return 'bg-blue-100 text-blue-700';
      case 'reseller': return 'bg-purple-100 text-purple-700';
      case 'direct': return 'bg-green-100 text-green-700';
      case 'integrator': return 'bg-orange-100 text-orange-700';
      case 'manufacturer': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-mediumGray">Loading providers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-darkGray">Providers</h1>
          <p className="text-mediumGray">Manage distributors and resellers</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Add Provider
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={20} />
          <input
            type="text"
            placeholder="Search providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="distributor">Distributor</option>
          <option value="reseller">Reseller</option>
          <option value="direct">Direct</option>
          <option value="integrator">Integrator</option>
          <option value="manufacturer">Manufacturer</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Email/Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Payment Terms</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-mediumGray uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Store className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-mediumGray">No providers found. Add your first provider to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <Store size={16} className="text-gray-400" />
                        </div>
                        <span className="font-medium text-darkGray">{provider.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(provider.type)}`}>
                        {provider.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {provider.contact_name ? (
                        <div className="flex items-center gap-1 text-darkGray">
                          <User size={14} />
                          {provider.contact_name}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {provider.contact_email && (
                          <a href={`mailto:${provider.contact_email}`} className="text-primary hover:underline flex items-center gap-1 text-sm">
                            <Mail size={12} />
                            {provider.contact_email}
                          </a>
                        )}
                        {provider.contact_phone && (
                          <a href={`tel:${provider.contact_phone}`} className="text-darkGray flex items-center gap-1 text-sm">
                            <Phone size={12} />
                            {provider.contact_phone}
                          </a>
                        )}
                        {!provider.contact_email && !provider.contact_phone && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-darkGray">{provider.payment_terms || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(provider)}
                          className="p-1.5 text-primary hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(provider.id)}
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
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-darkGray">
                {editingId ? 'Edit Provider' : 'Add New Provider'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">
                  Provider Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Ingram Micro, CDW, Tech Data"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">
                  Type <span className="text-danger">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="distributor">Distributor</option>
                  <option value="reseller">Reseller</option>
                  <option value="direct">Direct</option>
                  <option value="integrator">Integrator</option>
                  <option value="manufacturer">Manufacturer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Contact Name</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Sales representative name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="contact@provider.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://provider.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Net 30, Net 60, COD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Additional information about this provider..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update Provider' : 'Add Provider'}
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
