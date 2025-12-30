import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Contact {
  id: string;
  organization_id: string;
  type: 'internal' | 'vendor' | 'provider' | 'client' | 'other';
  full_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  job_title: string | null;
  department: string | null;
  company: string | null;
  related_vendor_id: string | null;
  related_provider_id: string | null;
  is_primary_contact: boolean;
  notes: string | null;
  created_at: string;
  vendor?: { id: string; name: string };
  provider?: { id: string; name: string };
}

interface Vendor {
  id: string;
  name: string;
}

interface Provider {
  id: string;
  name: string;
}

export default function Contacts() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    type: 'internal' as Contact['type'],
    full_name: '',
    email: '',
    phone: '',
    mobile: '',
    job_title: '',
    department: '',
    company: '',
    related_vendor_id: '',
    related_provider_id: '',
    is_primary_contact: false,
    notes: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile]);

  useEffect(() => {
    let filtered = contacts;

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.type === typeFilter);
    }

    setFilteredContacts(filtered);
  }, [searchTerm, typeFilter, contacts]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [contactsRes, vendorsRes, providersRes] = await Promise.all([
        supabase
          .from('contacts')
          .select(`
            *,
            vendor:vendors(id, name),
            provider:providers(id, name)
          `)
          .eq('organization_id', profile!.organization_id)
          .order('full_name', { ascending: true }),
        supabase
          .from('vendors')
          .select('id, name')
          .eq('organization_id', profile!.organization_id)
          .order('name', { ascending: true }),
        supabase
          .from('providers')
          .select('id, name')
          .eq('organization_id', profile!.organization_id)
          .order('name', { ascending: true })
      ]);

      if (contactsRes.error) throw contactsRes.error;
      if (vendorsRes.error) throw vendorsRes.error;
      if (providersRes.error) throw providersRes.error;

      setContacts(contactsRes.data || []);
      setFilteredContacts(contactsRes.data || []);
      setVendors(vendorsRes.data || []);
      setProviders(providersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        type: contact.type,
        full_name: contact.full_name,
        email: contact.email || '',
        phone: contact.phone || '',
        mobile: contact.mobile || '',
        job_title: contact.job_title || '',
        department: contact.department || '',
        company: contact.company || '',
        related_vendor_id: contact.related_vendor_id || '',
        related_provider_id: contact.related_provider_id || '',
        is_primary_contact: contact.is_primary_contact,
        notes: contact.notes || ''
      });
    } else {
      setEditingContact(null);
      setFormData({
        type: 'internal',
        full_name: '',
        email: '',
        phone: '',
        mobile: '',
        job_title: '',
        department: '',
        company: '',
        related_vendor_id: '',
        related_provider_id: '',
        is_primary_contact: false,
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContact(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    setSaving(true);
    try {
      const contactData = {
        type: formData.type,
        full_name: formData.full_name,
        email: formData.email || null,
        phone: formData.phone || null,
        mobile: formData.mobile || null,
        job_title: formData.job_title || null,
        department: formData.department || null,
        company: formData.company || null,
        related_vendor_id: formData.related_vendor_id || null,
        related_provider_id: formData.related_provider_id || null,
        is_primary_contact: formData.is_primary_contact,
        notes: formData.notes || null
      };

      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', editingContact.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert({
            ...contactData,
            organization_id: profile.organization_id,
            created_by: profile.id
          });

        if (error) throw error;
      }

      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact: Contact) => {
    if (!confirm(`Are you sure you want to delete ${contact.full_name}?`)) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact. Please try again.');
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'internal': return 'bg-blue-100 text-blue-700';
      case 'vendor': return 'bg-purple-100 text-purple-700';
      case 'provider': return 'bg-green-100 text-green-700';
      case 'client': return 'bg-orange-100 text-orange-700';
      case 'other': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-mediumGray">Loading contacts...</div>
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
              placeholder="Search contacts by name or email..."
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
            <option value="internal">Internal</option>
            <option value="vendor">Vendor Contact</option>
            <option value="provider">Provider Contact</option>
            <option value="client">Client Contact</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Contact
        </button>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-darkGray mb-2">
            {contacts.length === 0 ? 'No contacts yet' : 'No contacts match your filters'}
          </h3>
          <p className="text-mediumGray mb-6">
            {contacts.length === 0
              ? 'Add your first contact to get started.'
              : 'Try adjusting your search or filters.'}
          </p>
          {contacts.length === 0 && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} />
              Add First Contact
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Type</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Phone</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Job Title</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-darkGray">Company</th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-darkGray">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-darkGray">{contact.full_name}</span>
                        {contact.is_primary_contact && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(contact.type)}`}>
                        {contact.type === 'internal' ? 'Internal' : contact.type === 'vendor' ? 'Vendor' : contact.type === 'provider' ? 'Provider' : contact.type === 'client' ? 'Client' : 'Other'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-mediumGray">{contact.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-mediumGray">{contact.phone || contact.mobile || '-'}</td>
                    <td className="px-6 py-4 text-sm text-mediumGray">{contact.job_title || '-'}</td>
                    <td className="px-6 py-4 text-sm text-mediumGray">
                      {contact.company || contact.vendor?.name || contact.provider?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(contact)}
                          className="p-1 text-mediumGray hover:text-primary transition-colors"
                          title="Edit contact"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(contact)}
                          className="p-1 text-mediumGray hover:text-danger transition-colors"
                          title="Delete contact"
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
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </h2>
              <button onClick={handleCloseModal} className="text-mediumGray hover:text-darkGray">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">
                  Contact Type <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Contact['type'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="internal">Internal</option>
                  <option value="vendor">Vendor Contact</option>
                  <option value="provider">Provider Contact</option>
                  <option value="client">Client Contact</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {formData.type === 'internal' ? (
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}

              {formData.type === 'vendor' && (
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Related Vendor</label>
                  <select
                    value={formData.related_vendor_id}
                    onChange={(e) => setFormData({ ...formData, related_vendor_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.type === 'provider' && (
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Related Provider</label>
                  <select
                    value={formData.related_provider_id}
                    onChange={(e) => setFormData({ ...formData, related_provider_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select provider</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>{provider.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={formData.is_primary_contact}
                  onChange={(e) => setFormData({ ...formData, is_primary_contact: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="is_primary" className="text-sm font-medium text-darkGray">
                  Mark as primary contact
                </label>
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
                  {saving ? 'Saving...' : editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
