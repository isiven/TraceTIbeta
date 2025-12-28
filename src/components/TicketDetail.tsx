import { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import { superAdminApi, SupportTicket, TicketMessage } from '../lib/superAdminApi';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { supabase } from '../lib/supabase';

interface TicketDetailProps {
  ticketId: string;
  onClose: () => void;
}

export function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = user?.permissionRole === 'super_admin';

  useEffect(() => {
    loadTicket();
    setupRealtimeSubscription();
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const result = await superAdminApi.getTicket(ticketId);
      setTicket(result.ticket);
      setMessages(result.messages);
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
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
          if (!isSuperAdmin && newMsg.is_internal) return;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await superAdminApi.addTicketMessage(ticketId, {
        message: newMessage,
        is_internal: isInternal && isSuperAdmin,
      });
      setNewMessage('');
      setIsInternal(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje. Por favor intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await superAdminApi.updateTicket(ticketId, { status: newStatus });
      loadTicket();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado.');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await superAdminApi.updateTicket(ticketId, { priority: newPriority });
      loadTicket();
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Error al actualizar la prioridad.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-gray-500">Cargando ticket...</div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 h-[90vh] flex flex-col">
        <div className="flex justify-between items-start p-6 border-b">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span>De: {ticket.user_name}</span>
              <span>•</span>
              <span>Categoría: {ticket.category}</span>
              <span>•</span>
              <span>
                Creado: {new Date(ticket.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isSuperAdmin && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="waiting">Esperando</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{ticket.user_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(ticket.created_at).toLocaleString('es-ES')}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg p-4 ${
                message.is_internal
                  ? 'bg-yellow-50 border border-yellow-200'
                  : message.user_role === 'super_admin'
                  ? 'bg-blue-50'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start">
                <div
                  className={`rounded-full p-2 mr-3 ${
                    message.is_internal
                      ? 'bg-yellow-200'
                      : message.user_role === 'super_admin'
                      ? 'bg-blue-100'
                      : 'bg-gray-200'
                  }`}
                >
                  <User
                    className={`w-5 h-5 ${
                      message.is_internal
                        ? 'text-yellow-700'
                        : message.user_role === 'super_admin'
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{message.user_name}</span>
                      {message.is_internal && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                          Nota Interna
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-gray-50">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={sending}
            />
            <div className="flex justify-between items-center">
              {isSuperAdmin && (
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Nota interna (solo visible para admins)
                </label>
              )}
              <div className={!isSuperAdmin ? 'ml-auto' : ''}>
                <Button type="submit" disabled={sending || !newMessage.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
