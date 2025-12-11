import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Users, UserPlus, Mail, Trash2,
  Check, X, Clock
} from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  scope: string;
  department?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  scope: string;
  department?: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}

export const TeamManagement: React.FC = () => {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const { data: membersData } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (membersData) setMembers(membersData);

      const { data: invitesData } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false });

      if (invitesData) setInvitations(invitesData);
    } catch (error) {
      console.error('Error loading team data:', error);
    }
    setLoading(false);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', memberId);

      loadTeamData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCancelInvitation = async (inviteId: string) => {
    try {
      await supabase
        .from('invitations')
        .delete()
        .eq('id', inviteId);

      loadTeamData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleResendInvitation = async (invite: Invitation) => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);

    try {
      await supabase
        .from('invitations')
        .update({
          expires_at: newExpiry.toISOString(),
          status: 'pending'
        })
        .eq('id', invite.id);

      alert(`Invitación reenviada a ${invite.email}`);
      loadTeamData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-green-100 text-green-800';
      case 'user': return 'bg-yellow-100 text-yellow-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Administrador',
      'manager': 'Gerente',
      'user': 'Usuario',
      'viewer': 'Solo Lectura'
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-darkGray">Equipo</h1>
          <p className="text-mediumGray">Gestiona los usuarios de tu organización</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
        >
          <UserPlus size={20} />
          Invitar Usuario
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-primary text-primary'
                : 'border-transparent text-mediumGray hover:text-darkGray'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            Miembros ({members.filter(m => m.is_active).length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'invitations'
                ? 'border-primary text-primary'
                : 'border-transparent text-mediumGray hover:text-darkGray'
            }`}
          >
            <Mail size={16} className="inline mr-2" />
            Invitaciones ({invitations.filter(i => i.status === 'pending').length})
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : activeTab === 'members' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-mediumGray uppercase">Usuario</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-mediumGray uppercase">Rol</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-mediumGray uppercase">Departamento</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-mediumGray uppercase">Último Acceso</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-mediumGray uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.filter(m => m.is_active).map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center font-medium">
                        {member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-darkGray">{member.full_name || 'Sin nombre'}</div>
                        <div className="text-sm text-mediumGray">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-mediumGray">
                    {member.department || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-mediumGray">
                    {member.last_login
                      ? new Date(member.last_login).toLocaleDateString()
                      : 'Nunca'
                    }
                  </td>
                  <td className="px-6 py-4">
                    {member.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Desactivar usuario"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {members.filter(m => m.is_active).length === 0 && (
            <div className="text-center py-12 text-mediumGray">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay miembros en el equipo</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-mediumGray uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-mediumGray uppercase">Rol</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-mediumGray uppercase">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-mediumGray uppercase">Expira</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-mediumGray uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invitations.map((invite) => (
                <tr key={invite.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Mail size={20} className="text-mediumGray" />
                      <span className="text-darkGray">{invite.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(invite.role)}`}>
                      {getRoleLabel(invite.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-sm ${
                      invite.status === 'pending' ? 'text-yellow-600' :
                      invite.status === 'accepted' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {invite.status === 'pending' && <Clock size={14} />}
                      {invite.status === 'accepted' && <Check size={14} />}
                      {invite.status === 'expired' && <X size={14} />}
                      {invite.status === 'pending' ? 'Pendiente' :
                       invite.status === 'accepted' ? 'Aceptada' : 'Expirada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-mediumGray">
                    {new Date(invite.expires_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {invite.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResendInvitation(invite)}
                            className="text-primary hover:text-primary-dark text-sm"
                          >
                            Reenviar
                          </button>
                          <button
                            onClick={() => handleCancelInvitation(invite.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invitations.length === 0 && (
            <div className="text-center py-12 text-mediumGray">
              <Mail size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay invitaciones pendientes</p>
            </div>
          )}
        </div>
      )}

      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadTeamData();
          }}
        />
      )}
    </div>
  );
};

interface InviteModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const InviteUserModal: React.FC<InviteModalProps> = ({ onClose, onSuccess }) => {
  const { user, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [department, setDepartment] = useState('');
  const [scope, setScope] = useState('assigned');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = crypto.randomUUID();

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          organization_id: profile?.organization_id,
          email: email.toLowerCase(),
          role,
          scope,
          department: department || null,
          token,
          status: 'pending',
          invited_by: user?.id,
          expires_at: expiresAt.toISOString()
        });

      if (inviteError) throw inviteError;

      const inviteLink = `${window.location.origin}/invite/${token}`;

      alert(`Invitación creada!\n\nEnvía este link al usuario:\n${inviteLink}`);

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al crear invitación');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-darkGray">Invitar Usuario</h2>
          <p className="text-sm text-mediumGray mt-1">Envía una invitación para unirse al equipo</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-darkGray mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-darkGray mb-1">
              Rol *
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="admin">Administrador - Acceso total</option>
              <option value="manager">Gerente - Puede crear y editar</option>
              <option value="user">Usuario - Acceso limitado</option>
              <option value="viewer">Solo Lectura - Solo puede ver</option>
            </select>
          </div>

          {(role === 'manager' || role === 'user') && (
            <div>
              <label className="block text-sm font-medium text-darkGray mb-1">
                Alcance de visibilidad
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="all">Todo - Ve todos los items</option>
                <option value="department">Departamento - Solo su departamento</option>
                <option value="assigned">Asignados - Solo items asignados</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-darkGray mb-1">
              Departamento (opcional)
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Ej: Ventas, Soporte, IT"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-darkGray mb-2">Permisos del rol:</p>
            <ul className="space-y-1 text-mediumGray">
              {role === 'admin' && (
                <>
                  <li>✓ Ver todos los items</li>
                  <li>✓ Crear, editar y eliminar</li>
                  <li>✓ Gestionar usuarios</li>
                  <li>✓ Exportar reportes</li>
                </>
              )}
              {role === 'manager' && (
                <>
                  <li>✓ Ver items según alcance</li>
                  <li>✓ Crear y editar items</li>
                  <li>✗ No puede eliminar</li>
                  <li>✓ Exportar reportes</li>
                </>
              )}
              {role === 'user' && (
                <>
                  <li>✓ Ver items asignados</li>
                  <li>✓ Crear items</li>
                  <li>✓ Editar items propios</li>
                  <li>✗ No puede eliminar</li>
                </>
              )}
              {role === 'viewer' && (
                <>
                  <li>✓ Ver items según alcance</li>
                  <li>✗ No puede crear</li>
                  <li>✗ No puede editar</li>
                  <li>✗ No puede eliminar</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-darkGray rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
