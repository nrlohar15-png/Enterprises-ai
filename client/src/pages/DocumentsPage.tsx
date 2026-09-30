import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Search, Filter, Loader2, Sparkles, ArrowRight, Eye } from 'lucide-react';
import { api } from '../services/api.js';
import { Document, Department, Project } from '../../../shared/types/index.js';
import { DocumentFormModal } from '../components/DocumentFormModal.js';
import { DocumentViewerModal } from '../components/DocumentViewerModal.js';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [viewerModalOpen, setViewerModalOpen] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (departmentFilter) params.department_id = departmentFilter;
      if (search) params.search = search;

      const [docsRes, deptsRes, projsRes] = await Promise.all([
        api.getDocuments(params),
        api.getDepartments(),
        api.getProjects(),
      ]);

      setDocuments(docsRes);
      setDepartments(deptsRes);
      setProjects(projsRes);
    } catch (err) {
      console.error('Fetch documents error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [categoryFilter, departmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs();
  };

  const handleQuickView = (doc: Document) => {
    setSelectedDoc(doc);
    setViewerModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Enterprise Knowledge & SOP Repository</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Centralized repository for corporate policies, operational playbooks, architecture specifications, and compliance SOPs
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedDoc(null);
            setFormModalOpen(true);
          }}
          className="enterprise-btn-primary text-xs py-2 px-3 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Publish Document</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="enterprise-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by title or keywords..."
            className="enterprise-input pl-9 text-xs py-2"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300"
          >
            <option value="all">All Categories</option>
            <option value="Policy">Policy</option>
            <option value="SOP">SOP</option>
            <option value="Report">Report</option>
            <option value="Meeting Notes">Meeting Notes</option>
            <option value="Project Documentation">Project Documentation</option>
            <option value="Business Document">Business Document</option>
            <option value="Knowledge Article">Knowledge Article</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      ) : documents.length === 0 ? (
        <div className="enterprise-panel p-12 text-center text-slate-500 text-xs">
          No documents found matching the filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="enterprise-card p-5 flex flex-col justify-between hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/40">
                    {doc.category}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">
                    {doc.visibility}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 hover:text-blue-300 transition-colors block line-clamp-2">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 mt-2 leading-relaxed">
                  {doc.summary || doc.content}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                  <span>{doc.department_name || 'Organization-wide'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickView(doc)}
                    className="p-1.5 text-xs text-brand-400 hover:bg-slate-800 rounded-lg flex items-center gap-1 transition-colors"
                    title="Quick AI Viewer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View / Summarize</span>
                  </button>
                  <Link
                    to={`/documents/${doc.id}`}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <DocumentFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onDocumentSaved={fetchDocs}
        departments={departments}
        projects={projects}
      />

      <DocumentViewerModal
        isOpen={viewerModalOpen}
        onClose={() => setViewerModalOpen(false)}
        document={selectedDoc}
      />
    </div>
  );
};
