import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2, ArrowRight, FileText, CheckSquare, Briefcase, Calendar, ShieldCheck } from 'lucide-react';
import { api } from '../services/api.js';
import { SearchResultItem, Department } from '../../../shared/types/index.js';
import { Link } from 'react-router-dom';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(console.error);
    // Initial popular search
    performSearch('security');
  }, []);

  const performSearch = async (searchQuery: string, searchType = type, dept = departmentId) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await api.search(searchQuery.trim(), searchType, dept || undefined);
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const getIcon = (itemType: string) => {
    switch (itemType) {
      case 'task': return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'project': return <Briefcase className="w-4 h-4 text-purple-400" />;
      case 'meeting': return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'policy': return <ShieldCheck className="w-4 h-4 text-blue-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Enterprise Knowledge Search</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Search across all enterprise documents, tasks, project milestones, policies, and recorded meetings
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="enterprise-panel p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keywords, technical terms, or natural language..."
              className="enterprise-input pl-10 py-2.5 text-sm"
            />
          </div>
          <button type="submit" disabled={loading} className="enterprise-btn-primary py-2.5 px-5 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {['all', 'document', 'task', 'project', 'meeting', 'policy'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                performSearch(query || 'security', t, departmentId);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                type === t
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'all' ? 'All Types' : t + 's'}
            </button>
          ))}

          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              performSearch(query || 'security', type, e.target.value);
            }}
            className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 ml-auto"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </form>

      {/* Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Found {results.length} relevant record(s)</span>
          <span>Ranked by Semantic Relevance</span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
            <span>Scanning enterprise databases...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="enterprise-panel p-12 text-center text-slate-500 text-xs">
            No enterprise results matched your search criteria. Try a different query.
          </div>
        ) : (
          results.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="enterprise-card p-4 sm:p-5 flex items-start gap-4 hover:border-slate-700"
            >
              <div className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                    {item.source_reference}
                  </span>
                  {item.department_name && (
                    <span className="text-xs text-slate-400">• {item.department_name}</span>
                  )}
                  <span className="text-xs text-slate-500 ml-auto">
                    Relevance: {Math.round(item.relevance * 100)}%
                  </span>
                </div>

                <Link to={item.url} className="text-sm font-semibold text-slate-100 hover:text-brand-300 transition-colors block">
                  {item.title}
                </Link>

                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {item.snippet}
                </p>

                <div className="mt-2 text-[11px] text-slate-500">
                  Last updated: {new Date(item.timestamp).toLocaleDateString()}
                </div>
              </div>

              <Link to={item.url} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 self-center shrink-0">
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
