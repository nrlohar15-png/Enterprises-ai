import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Plus, Sparkles, Filter, Search, Loader2, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { Task, Project, Department, TaskStatus, TaskPriority } from '../../../shared/types/index.js';
import { TaskStatusBadge, TaskPriorityBadge } from '../components/Badges.js';
import { TaskFormModal } from '../components/TaskFormModal.js';
import { AITaskGeneratorModal } from '../components/AITaskGeneratorModal.js';
import { TaskAnalysisModal } from '../components/TaskAnalysisModal.js';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [aiTaskModalOpen, setAiTaskModalOpen] = useState(false);
  const [analysisTaskId, setAnalysisTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (departmentFilter) params.department_id = departmentFilter;
      if (search) params.search = search;

      const [tasksRes, projsRes, deptsRes, membersRes] = await Promise.all([
        api.getTasks(params),
        api.getProjects(),
        api.getDepartments(),
        api.getMembers(),
      ]);

      setTasks(tasksRes);
      setProjects(projsRes);
      setDepartments(deptsRes);
      setMembers(membersRes);
    } catch (err) {
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [statusFilter, priorityFilter, departmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAll();
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      fetchAll();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Enterprise Work & Task Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track cross-department deliverables, prerequisites, and milestone deadlines
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAiTaskModalOpen(true)}
            className="enterprise-btn-secondary text-xs py-2 px-3"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Generate with AI</span>
          </button>
          <button
            onClick={() => {
              setSelectedTask(null);
              setTaskModalOpen(true);
            }}
            className="enterprise-btn-primary text-xs py-2 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="enterprise-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by name or description..."
            className="enterprise-input pl-9 text-xs py-2"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Department Filter */}
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

      {/* Task List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          <span>Loading tasks...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="enterprise-panel p-12 text-center text-slate-500 text-xs">
          No tasks found matching filter criteria. Create a new task or generate one from AI.
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="enterprise-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <TaskPriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />

                  {task.department_name && (
                    <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                      {task.department_name}
                    </span>
                  )}

                  {task.project_name && (
                    <span className="text-xs text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                      {task.project_name}
                    </span>
                  )}
                </div>

                <Link
                  to={`/tasks/${task.id}`}
                  className="text-sm font-semibold text-slate-100 hover:text-brand-300 block truncate"
                >
                  {task.title}
                </Link>

                {task.description && (
                  <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                    {task.description}
                  </p>
                )}

                {/* Dependencies and dates */}
                <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-500">
                  {task.due_date && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Due: {task.due_date}
                    </span>
                  )}
                  {task.assignee_name && (
                    <span>Assignee: {task.assignee_name}</span>
                  )}
                  {task.dependencies && task.dependencies.length > 0 && (
                    <span className="text-amber-400/90 font-medium">
                      Depends on {task.dependencies.length} prerequisite task(s)
                    </span>
                  )}
                </div>
              </div>

              {/* Action dropdown and details button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setAnalysisTaskId(task.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-medium transition-colors"
                  title="Deep AI Task Analysis & Step-by-Step Action Plan"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">AI Analyze</span>
                </button>

                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                  className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <Link
                  to={`/tasks/${task.id}`}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  title="View Task Details"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onTaskSaved={fetchAll}
        initialTask={selectedTask}
        projects={projects}
        departments={departments}
        members={members}
        allTasks={tasks}
      />

      <AITaskGeneratorModal
        isOpen={aiTaskModalOpen}
        onClose={() => setAiTaskModalOpen(false)}
        onTasksCreated={fetchAll}
        departments={departments}
      />

      <TaskAnalysisModal
        taskId={analysisTaskId}
        isOpen={!!analysisTaskId}
        onClose={() => setAnalysisTaskId(null)}
        onSubtasksCreated={fetchAll}
      />
    </div>
  );
};
