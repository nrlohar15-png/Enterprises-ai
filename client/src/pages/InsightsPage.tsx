import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';
import { AIInsightItem, InsightSeverity } from '../../../shared/types/index.js';
import { SeverityBadge } from '../components/Badges.js';
import { Link } from 'react-router-dom';

export const InsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<AIInsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (severityFilter !== 'all') params.severity = severityFilter;
      const res = await api.getInsights(params);
      setInsights(res);
    } catch (err) {
      console.error('Fetch insights error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [severityFilter]);

  const handleGenerateFreshInsights = async () => {
    setGenerating(true);
    try {
      await api.generateInsightsAI();
      fetchInsights();
    } catch (err: any) {
      alert(err.message || 'Failed to generate operational insights');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleResolve = async (id: string, currentStatus?: boolean) => {
    setResolvingId(id);
    try {
      await api.resolveInsight(id, !currentStatus);
      fetchInsights();
    } catch (err) {
      console.error('Resolve error:', err);
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">AI Operational Insights & Bottleneck Detection</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explainable AI diagnostics identifying workload imbalances, prerequisite blockers, and SLA deadlines
          </p>
        </div>

        <button
          onClick={handleGenerateFreshInsights}
          disabled={generating}
          className="enterprise-btn-primary text-xs py-2 px-3 self-start sm:self-auto"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>Re-scan Operational Data</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="enterprise-panel p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                severityFilter === sev
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev === 'all' ? 'All Severities' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      ) : insights.length === 0 ? (
        <div className="enterprise-panel p-12 text-center text-slate-500 text-xs">
          No operational insights matching filter criteria. Click "Re-scan Operational Data" to analyze current workstreams.
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((item) => (
            <div
              key={item.id}
              className={`enterprise-card p-5 border transition-all ${
                item.is_resolved
                  ? 'opacity-60 bg-slate-900/40 border-slate-800'
                  : item.severity === 'critical'
                  ? 'border-rose-800/80 bg-slate-900/90 shadow-rose-950/20 shadow-lg'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={item.severity} />
                    <span className="text-xs font-mono uppercase text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      Category: {item.category}
                    </span>
                    {item.is_resolved && (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolved
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-100">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item.description}</p>
                </div>

                <button
                  onClick={() => handleToggleResolve(item.id!, item.is_resolved)}
                  disabled={resolvingId === item.id}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors shrink-0 ${
                    item.is_resolved
                      ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/70'
                  }`}
                >
                  {resolvingId === item.id ? 'Updating...' : item.is_resolved ? 'Reopen' : 'Mark Addressed'}
                </button>
              </div>

              {/* Evidence & Supporting Data (Section 4.12) */}
              {item.evidence && item.evidence.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2">
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Supporting Data & Evidence
                  </h4>
                  <ul className="space-y-1">
                    {item.evidence.map((ev, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5 shrink-0" />
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              {item.recommended_actions && item.recommended_actions.length > 0 && (
                <div className="mt-3.5 p-3 rounded-xl bg-brand-950/20 border border-brand-500/20 space-y-1.5">
                  <h4 className="text-[11px] font-semibold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Recommended Remediation</span>
                  </h4>
                  <ul className="space-y-1">
                    {item.recommended_actions.map((act, i) => (
                      <li key={i} className="text-xs text-slate-200 flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
