import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Lock, Mail, Loader2, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('sarah.chen@apexglobal.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPreset = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setLoading(true);
    setError(null);
    try {
      await login(demoEmail, 'Password123!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white font-bold text-xl shadow-lg shadow-brand-500/20 mb-3">
          A
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">
          Apex Enterprise AI
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Organizational Intelligence, Workflow Automation & Decision Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="enterprise-panel p-6 sm:p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="enterprise-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="enterprise-input pl-9"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full enterprise-btn-primary py-2.5 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Sign In to Platform</span>
            </button>
          </form>

          {/* Quick Demo Accounts Presets */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block text-center">
              Instant 1-Click Role Presets (Testing)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoPreset('sarah.chen@apexglobal.com')}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-colors"
              >
                <span className="font-semibold text-slate-200 block text-xs">Sarah C.</span>
                <span className="text-[10px] text-brand-400 block font-mono">Org Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoPreset('marcus.vance@apexglobal.com')}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-colors"
              >
                <span className="font-semibold text-slate-200 block text-xs">Marcus V.</span>
                <span className="text-[10px] text-blue-400 block font-mono">Manager</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoPreset('elena.rostova@apexglobal.com')}
                disabled={loading}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-colors"
              >
                <span className="font-semibold text-slate-200 block text-xs">Elena R.</span>
                <span className="text-[10px] text-purple-400 block font-mono">Staff</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2">
            <span>Need a new organization tenant? </span>
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">
              Create an organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
