import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck, Eye, EyeOff, UserCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

const DEMO_ACCOUNTS = [
  { email: 'xyz12@gmail.com',                 password: 'qwerty1234',  name: 'Sarah C.',  role: 'Org Admin',  color: 'text-brand-400'  },
  { email: 'marcus.vance@apexglobal.com',      password: 'Password123!', name: 'Marcus V.', role: 'Manager',    color: 'text-blue-400'   },
  { email: 'elena.rostova@apexglobal.com',     password: 'Password123!', name: 'Elena R.',  role: 'Staff',      color: 'text-purple-400' },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const { login } = useAuth();
  const navigate  = useNavigate();

  // Restore saved email on mount
  useEffect(() => {
    const saved = localStorage.getItem('apex_remembered_email');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      await login(loginEmail, loginPassword);
      if (rememberMe) {
        localStorage.setItem('apex_remembered_email', loginEmail);
      } else {
        localStorage.removeItem('apex_remembered_email');
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(email.trim(), password);
  };

  // 1-click preset — logs in silently, never puts password in form field
  const handlePreset = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);           // show which account is being used
    setPassword('');               // keep password field blank
    doLogin(acc.email, acc.password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white font-bold text-2xl shadow-lg shadow-brand-500/20 mb-4">
          A
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Apex Enterprise AI</h1>
        <p className="mt-1 text-xs text-slate-400">
          Organizational Intelligence &amp; Workflow Automation Platform
        </p>
      </div>

      {/* Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="enterprise-panel p-6 sm:p-8 space-y-5">

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2.5 p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sign-in form */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="enterprise-input pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="enterprise-input pl-9 pr-10"
                  disabled={loading}
                />
                {/* Show / hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-400 cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-xs text-slate-400 cursor-pointer select-none">
                Remember my email on this device
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full enterprise-btn-primary py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Signing in...</span></>
                : <><ShieldCheck className="w-4 h-4" /><span>Sign In to Platform</span></>
              }
            </button>
          </form>

          {/* 1-Click role presets — password never shown in form */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2">
              <UserCircle2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Quick Access — 1-click login
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handlePreset(acc)}
                  disabled={loading}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all disabled:opacity-50"
                  title={`Sign in as ${acc.name}`}
                >
                  <span className="font-semibold text-slate-200 block text-xs leading-tight">{acc.name}</span>
                  <span className={`text-[10px] block font-mono ${acc.color}`}>{acc.role}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 text-center">
              Clicking a role logs you in immediately — no password needed
            </p>
          </div>

          {/* Register link */}
          <div className="text-center text-xs text-slate-400">
            <span>New organization? </span>
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Create your workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
