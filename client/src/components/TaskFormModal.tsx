import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { Task, Project, Department, TaskPriority, TaskStatus } from '../../../shared/types/index.js';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSaved: () => void;
  initialTask?: Task | null;
  projects: Project[];
  departments: Department[];
  members: any[];
  allTasks: Task[];
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onTaskSaved,
  initialTask,
  projects,
  departments,
  members,
  allTasks,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState('');
  const [dependencyIds, setDependencyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setProjectId(initialTask.project_id || '');
      setDepartmentId(initialTask.department_id || '');
      setAssigneeId(initialTask.assignee_id || '');
      setPriority(initialTask.priority);
      setStatus(initialTask.status);
      setDueDate(initialTask.due_date ? initialTask.due_date.split('T')[0] : '');
      setLabels((initialTask.labels || []).join(', '));
      setDependencyIds((initialTask.dependencies || []).map(d => d.id));
    } else {
      setTitle('');
      setDescription('');
      setProjectId('');
      setDepartmentId('');
      setAssigneeId('');
      setPriority('medium');
      setStatus('todo');
      setDueDate('');
      setLabels('');
      setDependencyIds([]);
    }
    setError(null);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      project_id: projectId || null,
      department_id: departmentId || null,
      assignee_id: assigneeId || null,
      priority,
      status,
      due_date: dueDate || null,
      labels: labels ? labels.split(',').map(l => l.trim()).filter(Boolean) : [],
      dependencies: dependencyIds
    };

    try {
      if (initialTask) {
        await api.updateTask(initialTask.id, payload);
      } else {
        await api.createTask(payload);
      }
      onTaskSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-semibold text-slate-100">
              {initialTask ? 'Edit Task' : 'Create Enterprise Task'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-200 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Audit kubernetes cluster ingress security"
              className="enterprise-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide technical scope, criteria for completion, and links..."
              className="enterprise-input resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="enterprise-input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="enterprise-input"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="enterprise-input"
              >
                <option value="">No Project Assigned</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="enterprise-input"
              >
                <option value="">No Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="enterprise-input"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id || m.id} value={m.user_id || m.id}>
                    {m.first_name} {m.last_name} ({m.title || m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="enterprise-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Labels (comma-separated)
              </label>
              <input
                type="text"
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                placeholder="infrastructure, devops, security"
                className="enterprise-input"
              />
            </div>
          </div>

          {/* Dependencies selection */}
          {allTasks.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Prerequisite Dependencies (Must be completed first)
              </label>
              <div className="max-h-32 overflow-y-auto p-2 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1">
                {allTasks
                  .filter(t => !initialTask || t.id !== initialTask.id)
                  .map(t => {
                    const isChecked = dependencyIds.includes(t.id);
                    return (
                      <label key={t.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800/60 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setDependencyIds([...dependencyIds, t.id]);
                            else setDependencyIds(dependencyIds.filter(id => id !== t.id));
                          }}
                          className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="font-medium text-slate-200">{t.title}</span>
                        <span className="text-slate-500">({t.status})</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="enterprise-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="enterprise-btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{initialTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
