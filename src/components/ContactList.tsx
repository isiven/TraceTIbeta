import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Edit2, Trash2, Users, Mail, Phone, Briefcase, Star } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Contact {
  id: string;
  type: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  job_title: string | null;
  department: string | null;
  company: string | null;
  related_vendor_id: string | null;
  related_provider_id: string | null;
  related_client_id: string | null;
  is_primary_contact: boolean;
  notes: string | null;
  vendor?: { name: string };
  provider?: { name: string };
  client?: { name: string };
}

interface Vendor {
  id: string;
  name: string;
}

interface Provider {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
}

export default function ContactList() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
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
    related_client_id: '',
    is_primary_contact: false,
    notes: ''
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contactsRes, vendorsRes, providersRes, clientsRes] = await Promise.all([
        supabase
          .from('contacts')
          .select(`
            *,
            vendor:vendors(name),
            provider:providers(name),
            client:organizations!contacts_related_client_id_fkey(name)
          `)
          .eq('organization_id', profile!.organization_id)
          .order('full_name'),
        supabase
          .from('vendors')
          .select('id, name')
          .eq('organization_id', profile!.organization_id)
          .order('name'),
        supabase
          .from('providers')
          .select('id, name')
          .eq('organization_id', profile!.organization_id)
          .order('name'),
        supabase
          .from('organizations')
          .select('id, name')
          .order('name')
      ]);

      if (contactsRes.error) throw contactsRes.error;
      if (vendorsRes.error) throw vendorsRes.error;
      if (providersRes.error) throw providersRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setContacts(contactsRes.data || []);
      setVendors(vendorsRes.data || []);
      setProviders(providersRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        related_client_id: formData.related_client_id || null,
        is_primary_contact: formData.is_primary_contact,
        notes: formData.notes || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert({
            ...contactData,
            organization_id: profile!.organization_id,
            created_by: profile!.id
          });

        if (error) throw error;
      }

      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact. Please try again.');
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingId(contact.id);
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
      related_client_id: contact.related_client_id || '',
      is_primary_contact: contact.is_primary_contact,
      notes: contact.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
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
      related_client_id: '',
      is_primary_contact: false,
      notes: ''
    });
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || contact.type === typeFilter;
    return matchesSearch && matchesType;
  });

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

  const getRelatedEntity = (contact: Contact) => {
    if (contact.related_vendor_id && contact.vendor) return contact.vendor.name;
    if (contact.related_provider_id && contact.provider) return contact.provider.name;
    if (contact.related_client_id && contact.client) return contact.client.name;
    return contact.company || '-';
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-darkGray">Contacts</h1>
          <p className="text-mediumGray">Manage all your contacts in one place</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Add Contact
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mediumGray" size={20} />
          <input
            type="text"
            placeholder="Search contacts..."
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
          <option value="internal">Internal</option>
          <option value="vendor">Vendor</option>
          <option value="provider">Provider</option>
          <option value="client">Client</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Job Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-mediumGray uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-mediumGray uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-mediumGray">No contacts found. Add your first contact to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users size={16} className="text-gray-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-darkGray">{contact.full_name}</span>
                            {contact.is_primary_contact && (
                              <Star size={14} className="text-yellow-500 fill-yellow-500" title="Primary Contact" />
                            )}
                          </div>
                          {contact.department && (
                            <div className="text-xs text-mediumGray">{contact.department}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(contact.type)}`}>
                        {contact.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.job_title ? (
                        <div className="flex items-center gap-1 text-darkGray">
                          <Briefcase size={14} />
                          {contact.job_title}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-darkGray">{getRelatedEntity(contact)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-primary hover:underline flex items-center gap-1 text-sm">
                            <Mail size={12} />
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="text-darkGray flex items-center gap-1 text-sm">
                            <Phone size={12} />
                            {contact.phone}
                          </a>
                        )}
                        {!contact.email && !contact.phone && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(contact)}
                          className="p-1.5 text-primary hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
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
                {editingId ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="John Doe"
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
                    <option value="internal">Internal</option>
                    <option value="vendor">Vendor</option>
                    <option value="provider">Provider</option>
                    <option value="client">Client</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="+1 (555) 987-6543"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., IT Manager"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., IT, Sales"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium text-darkGray mb-3">Related Entity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-darkGray mb-1">Vendor</label>
                    <select
                      value={formData.related_vendor_id}
                      onChange={(e) => setFormData({ ...formData, related_vendor_id: e.target.value, related_provider_id: '', related_client_id: '' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">None</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-darkGray mb-1">Provider</label>
                    <select
                      value={formData.related_provider_id}
                      onChange={(e) => setFormData({ ...formData, related_provider_id: e.target.value, related_vendor_id: '', related_client_id: '' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">None</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-darkGray mb-1">Client</label>
                    <select
                      value={formData.related_client_id}
                      onChange={(e) => setFormData({ ...formData, related_client_id: e.target.value, related_vendor_id: '', related_provider_id: '' })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">None</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary_contact"
                  checked={formData.is_primary_contact}
                  onChange={(e) => setFormData({ ...formData, is_primary_contact: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="is_primary_contact" className="text-sm font-medium text-darkGray">
                  Mark as primary contact
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGray mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Additional information about this contact..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Update Contact' : 'Add Contact'}
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
