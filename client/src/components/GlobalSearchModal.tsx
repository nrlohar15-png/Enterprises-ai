import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, CheckSquare, Briefcase, Calendar, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { SearchResultItem } from '../../../shared/types/index.js';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query.trim());
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'project': return <Briefcase className="w-4 h-4 text-purple-400" />;
      case 'meeting': return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'policy': return <ShieldCheck className="w-4 h-4 text-blue-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, documents, projects, meetings, policies..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base"
          />
          {loading && <Loader2 className="w-4 h-4 text-brand-400 animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-3 flex-1 space-y-1.5 divide-y divide-slate-800/40">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <p className="font-medium text-slate-400">Search enterprise knowledge</p>
              <p className="mt-1 text-xs text-slate-500">
                Type any task title, SOP, project name, or question. Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono text-xs">ESC</kbd> to exit.
              </p>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No enterprise records found matching "{query}".
            </div>
          ) : (
            results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item.url)}
                className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/70 cursor-pointer transition-colors"
              >
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                      {item.source_reference}
                    </span>
                    {item.department_name && (
                      <span className="text-xs text-slate-400 font-medium">
                        • {item.department_name}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-brand-400 transition-colors mt-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {item.snippet}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Search powered by Enterprise Natural-Language RAG</span>
          <div className="flex items-center gap-2">
            <span>Navigate with click</span>
            <span>•</span>
            <span>ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
