import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Provider {
  id: string;
  organization_id: string;
  name: string;
  type: 'distributor' | 'reseller' | 'direct' | 'integrator' | 'manufacturer';
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  payment_terms: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
}

const PROVIDER_SUGGESTIONS = [
  'Ingram Micro', 'Tech Data', 'Arrow Electronics', 'CDW', 'SHI International',
  'Insight Enterprises', 'Synnex', 'Westcon-Comstor', 'D&H Distributing',
  'Zones', 'Connection', 'PCM', 'GovConnection', 'ePlus'
];

export default function Providers() {
  const { profile } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'distributor' as Provider['type'],
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

  useEffect(() => {
    let filtered = providers;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter);
    }

    setFilteredProviders(filtered);
  }, [searchTerm, typeFilter, providers]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('organization_id', profile!.organization_id)
        .order('name', { ascending: true });

      if (error) throw error;
      setProviders(data || []);
      setFilteredProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
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
    } else {
      setEditingProvider(null);
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
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProvider(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    setSaving(true);
    try {
      if (editingProvider) {
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
          .eq('id', editingProvider.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('providers')
          .insert({
            organization_id: profile.organization_id,
            name: formData.name,
            type: formData.type,
            contact_name: formData.contact_name || null,
            contact_email: formData.contact_email || null,
            contact_phone: formData.contact_phone || null,
            payment_terms: formData.payment_terms || null,
            website: formData.website || null,
            notes: formData.notes || null,
            created_by: profile.id
          });

        if (error) throw error;
      }

      await fetchProviders();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving provider:', error);
      alert('Failed to save provider. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (provider: Provider) => {
    if (!confirm(`Are you sure you want to delete ${provider.name}?`)) return;

    try {
      const { error } = await supabase
        .from('providers')
        .delete()
        .eq('id', provider.id);

      if (error) throw error;
      await fetchProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      alert('Failed to delete provider. Please try again.');
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'distributor': return 'bg-blue-100 text-blue-700';
      case 'reseller': return 'bg-green-100 text-green-700';
      case 'direct': return 'bg-purple-100 text-purple-700';
      case 'integrator': return 'bg-orange-100 text-orange-700';
      case 'manufacturer': return 'bg-gray-100 text-gray-700';
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="distributor">Distributor</option>
            <option value="reseller">Reseller</option>
            <option value="direct">Direct</option>
            <option value="integrator">Integrator</option>
            <option value="manufacturer">Manufacturer</option>
          </select>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Provider
        </button>
      </div>

      {filteredProviders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Truck className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-darkGray mb-2">
            {providers.length === 0 ? 'No providers yet' : 'No providers match your filters'}
          </h3>
          <p className="text-mediumGray mb-6">
            {providers.length === 0
              ? 'Add your first provider to get started.'
              : 'Try adjusting your search or filters.'}
          </p>
          {providers.length === 0 && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} />
              Add First Provider
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Type</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Contact Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Contact Email</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Payment Terms</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Created</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-darkGray">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-darkGray">{provider.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(provider.type)}`}>
                      {provider.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-mediumGray">{provider.contact_name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-mediumGray">{provider.contact_email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-mediumGray">{provider.payment_terms || '-'}</td>
                  <td className="px-6 py-4 text-sm text-mediumGray">
                    {new Date(provider.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(provider)}
                        className="p-1 text-mediumGray hover:text-primary transition-colors"
                        title="Edit provider"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(provider)}
                        className="p-1 text-mediumGray hover:text-danger transition-colors"
                        title="Delete provider"
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
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-darkGray">
                {editingProvider ? 'Edit Provider' : 'Add Provider'}
              </h2>
              <button onClick={handleCloseModal} className="text-mediumGray hover:text-darkGray">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">
                  Provider Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  list="provider-suggestions"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <datalist id="provider-suggestions">
                  {PROVIDER_SUGGESTIONS.map(suggestion => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">
                  Type <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Provider['type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="contact@provider.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Payment Terms</label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select payment terms</option>
                  <option value="NET 30">NET 30</option>
                  <option value="NET 60">NET 60</option>
                  <option value="NET 90">NET 90</option>
                  <option value="Prepaid">Prepaid</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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
                  {saving ? 'Saving...' : editingProvider ? 'Update Provider' : 'Add Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
