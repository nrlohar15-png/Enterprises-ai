import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Building2, Users, Shield, Key, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Department } from '../../../shared/types/index.js';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab
  const getInitialTab = () => {
    if (location.pathname.includes('/organization')) return 'organization';
    if (location.pathname.includes('/members')) return 'members';
    if (location.pathname.includes('/security')) return 'security';
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'members' | 'security'>(getInitialTab());

  // Profile Form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Organization & Members
  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setTitle(user.title || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'organization' || activeTab === 'members') {
      api.getOrganization().then(setOrg).catch(console.error);
      api.getMembers().then(setMembers).catch(console.error);
      api.getDepartments().then(setDepartments).catch(console.error);
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    try {
      await api.updateProfile({ first_name: firstName, last_name: lastName, title });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await api.updateProfile({ current_password: currentPassword, new_password: newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdatingMemberId(memberId);
    try {
      await api.updateMemberRole(memberId, newRole);
      const updatedMembers = await api.getMembers();
      setMembers(updatedMembers);
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Organization & Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage identity, role-based access controls, security credentials, and organization policies
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        {[
          { key: 'profile', label: 'My Profile', icon: User, path: '/settings/profile' },
          { key: 'organization', label: 'Organization', icon: Building2, path: '/settings/organization' },
          { key: 'members', label: 'Members & Roles', icon: Users, path: '/settings/members' },
          { key: 'security', label: 'Security & Access', icon: Shield, path: '/settings/security' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                navigate(tab.path);
              }}
              className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
                isActive
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="enterprise-panel p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-100">Personal Information</h2>

          {profileSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile information successfully updated.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="enterprise-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="enterprise-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Business Email</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="enterprise-input opacity-60 cursor-not-allowed"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Email is managed by organizational SSO identity provider.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VP of Engineering"
              className="enterprise-input"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button type="submit" disabled={savingProfile} className="enterprise-btn-primary">
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Organization */}
      {activeTab === 'organization' && (
        <div className="enterprise-panel p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-100">Enterprise Tenant Information</h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Organization Name</span>
              <strong className="text-slate-200">{org?.name || user?.organization_name}</strong>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Tenant Slug</span>
              <span className="font-mono text-slate-300">{org?.slug || 'apex-global'}</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Verified Corporate Domain</span>
              <span className="text-slate-300">{org?.domain || 'apexglobal.com'}</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Subscription Tier</span>
              <span className="font-semibold text-brand-400 uppercase">Enterprise AI (Unlimited)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Members & Roles */}
      {activeTab === 'members' && (
        <div className="enterprise-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100">Team Members & Role Access Control (RBAC)</h2>
            <span className="text-xs text-slate-400">{members.length} Active Members</span>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
            {members.map((m) => (
              <div key={m.member_id} className="p-3.5 bg-slate-950/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
                    {m.first_name[0]}{m.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{m.first_name} {m.last_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{m.email} • {m.title || 'Staff'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={m.role}
                    disabled={user?.role !== 'organization_admin' || updatingMemberId === m.member_id}
                    onChange={(e) => handleRoleChange(m.member_id, e.target.value)}
                    className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 disabled:opacity-50"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="department_admin">Department Admin</option>
                    <option value="organization_admin">Organization Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="enterprise-panel p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-100">Security Credentials & Password</h2>

          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Password successfully updated.</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>{passwordError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="enterprise-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="enterprise-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="enterprise-input"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button type="submit" disabled={savingPassword} className="enterprise-btn-primary">
              {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Update Password</span>
            </button>
          </div>

          {/* Supabase Enterprise Integration Card */}
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-100">Supabase Cloud Database & Auth Integration</h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                ACTIVE & VERIFIED
              </span>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Connected Project URL</span>
                <span className="font-mono text-brand-400">https://ogimztpmxfvmpxfeceqd.supabase.co</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">JWKS Verification Endpoint</span>
                <span className="font-mono text-slate-300 truncate max-w-[280px]">.../.well-known/jwks.json</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Client Key (Anon/Publishable)</span>
                <span className="font-mono text-slate-400">sb_publishable_GNMdb...xIPqv24-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Multi-Tenant Data Isolation</span>
                <span className="text-slate-300">Server-Side RLS Enforcement</span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
