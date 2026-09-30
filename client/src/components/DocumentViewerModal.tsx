import React, { useState } from 'react';
import { X, Sparkles, FileText, Loader2, Calendar, User, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Document, DocumentSummaryResponse } from '../../../shared/types/index.js';
import { api } from '../services/api.js';

interface DocumentViewerModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<DocumentSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !document) return null;

  const handleRunAISummary = async () => {
    setSummarizing(true);
    setError(null);
    try {
      const res = await api.summarizeDocumentAI({
        title: document.title,
        content: document.content,
        category: document.category,
      });
      setAiSummary(res);
    } catch (err: any) {
      setError(err.message || 'Failed to summarize document');
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {document.category}
              </span>
              <h3 className="text-base font-semibold text-slate-100 mt-1">{document.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAISummary}
              disabled={summarizing}
              className="enterprise-btn-primary py-1.5 px-3 text-xs"
            >
              {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{aiSummary ? 'Refresh AI Summary' : 'Run AI Summarization'}</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center gap-4 py-2 px-4 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400">
            {document.author_name && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Author: {document.author_name}</span>
              </div>
            )}
            {document.department_name && (
              <div>
                <span>Department: {document.department_name}</span>
              </div>
            )}
            {document.created_at && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Updated: {new Date(document.updated_at || document.created_at).toLocaleDateString()}</span>
              </div>
            )}
            <div className="ml-auto">
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize">
                Visibility: {document.visibility}
              </span>
            </div>
          </div>

          {/* AI Summary Card (Section 15.2) */}
          {aiSummary && (
            <div className="p-5 rounded-xl bg-brand-950/20 border border-brand-500/30 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Executive AI Intelligence & Synthesis</span>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Executive Summary
                </h5>
                <p className="text-sm text-slate-200 leading-relaxed">{aiSummary.summary}</p>
              </div>

              {aiSummary.key_points && aiSummary.key_points.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Key Points
                  </h5>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                    {aiSummary.key_points.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSummary.decisions && aiSummary.decisions.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Decisions & Mandates
                  </h5>
                  <ul className="space-y-1">
                    {aiSummary.decisions.map((dec, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                        <span>{dec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSummary.action_items && aiSummary.action_items.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Extracted Action Items
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {aiSummary.action_items.map((act, i) => (
                      <div key={i} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs">
                        <span className="font-semibold text-slate-200 block">{act.title}</span>
                        <span className="text-slate-400 mt-0.5 block">{act.description}</span>
                        {act.suggested_owner && (
                          <span className="text-brand-400 text-[11px] mt-1 block">Owner: {act.suggested_owner}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiSummary.risks && aiSummary.risks.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
                    Identified Compliance & Operational Risks
                  </h5>
                  <ul className="space-y-1">
                    {aiSummary.risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-rose-300">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Full Document Content */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Document Content
            </h4>
            <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {document.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="enterprise-btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
