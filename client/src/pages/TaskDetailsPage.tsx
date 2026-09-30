import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Clock, User, CheckSquare, MessageSquare, Loader2, Send } from 'lucide-react';
import { api } from '../services/api.js';
import { Task, Project, Department, Comment } from '../../../shared/types/index.js';
import { TaskStatusBadge, TaskPriorityBadge } from '../components/Badges.js';
import { TaskFormModal } from '../components/TaskFormModal.js';

export const TaskDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<(Task & { comments: Comment[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchTaskDetails = async () => {
    if (!id) return;
    try {
      const [tData, pData, dData, mData, allTData] = await Promise.all([
        api.getTask(id),
        api.getProjects(),
        api.getDepartments(),
        api.getMembers(),
        api.getTasks(),
      ]);
      setTask(tData);
      setProjects(pData);
      setDepartments(dData);
      setMembers(mData);
      setAllTasks(allTData);
    } catch (err) {
      console.error('Failed to load task:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(id);
      navigate('/tasks');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      await api.createComment('task', id, commentText.trim());
      setCommentText('');
      fetchTaskDetails();
    } catch (err) {
      console.error('Post comment failed:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="enterprise-panel p-12 text-center text-slate-400 text-sm">
        Task not found or access denied.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button & Action buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tasks</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditModalOpen(true)}
            className="enterprise-btn-secondary text-xs py-1.5 px-3"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Task</span>
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 transition-colors text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Task Panel */}
      <div className="enterprise-panel p-6 space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <TaskPriorityBadge priority={task.priority} />
            <TaskStatusBadge status={task.status} />
            {task.department_name && (
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {task.department_name}
              </span>
            )}
            {task.project_name && (
              <span className="text-xs text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                Project: {task.project_name}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{task.title}</h1>
        </div>

        {/* Metadata info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block">Assignee</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{task.assignee_name || 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Due Date</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{task.due_date || 'None'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Creator</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{task.creator_name || 'System'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Updated</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{new Date(task.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Task Description
          </h3>
          <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {task.description || 'No detailed technical description provided.'}
          </div>
        </div>

        {/* Dependencies */}
        {task.dependencies && task.dependencies.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Prerequisite Dependencies ({task.dependencies.length})
            </h3>
            <div className="space-y-2">
              {task.dependencies.map((dep) => (
                <Link
                  key={dep.id}
                  to={`/tasks/${dep.id}`}
                  className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-slate-200">{dep.title}</span>
                  <TaskStatusBadge status={dep.status} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Discussion Comments */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Activity & Collaboration Comments ({task.comments?.length || 0})
            </h3>
          </div>

          <div className="space-y-3">
            {(task.comments || []).map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-slate-200">{c.user_name || 'Team Member'}</span>
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Leave a comment or progress update..."
              className="enterprise-input text-xs"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="enterprise-btn-primary px-3 text-xs shrink-0"
            >
              {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Post</span>
            </button>
          </form>
        </div>
      </div>

      <TaskFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onTaskSaved={fetchTaskDetails}
        initialTask={task}
        projects={projects}
        departments={departments}
        members={members}
        allTasks={allTasks}
      />
    </div>
  );
};
