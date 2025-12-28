import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, X, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';

interface Ticket {
  id: string;
  organization_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

const priorityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusIcons = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: XCircle,
};

export default function HelpCenter() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'technical',
    priority: 'medium',
  });

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      subscribeToMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = (ticketId: string) => {
    const subscription = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const newMsg = payload.new as TicketMessage;
          if (!newMsg.is_internal) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) return;

    try {
      const { error } = await supabase.from('support_tickets').insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        user_email: user.email || '',
        user_name: profile.full_name || 'User',
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: 'open',
      });

      if (error) throw error;

      setFormData({
        subject: '',
        description: '',
        category: 'technical',
        priority: 'medium',
      });
      setShowCreateModal(false);
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user || !profile) return;

    try {
      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        user_name: profile.full_name || 'User',
        message: newMessage,
        is_internal: false,
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-600">Get help with your questions and issues</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No support tickets yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first ticket to get help from our support team
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Ticket
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => {
                  const StatusIcon = statusIcons[ticket.status];
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        #{ticket.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {ticket.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {ticket.category.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityColors[ticket.priority]}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[ticket.status]}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Create Support Ticket</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Please provide detailed information about your issue..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug">Bug Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </Button>
                <Button type="submit">Create Ticket</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                    <span className="text-sm font-mono text-gray-500">
                      #{selectedTicket.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      <strong>Created:</strong> {new Date(selectedTicket.created_at).toLocaleString()}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[selectedTicket.status]}`}
                    >
                      {statusIcons[selectedTicket.status] &&
                        React.createElement(statusIcons[selectedTicket.status], {
                          className: 'w-3 h-3',
                        })}
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityColors[selectedTicket.priority]}`}
                    >
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Initial Description:</div>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {messages.map((message) => (
                <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-gray-900">{message.user_name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
                </div>
              ))}
            </div>

            {selectedTicket.status !== 'closed' && (
              <div className="p-6 border-t border-gray-200">
                <div className="space-y-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
