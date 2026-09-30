import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Briefcase, CheckSquare, FileText, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { Department, Project, Task, Document } from '../../../shared/types/index.js';
import { TaskStatusBadge, TaskPriorityBadge, ProjectStatusBadge } from '../components/Badges.js';

export const DepartmentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dept, setDept] = useState<(Department & { members: any[]; projects: Project[]; tasks: Task[]; documents: Document[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks' | 'documents' | 'members'>('projects');

  useEffect(() => {
    if (!id) return;
    api.getDepartment(id)
      .then(setDept)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!dept) {
    return (
      <div className="enterprise-panel p-12 text-center text-slate-400 text-sm">
        Department not found or access denied.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/departments')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Departments</span>
      </button>

      {/* Department Header Panel */}
      <div className="enterprise-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100">{dept.name}</h1>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {dept.code}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {dept.description || 'Departmental operations workspace.'}
              </p>
            </div>
          </div>

          {dept.head_name && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs shrink-0">
              <span className="text-slate-500 block">Department Head</span>
              <strong className="text-slate-200 text-sm mt-0.5 block">{dept.head_name}</strong>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'projects'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Projects ({dept.projects?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'tasks'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks ({dept.tasks?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'documents'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents ({dept.documents?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'members'
                ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({dept.members?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dept.projects?.length === 0 ? (
            <div className="col-span-2 enterprise-panel p-8 text-center text-xs text-slate-500">
              No projects initiated for this department yet.
            </div>
          ) : (
            dept.projects?.map((p) => (
              <div key={p.id} className="enterprise-card p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <ProjectStatusBadge status={p.status} />
                    <span className="text-xs text-slate-400">{p.progress_percentage}% completed</span>
                  </div>
                  <Link to={`/projects/${p.id}`} className="font-bold text-slate-100 hover:text-purple-300 block text-sm">
                    {p.name}
                  </Link>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{p.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                  <Link to={`/projects/${p.id}`} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                    <span>View Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-2.5">
          {dept.tasks?.length === 0 ? (
            <div className="enterprise-panel p-8 text-center text-xs text-slate-500">
              No active tasks in this department.
            </div>
          ) : (
            dept.tasks?.map((t) => (
              <Link
                key={t.id}
                to={`/tasks/${t.id}`}
                className="enterprise-card p-3.5 flex items-center justify-between gap-4 block hover:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TaskStatusBadge status={t.status} />
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate">{t.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <TaskPriorityBadge priority={t.priority} />
                  <span className="text-xs text-slate-400">{t.assignee_name || 'Unassigned'}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-2.5">
          {dept.documents?.length === 0 ? (
            <div className="enterprise-panel p-8 text-center text-xs text-slate-500">
              No knowledge documents published for this department.
            </div>
          ) : (
            dept.documents?.map((d) => (
              <Link
                key={d.id}
                to={`/documents/${d.id}`}
                className="enterprise-card p-4 flex items-center justify-between gap-4 block hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {d.category}
                    </span>
                    <span className="text-xs text-slate-400">Author: {d.author_name}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100">{d.title}</h4>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {dept.members?.map((m) => (
            <div key={m.id} className="enterprise-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                {m.first_name[0]}{m.last_name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{m.first_name} {m.last_name}</p>
                <p className="text-[11px] text-slate-400 truncate">{m.title || m.role}</p>
                <p className="text-[10px] text-slate-500 truncate">{m.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
