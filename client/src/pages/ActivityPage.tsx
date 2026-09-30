import React, { useState, useEffect } from 'react';
import { Activity, Filter, Loader2, User, Clock, ShieldCheck } from 'lucide-react';
import { api } from '../services/api.js';
import { ActivityLog } from '../../../shared/types/index.js';

export const ActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (actionFilter) params.action = actionFilter;
      const data = await api.getActivity(params);
      setLogs(data);
    } catch (err) {
      console.error('Fetch activity error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('create') || action.includes('register')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">CREATE</span>;
    }
    if (action.includes('update') || action.includes('resolve')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800">UPDATE</span>;
    }
    if (action.includes('delete')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">DELETE</span>;
    }
    if (action.includes('ai')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-950/80 text-brand-300 border border-brand-800">AI EVENT</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">AUDIT</span>;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Enterprise Audit & Activity Trail</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Immutable event stream capturing authentication, data mutations, permission adjustments, and AI invocations
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="enterprise-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['', 'task.create', 'task.update', 'document.create', 'ai.chat', 'meeting.create'].map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                actionFilter === act
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {act === '' ? 'All Actions' : act}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Log Stream */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      ) : logs.length === 0 ? (
        <div className="enterprise-panel p-12 text-center text-slate-500 text-xs">
          No audit logs recorded matching this filter.
        </div>
      ) : (
        <div className="enterprise-panel divide-y divide-slate-800/80 overflow-hidden">
          {logs.map((log) => (
            <div key={log.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-900/40 transition-colors">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0 mt-0.5">
                  {log.user_name ? log.user_name[0] : 'S'}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-slate-200">
                      {log.user_name || 'System / Automated'}
                    </span>
                    {getActionBadge(log.action)}
                    <span className="text-xs font-mono text-slate-400">
                      {log.action}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Target: <span className="font-mono text-slate-300">{log.entity_type}</span>
                    {log.entity_id && <span className="text-slate-500 font-mono"> ({log.entity_id})</span>}
                  </p>

                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-400 overflow-x-auto">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 whitespace-nowrap shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-600" />
                <span>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
