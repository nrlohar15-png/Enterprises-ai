import React, { useState, useEffect } from 'react';
import { BarChart3, Plus, Sparkles, Loader2, ArrowRight, ShieldAlert, CheckCircle2, TrendingUp } from 'lucide-react';
import { api } from '../services/api.js';
import { ExecutiveReportResponse } from '../../../shared/types/index.js';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ExecutiveReportResponse[]>([]);
  const [selectedReport, setSelectedReport] = useState<ExecutiveReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const newReport = await api.generateExecutiveReportAI();
      const updated = [newReport, ...reports];
      setReports(updated);
      setSelectedReport(newReport);
    } catch (err: any) {
      alert(err.message || 'Failed to generate executive report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Executive Operations Briefings & Reports</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated AI management reporting aggregating organizational progress, risks, and strategic next steps
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="enterprise-btn-primary text-xs py-2 px-3 self-start sm:self-auto"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>Generate Executive Briefing</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Report Archive */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              Generated Reports ({reports.length})
            </h3>
            <div className="space-y-2">
              {reports.length === 0 ? (
                <div className="enterprise-panel p-6 text-center text-xs text-slate-500">
                  No reports generated yet. Click "Generate Executive Briefing" above.
                </div>
              ) : (
                reports.map((r, i) => {
                  const isSelected = selectedReport?.id === r.id || (!selectedReport?.id && i === 0);
                  return (
                    <div
                      key={r.id || i}
                      onClick={() => setSelectedReport(r)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-brand-500/50 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="uppercase font-semibold text-brand-400">Executive</span>
                        <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{r.title || 'Executive Briefing'}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{r.executive_summary}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Full Report Viewer */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="enterprise-panel p-6 sm:p-8 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs text-brand-400">
                    <BarChart3 className="w-4 h-4" />
                    <span>Executive Operations Briefing • {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString() : 'Live'}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                    {selectedReport.title || 'Executive Operations Status Briefing'}
                  </h2>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Executive Overview
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {selectedReport.executive_summary}
                  </p>
                </div>

                {/* Key Metrics Grid */}
                {selectedReport.key_metrics && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Performance Indicators
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedReport.key_metrics.map((m, idx) => (
                        <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                          <span className="text-[11px] text-slate-400 block truncate">{m.name}</span>
                          <span className="text-xl font-bold text-slate-100 mt-1 block">{m.value}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 truncate">{m.context}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements & Risks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedReport.achievements && (
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Key Achievements</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedReport.achievements.map((a, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReport.risks && (
                    <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Identified Risks</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedReport.risks.map((r, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottlenecks & Priorities */}
                {selectedReport.bottlenecks && selectedReport.bottlenecks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                      Operational Bottlenecks
                    </h4>
                    <div className="space-y-1.5">
                      {selectedReport.bottlenecks.map((b, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-300">
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {selectedReport.recommended_actions && (
                  <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-500/30 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Recommended Strategic Next Steps</span>
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedReport.recommended_actions.map((act, idx) => (
                        <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="enterprise-panel p-12 text-center text-slate-400 text-xs">
                Select a report to view details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
