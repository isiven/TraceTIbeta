import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Bell, Mail, Clock, Users, CreditCard, BarChart3, CheckCircle2, Plus, Trash2, UserPlus } from 'lucide-react';
import { USER_NOTIFICATIONS, NOTIFICATION_CATEGORIES } from '../lib/notificationTypes';

const iconMap = {
  Clock,
  Users,
  BarChart3,
  CreditCard
};

interface Recipient {
  id: string;
  email: string;
  name?: string;
}

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [newRecipient, setNewRecipient] = useState({ email: '', name: '' });

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;

      // Load notification preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setPreferences(data.preferences || {});
        setEmailEnabled(data.email_enabled ?? true);
      } else {
        const defaults: Record<string, boolean> = {};
        Object.values(USER_NOTIFICATIONS).forEach(notif => {
          defaults[notif.id] = notif.defaultEnabled;
        });
        setPreferences(defaults);
      }

      // Load recipients
      const { data: recipientsData } = await supabase
        .from('notification_recipients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (recipientsData) {
        setRecipients(recipientsData);
      }

      setLoading(false);
    };

    loadPreferences();
  }, [user]);

  const savePreferences = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        email_enabled: emailEnabled,
        preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving preferences. Please try again.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const toggleNotification = (notifId: string) => {
    setPreferences(prev => ({
      ...prev,
      [notifId]: !prev[notifId]
    }));
  };

  const toggleCategory = (category: string, enabled: boolean) => {
    const updates: Record<string, boolean> = {};
    Object.values(USER_NOTIFICATIONS)
      .filter(n => n.category === category)
      .forEach(n => { updates[n.id] = enabled; });
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const addRecipient = async () => {
    if (!user?.id || !newRecipient.email.trim()) return;

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(newRecipient.email)) {
      alert('Please enter a valid email address');
      return;
    }

    const { data, error } = await supabase
      .from('notification_recipients')
      .insert({
        user_id: user.id,
        email: newRecipient.email.trim(),
        name: newRecipient.name.trim() || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        alert('This email is already in your recipients list');
      } else {
        console.error('Error adding recipient:', error);
        alert('Error adding recipient. Please try again.');
      }
    } else if (data) {
      setRecipients(prev => [...prev, data]);
      setNewRecipient({ email: '', name: '' });
      setShowAddRecipient(false);
    }
  };

  const deleteRecipient = async (recipientId: string) => {
    if (!confirm('Are you sure you want to remove this recipient?')) return;

    const { error } = await supabase
      .from('notification_recipients')
      .delete()
      .eq('id', recipientId);

    if (error) {
      console.error('Error deleting recipient:', error);
      alert('Error removing recipient. Please try again.');
    } else {
      setRecipients(prev => prev.filter(r => r.id !== recipientId));
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Mail className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive notifications at {user?.email}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      {emailEnabled && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <UserPlus className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Additional Recipients</h3>
                <p className="text-sm text-gray-500">Add other people to receive notifications</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddRecipient(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Add Recipient
            </button>
          </div>

          {recipients.length > 0 ? (
            <div className="space-y-2">
              {recipients.map(recipient => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Mail size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{recipient.name || recipient.email}</p>
                      {recipient.name && (
                        <p className="text-xs text-gray-500">{recipient.email}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRecipient(recipient.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove recipient"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserPlus size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No additional recipients yet</p>
              <p className="text-xs mt-1">Add recipients to copy them on all notifications</p>
            </div>
          )}

          {showAddRecipient && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="recipient@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addRecipient}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                  >
                    Add Recipient
                  </button>
                  <button
                    onClick={() => {
                      setShowAddRecipient(false);
                      setNewRecipient({ email: '', name: '' });
                    }}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {emailEnabled && (
        <div className="space-y-4">
          {Object.entries(NOTIFICATION_CATEGORIES).map(([categoryKey, category]) => {
            const IconComponent = iconMap[category.icon as keyof typeof iconMap];
            const categoryNotifications = Object.values(USER_NOTIFICATIONS)
              .filter(n => n.category === categoryKey);
            const enabledCount = categoryNotifications.filter(n => preferences[n.id]).length;
            const allEnabled = enabledCount === categoryNotifications.length;
            const someEnabled = enabledCount > 0 && !allEnabled;

            return (
              <div key={categoryKey} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="text-gray-500" size={20} />
                    <div>
                      <h4 className="font-medium">{category.label}</h4>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {enabledCount}/{categoryNotifications.length}
                    </span>
                    <button
                      onClick={() => toggleCategory(categoryKey, !allEnabled)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors font-medium ${
                        allEnabled
                          ? 'bg-primary text-white'
                          : someEnabled
                            ? 'bg-primary/20 text-primary'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {allEnabled ? 'All On' : someEnabled ? 'Some On' : 'All Off'}
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {categoryNotifications.map(notif => {
                    const isEnabled = preferences[notif.id] ?? notif.defaultEnabled;
                    return (
                      <div key={notif.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{notif.label}</p>
                          <p className="text-sm text-gray-500">{notif.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => toggleNotification(notif.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!emailEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <Bell className="mx-auto mb-2 text-amber-600" size={32} />
          <p className="text-amber-900 font-medium">Email notifications are disabled</p>
          <p className="text-sm text-amber-700 mt-1">
            Enable email notifications to receive important alerts about your assets
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 size={18} />
              Saved!
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  );
};
