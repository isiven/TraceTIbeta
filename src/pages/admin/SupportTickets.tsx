import React, { useState, useEffect } from 'react';
import { MessageSquare, Filter, X, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';

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
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  organization?: {
    name: string;
  };
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

export default function SupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

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
        .select(`
          *,
          organization:organizations(name)
        `)
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
          setMessages((prev) => [...prev, payload.new as TicketMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus as any } : t))
      );

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as any });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handlePriorityChange = async (ticketId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ priority: newPriority })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, priority: newPriority as any } : t))
      );

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, priority: newPriority as any });
      }
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        user_name: profile?.full_name || 'Admin',
        message: newMessage,
        is_internal: isInternal,
      });

      if (error) throw error;

      setNewMessage('');
      setIsInternal(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesSearch =
      searchTerm === '' ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.organization?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">Manage all support tickets across organizations</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
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
              {filteredTickets.map((ticket) => {
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.organization?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.user_name}</div>
                      <div className="text-sm text-gray-500">{ticket.user_email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                      {ticket.subject}
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

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tickets found</p>
            </div>
          )}
        </div>
      </div>

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
                      <strong>From:</strong> {selectedTicket.user_name} ({selectedTicket.user_email})
                    </span>
                    <span>
                      <strong>Organization:</strong> {selectedTicket.organization?.name || 'N/A'}
                    </span>
                    <span>
                      <strong>Created:</strong> {new Date(selectedTicket.created_at).toLocaleString()}
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

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Priority:</label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handlePriorityChange(selectedTicket.id, e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Category:</label>
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">
                    {selectedTicket.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Initial Description:</div>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`border rounded-lg p-4 ${
                    message.is_internal
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{message.user_name}</span>
                      {message.is_internal && (
                        <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-medium rounded">
                          Internal Note
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="space-y-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Internal note (only visible to admins)</span>
                  </label>
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
