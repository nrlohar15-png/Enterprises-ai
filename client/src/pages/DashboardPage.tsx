import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  CheckSquare,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  Calendar,
  ShieldAlert,
  Loader2,
  CheckCircle,
  Plus
} from 'lucide-react';
import { api } from '../services/api.js';
import { DashboardData, Task, Project, AIInsightItem } from '../../../shared/types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { TaskStatusBadge, TaskPriorityBadge, ProjectStatusBadge, SeverityBadge } from '../components/Badges.js';
import { TaskFormModal } from '../components/TaskFormModal.js';
import { AITaskGeneratorModal } from '../components/AITaskGeneratorModal.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [aiTaskModalOpen, setAiTaskModalOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const handleQuickStatusChange = async (taskId: string, newStatus: any) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleResolveInsight = async (insightId: string) => {
    setResolvingId(insightId);
    try {
      await api.resolveInsight(insightId, true);
      fetchDashboard();
    } catch (err) {
      console.error('Failed to resolve insight:', err);
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Synthesizing enterprise operational metrics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-brand-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
              Role: {user?.role.replace('_', ' ').toUpperCase()}
            </span>
            <span className="text-xs text-slate-400">• {user?.department_name || 'Organization Headquarters'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {user?.role === 'organization_admin'
              ? 'Executive Command Center: Review organizational KPIs, cross-department risks, and automated AI briefings.'
              : user?.role === 'manager'
              ? 'Department Management: Track team workload concentration, project milestones, and pending deliverables.'
              : 'Personal Workspace: Track your assigned tasks, active deliverables, and operational dependencies.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setAiTaskModalOpen(true)}
            className="enterprise-btn-secondary text-xs py-2 px-3"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>AI Task Decomposition</span>
          </button>
          <button
            onClick={() => setTaskModalOpen(true)}
            className="enterprise-btn-primary text-xs py-2 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="enterprise-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Projects</span>
            <Briefcase className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-100">{data.metrics.active_projects}</span>
            <span className="text-xs text-slate-500">of {data.metrics.total_projects} total</span>
          </div>
          <div className="mt-2 text-[11px] text-purple-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Tracking on schedule</span>
          </div>
        </div>

        <div className="enterprise-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Task Velocity</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-100">{data.metrics.completion_rate}%</span>
            <span className="text-xs text-slate-500">completed</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>{data.metrics.completed_tasks} of {data.metrics.total_tasks} closed</span>
          </div>
        </div>

        <div className="enterprise-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Overdue Milestones</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-400">{data.metrics.overdue_tasks}</span>
            <span className="text-xs text-slate-500">action items</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-400 font-medium">
            <span>Requiring immediate triage</span>
          </div>
        </div>

        <div className="enterprise-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Departments</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-100">{data.metrics.department_count}</span>
            <span className="text-xs text-slate-500">divisions</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-400 font-medium">
            <span>{data.metrics.active_members} verified members</span>
          </div>
        </div>
      </div>

      {/* AI Operational Insights Section (Section 4.12) */}
      {data.ai_insights.length > 0 && (
        <div className="enterprise-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-500/10 text-brand-400 rounded-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100">Live AI Operational Insights & Bottlenecks</h3>
            </div>
            <Link to="/insights" className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
              <span>View All Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.ai_insights.slice(0, 3).map((insight) => (
              <div key={insight.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <SeverityBadge severity={insight.severity} />
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                      {insight.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-100 leading-snug">{insight.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {insight.recommended_actions?.length || 0} action(s)
                  </span>
                  <button
                    onClick={() => handleResolveInsight(insight.id!)}
                    disabled={resolvingId === insight.id}
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium"
                  >
                    {resolvingId === insight.id ? 'Resolving...' : 'Resolve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two Column Workstreams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Tasks & Overdue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assigned Tasks */}
          <div className="enterprise-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  {user?.role === 'employee' ? 'My Assigned Tasks' : 'Active Enterprise Tasks'}
                </h3>
              </div>
              <Link to="/tasks" className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1">
                <span>All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {data.assigned_tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No active tasks assigned. Click "New Task" or use the AI Task Generator.
                </div>
              ) : (
                data.assigned_tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <TaskPriorityBadge priority={task.priority} />
                        <TaskStatusBadge status={task.status} />
                        {task.department_name && (
                          <span className="text-[11px] text-slate-400">
                            • {task.department_name}
                          </span>
                        )}
                      </div>
                      <Link to={`/tasks/${task.id}`} className="text-xs sm:text-sm font-medium text-slate-200 hover:text-brand-400 truncate block">
                        {task.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {task.due_date}
                          </span>
                        )}
                        {task.assignee_name && (
                          <span>Assignee: {task.assignee_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Quick status selector */}
                    <select
                      value={task.status}
                      onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                      className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Projects Overview */}
          <div className="enterprise-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-slate-100">Strategic Projects Progress</h3>
              </div>
              <Link to="/projects" className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
                <span>View All Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.active_projects.slice(0, 4).map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                      {p.department_name || 'General'}
                    </span>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <Link to={`/projects/${p.id}`} className="text-xs sm:text-sm font-semibold text-slate-100 hover:text-purple-300 block truncate">
                    {p.name}
                  </Link>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {p.description}
                  </p>

                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-slate-300">{p.progress_percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-brand-500 rounded-full"
                        style={{ width: `${p.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Deadlines, Recent Docs & Activity */}
        <div className="space-y-6">
          {/* Overdue / Deadlines */}
          {data.overdue_tasks.length > 0 && (
            <div className="enterprise-panel p-5 border-rose-900/50 bg-rose-950/20">
              <div className="flex items-center gap-2 text-rose-400 mb-3 font-semibold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Overdue Action Items ({data.overdue_tasks.length})</span>
              </div>
              <div className="space-y-2">
                {data.overdue_tasks.map((task) => (
                  <div key={task.id} className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-900/40 text-xs">
                    <Link to={`/tasks/${task.id}`} className="font-semibold text-rose-200 hover:underline block truncate">
                      {task.title}
                    </Link>
                    <div className="flex justify-between text-[11px] text-rose-400/80 mt-1">
                      <span>Due: {task.due_date}</span>
                      <span>{task.assignee_name || 'Unassigned'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Documents */}
          <div className="enterprise-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Knowledge & SOPs</h3>
              </div>
              <Link to="/documents" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {data.recent_documents.slice(0, 4).map((doc) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 block transition-colors text-xs"
                >
                  <span className="text-[10px] font-semibold uppercase text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded mr-1.5">
                    {doc.category}
                  </span>
                  <span className="font-medium text-slate-200 hover:text-brand-300">
                    {doc.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Trail */}
          <div className="enterprise-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-100">Audit Stream</h3>
              <Link to="/activity" className="text-xs text-slate-400 hover:text-slate-300">
                Full Log
              </Link>
            </div>
            <div className="space-y-3">
              {data.recent_activity.slice(0, 5).map((act) => (
                <div key={act.id} className="text-xs flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-300">
                      <strong className="text-slate-200">{act.user_name || 'System'}:</strong>{' '}
                      <span className="text-slate-400 font-mono text-[11px]">{act.action}</span>
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onTaskSaved={fetchDashboard}
        projects={data.active_projects}
        departments={[]}
        members={[]}
        allTasks={data.assigned_tasks}
      />

      <AITaskGeneratorModal
        isOpen={aiTaskModalOpen}
        onClose={() => setAiTaskModalOpen(false)}
        onTasksCreated={fetchDashboard}
        departments={[]}
      />
    </div>
  );
};
