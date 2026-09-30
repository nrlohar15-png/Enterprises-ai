import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Loader2, Calendar, User, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { Project, Department } from '../../../shared/types/index.js';
import { ProjectStatusBadge } from '../components/Badges.js';
import { ProjectFormModal } from '../components/ProjectFormModal.js';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const [pRes, dRes, mRes] = await Promise.all([
        api.getProjects(params),
        api.getDepartments(),
        api.getMembers(),
      ]);
      setProjects(pRes);
      setDepartments(dRes);
      setMembers(mRes);
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Strategic Projects & Initiatives</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Coordinate enterprise roadmaps, cross-department deliverables, and track velocity
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="enterprise-btn-primary text-xs py-2 px-3 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="enterprise-panel p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['all', 'active', 'planning', 'on_hold', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : projects.length === 0 ? (
        <div className="enterprise-panel p-12 text-center text-slate-500 text-xs">
          No projects found matching status filter. Click "New Project" to start one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div
              key={p.id}
              className="enterprise-card p-5 flex flex-col justify-between hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                    {p.department_name || 'General'}
                  </span>
                  <ProjectStatusBadge status={p.status} />
                </div>

                <Link
                  to={`/projects/${p.id}`}
                  className="text-base font-bold text-slate-100 hover:text-purple-300 transition-colors block truncate"
                >
                  {p.name}
                </Link>

                <p className="text-xs text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                  {p.description || 'No project description provided.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Deliverable Completion</span>
                    <span className="font-semibold text-slate-200">{p.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-brand-500 rounded-full"
                      style={{ width: `${p.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.owner_name || 'Owner'}</span>
                  </div>

                  {p.target_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Target: {p.target_date}</span>
                    </div>
                  )}
                </div>

                <Link
                  to={`/projects/${p.id}`}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center justify-end gap-1 pt-1"
                >
                  <span>Project Overview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onProjectSaved={fetchProjects}
        departments={departments}
        members={members}
      />
    </div>
  );
};
