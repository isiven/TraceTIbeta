import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Vendor {
  id: string;
  organization_id: string;
  name: string;
  type: 'software' | 'hardware' | 'both' | 'service';
  website: string | null;
  support_email: string | null;
  support_phone: string | null;
  notes: string | null;
  created_at: string;
}

const VENDOR_SUGGESTIONS = [
  'Microsoft', 'Cisco', 'Dell', 'HP', 'Adobe', 'VMware', 'Veeam',
  'Lenovo', 'IBM', 'Oracle', 'SAP', 'Salesforce', 'Apple', 'Google',
  'Amazon Web Services', 'Fortinet', 'Palo Alto Networks', 'Sophos'
];

export default function Vendors() {
  const { profile } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'both' as Vendor['type'],
    website: '',
    support_email: '',
    support_phone: '',
    notes: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchVendors();
    }
  }, [profile]);

  useEffect(() => {
    let filtered = vendors;

    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.type === typeFilter);
    }

    setFilteredVendors(filtered);
  }, [searchTerm, typeFilter, vendors]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('organization_id', profile!.organization_id)
        .order('name', { ascending: true });

      if (error) throw error;
      setVendors(data || []);
      setFilteredVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        type: vendor.type,
        website: vendor.website || '',
        support_email: vendor.support_email || '',
        support_phone: vendor.support_phone || '',
        notes: vendor.notes || ''
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        type: 'both',
        website: '',
        support_email: '',
        support_phone: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVendor(null);
    setFormData({
      name: '',
      type: 'both',
      website: '',
      support_email: '',
      support_phone: '',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    setSaving(true);
    try {
      if (editingVendor) {
        const { error } = await supabase
          .from('vendors')
          .update({
            name: formData.name,
            type: formData.type,
            website: formData.website || null,
            support_email: formData.support_email || null,
            support_phone: formData.support_phone || null,
            notes: formData.notes || null
          })
          .eq('id', editingVendor.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert({
            organization_id: profile.organization_id,
            name: formData.name,
            type: formData.type,
            website: formData.website || null,
            support_email: formData.support_email || null,
            support_phone: formData.support_phone || null,
            notes: formData.notes || null,
            created_by: profile.id
          });

        if (error) throw error;
      }

      await fetchVendors();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Failed to save vendor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vendor: Vendor) => {
    if (!confirm(`Are you sure you want to delete ${vendor.name}?`)) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendor.id);

      if (error) throw error;
      await fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Failed to delete vendor. Please try again.');
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'software': return 'bg-blue-100 text-blue-700';
      case 'hardware': return 'bg-gray-100 text-gray-700';
      case 'both': return 'bg-purple-100 text-purple-700';
      case 'service': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-mediumGray">Loading vendors...</div>
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
              placeholder="Search vendors..."
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
            <option value="software">Software</option>
            <option value="hardware">Hardware</option>
            <option value="both">Both</option>
            <option value="service">Service</option>
          </select>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Vendor
        </button>
      </div>

      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-darkGray mb-2">
            {vendors.length === 0 ? 'No vendors yet' : 'No vendors match your filters'}
          </h3>
          <p className="text-mediumGray mb-6">
            {vendors.length === 0
              ? 'Add your first vendor to get started.'
              : 'Try adjusting your search or filters.'}
          </p>
          {vendors.length === 0 && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} />
              Add First Vendor
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
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Website</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Support Email</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Created</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-darkGray">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-darkGray">{vendor.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(vendor.type)}`}>
                      {vendor.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-mediumGray">
                    {vendor.website ? (
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {vendor.website}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-mediumGray">{vendor.support_email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-mediumGray">
                    {new Date(vendor.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(vendor)}
                        className="p-1 text-mediumGray hover:text-primary transition-colors"
                        title="Edit vendor"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor)}
                        className="p-1 text-mediumGray hover:text-danger transition-colors"
                        title="Delete vendor"
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
                {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
              </h2>
              <button onClick={handleCloseModal} className="text-mediumGray hover:text-darkGray">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">
                  Vendor Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  list="vendor-suggestions"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <datalist id="vendor-suggestions">
                  {VENDOR_SUGGESTIONS.map(suggestion => (
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
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Vendor['type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="software">Software</option>
                  <option value="hardware">Hardware</option>
                  <option value="both">Both</option>
                  <option value="service">Service</option>
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
                <label className="block text-sm font-medium text-darkGray mb-1">Support Email</label>
                <input
                  type="email"
                  value={formData.support_email}
                  onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                  placeholder="support@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Support Phone</label>
                <input
                  type="tel"
                  value={formData.support_phone}
                  onChange={(e) => setFormData({ ...formData, support_phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
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
                  {saving ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
