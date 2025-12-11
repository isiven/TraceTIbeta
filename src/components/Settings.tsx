
import React, { useState, useEffect, useRef } from 'react';
import { User, Bell, Building, CreditCard, Plus, X, UploadCloud, Check, Save } from 'lucide-react';
import { Button } from './Button';
import { useData } from '../context/DataContext';
import { NotificationSettings } from './NotificationSettings';

type SettingsTab = 'profile' | 'company' | 'notifications' | 'billing';

export const Settings: React.FC = () => {
  const { user, updateUser, companySettings, updateCompanySettings } = useData();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaved, setIsSaved] = useState(false);

  console.log('⚙️ Settings: usuario actual:', user);
  console.log('⚙️ Settings: company settings:', companySettings);

  // Profile Local State
  const [profileForm, setProfileForm] = useState({
      name: user.name,
      avatar: user.avatar
  });
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Company Local State
  const [companyForm, setCompanyForm] = useState(companySettings);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Reset save toast after 3 seconds
  useEffect(() => {
      if (isSaved) {
          const timer = setTimeout(() => setIsSaved(false), 3000);
          return () => clearTimeout(timer);
      }
  }, [isSaved]);

  // Generic Image Handler (Converts to Base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'company') => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Limit size to 500KB to preserve LocalStorage space
      if (file.size > 500 * 1024) {
          alert("File is too large. Please upload an image under 500KB.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          const base64String = reader.result as string;
          if (type === 'profile') {
              setProfileForm(prev => ({ ...prev, avatar: base64String }));
          } else {
              setCompanyForm(prev => ({ ...prev, logo: base64String }));
          }
      };
      reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
      e.preventDefault();
      updateUser({
          ...user,
          name: profileForm.name,
          avatar: profileForm.avatar // Now saves the Base64 string
      });
      setIsSaved(true);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
      e.preventDefault();
      updateCompanySettings(companyForm);
      setIsSaved(true);
  };

  const SidebarItem = ({ id, label, icon: Icon }: { id: SettingsTab; label: string; icon: React.ElementType }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
        activeTab === id 
          ? 'bg-white border border-gray-200 text-primary shadow-sm' 
          : 'text-mediumGray hover:bg-gray-50 hover:text-darkGray'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  // Helper to check if avatar is an image URL/Base64 or just initials
  const isImage = (str: string) => str.startsWith('data:image') || str.startsWith('http');

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh]">
      {/* Settings Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <h2 className="text-xl font-bold text-darkGray mb-6">Settings</h2>
        <nav className="space-y-1">
          <SidebarItem id="profile" label="Profile" icon={User} />
          <SidebarItem id="company" label="Company" icon={Building} />
          <SidebarItem id="notifications" label="Notifications" icon={Bell} />
          <SidebarItem id="billing" label="Billing" icon={CreditCard} />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
        
        {isSaved && (
            <div className="absolute top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 z-10">
                <Check size={16} />
                <span className="text-sm font-medium">Settings saved successfully</span>
            </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <>
            <h3 className="text-lg font-bold text-darkGray mb-8 pb-4 border-b border-gray-100">Profile Settings</h3>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                  {isImage(profileForm.avatar) ? (
                      <img 
                        src={profileForm.avatar} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" 
                      />
                  ) : (
                      <div className="w-24 h-24 bg-gray-100 text-mediumGray rounded-full flex items-center justify-center text-3xl font-bold border-2 border-gray-200">
                        {profileForm.avatar}
                      </div>
                  )}
              </div>
              
              <div>
                <h4 className="font-bold text-darkGray text-lg">{user.name}</h4>
                <p className="text-mediumGray text-sm mb-3 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                <input 
                    type="file" 
                    ref={profileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'profile')}
                />
                <Button variant="secondary" className="h-9 text-xs px-4" onClick={() => profileInputRef.current?.click()}>
                    Upload New Photo
                </Button>
              </div>
            </div>

            <form className="space-y-6 max-w-2xl" onSubmit={handleSaveProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-darkGray">Full Name</label>
                  <input 
                    type="text" 
                    value={profileForm.name} 
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-darkGray">Email Address</label>
                  <input type="email" defaultValue={user.email} disabled className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg outline-none cursor-not-allowed" />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h4 className="font-bold text-darkGray mb-4">Change Password</h4>
                <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-darkGray">Current Password</label>
                      <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-darkGray">New Password</label>
                            <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-darkGray">Confirm New Password</label>
                            <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                    </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </>
        )}

        {/* COMPANY TAB */}
        {activeTab === 'company' && (
          <>
             <h3 className="text-lg font-bold text-darkGray mb-8 pb-4 border-b border-gray-100">Company Settings</h3>
             <form className="space-y-8 max-w-2xl" onSubmit={handleSaveCompany}>
                
                <div className="space-y-4">
                    <label className="text-sm font-semibold text-darkGray">Company Logo</label>
                    <input 
                        type="file" 
                        ref={logoInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'company')}
                    />
                    <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-primary transition-all group relative overflow-hidden"
                        onClick={() => logoInputRef.current?.click()}
                    >
                        {companyForm.logo ? (
                            <img src={companyForm.logo} alt="Company Logo" className="h-16 object-contain mb-2 relative z-10" />
                        ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-mediumGray group-hover:text-primary transition-colors">
                                <UploadCloud size={24} />
                            </div>
                        )}
                        <p className="text-sm font-medium text-darkGray">{companyForm.logo ? 'Click to change logo' : 'Click to upload logo'}</p>
                        <p className="text-xs text-mediumGray mt-1">PNG, JPG up to 500KB (200x60px recommended)</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-darkGray">Company Name</label>
                        <input 
                            type="text" 
                            value={companyForm.name}
                            onChange={e => setCompanyForm({...companyForm, name: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-sm font-semibold text-darkGray">Industry</label>
                            <select 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                                value={companyForm.industry}
                                onChange={e => setCompanyForm({...companyForm, industry: e.target.value})}
                            >
                                <option>IT Services & Consulting</option>
                                <option>Healthcare</option>
                                <option>Finance</option>
                                <option>Manufacturing</option>
                                <option>Retail</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-sm font-semibold text-darkGray">Time Zone</label>
                            <select 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                                value={companyForm.timezone}
                                onChange={e => setCompanyForm({...companyForm, timezone: e.target.value})}
                            >
                                <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                                <option>(GMT-05:00) Bogota, Lima, Quito, Rio Branco</option>
                            </select>
                         </div>
                    </div>
                </div>

                <div className="pt-6 flex justify-end">
                    <Button type="submit">Save Company Details</Button>
                </div>
             </form>
          </>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <>
             <h3 className="text-lg font-bold text-darkGray mb-8 pb-4 border-b border-gray-100">Notification Preferences</h3>
             <NotificationSettings />
          </>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <>
             <h3 className="text-lg font-bold text-darkGray mb-8 pb-4 border-b border-gray-100">Billing & Subscription</h3>
             
             <div className="max-w-3xl space-y-8">
                 {/* Current Plan Card */}
                 <div className="bg-gradient-to-br from-darkGray to-black text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <CreditCard size={120} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full mb-3">FREE TRIAL</span>
                                <h2 className="text-3xl font-bold">Business Plan Trial</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-sm">Trial Ends</p>
                                <p className="font-semibold">Jan 10, 2026</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-300">30 days remaining</span>
                                <span className="font-semibold">60%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[60%] rounded-full"></div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg font-semibold transition-colors">
                                Upgrade to Pro
                            </button>
                            <button className="bg-transparent border border-white/30 hover:bg-white/10 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors">
                                Billing History
                            </button>
                        </div>
                    </div>
                 </div>

                 {/* Usage Stats */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                        <h4 className="font-bold text-darkGray mb-4">License Usage</h4>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-bold text-darkGray">47</span>
                            <span className="text-mediumGray mb-1">/ 500</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-blue-500 w-[10%] rounded-full"></div>
                        </div>
                        <p className="text-xs text-mediumGray">You're using 10% of your license limit</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                        <h4 className="font-bold text-darkGray mb-4">Storage Usage</h4>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-bold text-darkGray">0.5</span>
                            <span className="text-mediumGray mb-1">GB / 50 GB</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-purple-500 w-[1%] rounded-full"></div>
                        </div>
                        <p className="text-xs text-mediumGray">Plenty of space available</p>
                    </div>
                 </div>

                 {/* Feature Comparison / Call to Action */}
                 <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                     <div>
                        <h4 className="font-bold text-darkGray">Need more power?</h4>
                        <p className="text-sm text-mediumGray mt-1">Get unlimited licenses, advanced features, and priority support with our Pro plan.</p>
                     </div>
                     <Button>View Plans</Button>
                 </div>
             </div>
          </>
        )}

      </div>
    </div>
  );
};
