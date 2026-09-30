import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Search,
  CheckSquare,
  Briefcase,
  Building2,
  FileText,
  Calendar,
  Sparkles,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Shield,
  UserCheck,
  User,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { GlobalSearchModal } from '../components/GlobalSearchModal.js';
import { AITaskGeneratorModal } from '../components/AITaskGeneratorModal.js';

export const AppLayout: React.FC = () => {
  const { user, logout, switchDemoUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiTaskModalOpen, setAiTaskModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Assistant', path: '/assistant', icon: Bot, badge: 'Intelligence' },
    { label: 'Global Search', path: '/search', icon: Search },
    { section: 'Work Management' },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Projects', path: '/projects', icon: Briefcase },
    { label: 'Departments', path: '/departments', icon: Building2 },
    { section: 'Knowledge Base' },
    { label: 'Documents', path: '/documents', icon: FileText },
    { label: 'Meetings & Syncs', path: '/meetings', icon: Calendar },
    { section: 'Operational Intelligence' },
    { label: 'AI Insights', path: '/insights', icon: Sparkles, badge: 'Live' },
    { label: 'Executive Reports', path: '/reports', icon: BarChart3 },
    { label: 'Audit Activity', path: '/activity', icon: Activity },
    { section: 'Configuration' },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'organization_admin':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/30 rounded-full">Org Admin</span>;
      case 'department_admin':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full">Dept Admin</span>;
      case 'manager':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full">Manager</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 rounded-full">Employee</span>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white font-bold text-base shadow-md shadow-brand-500/20">
              A
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
                <span>APEX AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]">
                {user?.organization_name || 'Enterprise SaaS'}
              </p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <div key={idx} className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {item.section}
                </div>
              );
            }

            const Icon = item.icon!;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path!}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600/15 text-brand-300 border border-brand-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    item.badge === 'Live' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-brand-500/20 text-brand-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Role Demo Switcher Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 px-1 flex items-center justify-between">
            <span>Role Switcher (RBAC)</span>
            <Shield className="w-3 h-3 text-slate-500" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => switchDemoUser('admin')}
              title="Sarah Chen (Org Admin)"
              className={`py-1 px-1.5 text-[10px] rounded-lg border font-medium transition-colors ${
                user?.role === 'organization_admin'
                  ? 'bg-brand-600/20 border-brand-500/40 text-brand-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => switchDemoUser('manager')}
              title="Marcus Vance (Manager)"
              className={`py-1 px-1.5 text-[10px] rounded-lg border font-medium transition-colors ${
                user?.role === 'manager'
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Manager
            </button>
            <button
              onClick={() => switchDemoUser('employee')}
              title="Elena Rostova (Employee)"
              className={`py-1 px-1.5 text-[10px] rounded-lg border font-medium transition-colors ${
                user?.role === 'employee'
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Staff
            </button>
          </div>
        </div>

        {/* Current User Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.department_name || user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-3.5 py-1.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-400 hover:text-slate-300 transition-all w-52 sm:w-80 justify-between"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">Search tasks, docs, SOPs...</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-800/80 border border-slate-700 text-[10px] text-slate-400 font-mono rounded">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* AI Task Generator Quick Trigger */}
            <button
              onClick={() => setAiTaskModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-lg text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Task Generator</span>
            </button>

            {/* Role Badge */}
            {getRoleBadge(user?.role)}

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                  {user?.first_name?.[0]}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-slate-200">{user?.first_name} {user?.last_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <NavLink
                    to="/settings/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile</span>
                  </NavLink>
                  <NavLink
                    to="/settings/organization"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Organization Settings</span>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-400 hover:bg-slate-800 text-left border-t border-slate-800/80 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Outlet */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <AITaskGeneratorModal
        isOpen={aiTaskModalOpen}
        onClose={() => setAiTaskModalOpen(false)}
        onTasksCreated={() => {
          window.location.href = '/tasks';
        }}
        departments={[]}
      />
    </div>
  );
};
