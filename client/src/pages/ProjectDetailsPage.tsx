import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, User, Briefcase, CheckSquare, FileText, Loader2, Plus, MessageSquare, Send } from 'lucide-react';
import { api } from '../services/api.js';
import { Project, Task, Document, Comment, Department } from '../../../shared/types/index.js';
import { ProjectStatusBadge, TaskStatusBadge, TaskPriorityBadge } from '../components/Badges.js';
import { ProjectFormModal } from '../components/ProjectFormModal.js';
import { TaskFormModal } from '../components/TaskFormModal.js';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<(Project & { tasks: Task[]; documents: Document[]; comments: Comment[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      const [projData, dData, mData] = await Promise.all([
        api.getProject(id),
        api.getDepartments(),
        api.getMembers(),
      ]);
      setProject(projData);
      setDepartments(dData);
      setMembers(mData);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      await api.createComment('project', id, commentText.trim());
      setCommentText('');
      fetchProjectDetails();
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="enterprise-panel p-12 text-center text-slate-400 text-sm">
        Project not found or access denied.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditModalOpen(true)}
            className="enterprise-btn-secondary text-xs py-1.5 px-3"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Project</span>
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Overview Panel */}
      <div className="enterprise-panel p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
              {project.department_name || 'General Operations'}
            </span>
            <ProjectStatusBadge status={project.status} />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{project.name}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            {project.description || 'No project description provided.'}
          </p>
        </div>

        {/* Progress & Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block">Project Owner</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{project.owner_name || 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Deliverables</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">
              {project.completed_task_count} / {project.task_count} Done ({project.progress_percentage}%)
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Start Date</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{project.start_date || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Target Date</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{project.target_date || 'N/A'}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Overall Roadmap Completion</span>
            <span className="font-semibold text-slate-200">{project.progress_percentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-brand-500 rounded-full"
              style={{ width: `${project.progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Project Tasks */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-100">Project Tasks ({project.tasks?.length || 0})</h3>
            </div>
            <button
              onClick={() => setTaskModalOpen(true)}
              className="enterprise-btn-primary text-xs py-1 px-2.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="space-y-2">
            {project.tasks?.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No tasks assigned to this project yet.</p>
            ) : (
              project.tasks?.map((t) => (
                <Link
                  key={t.id}
                  to={`/tasks/${t.id}`}
                  className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <TaskStatusBadge status={t.status} />
                    <span className="font-medium text-slate-200">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <TaskPriorityBadge priority={t.priority} />
                    {t.due_date && <span>Due: {t.due_date}</span>}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Linked Documents */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-100">Linked Documentation ({project.documents?.length || 0})</h3>
          </div>
          <div className="space-y-2">
            {project.documents?.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No documents linked to this project.</p>
            ) : (
              project.documents?.map((d) => (
                <Link
                  key={d.id}
                  to={`/documents/${d.id}`}
                  className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-slate-200">{d.title}</span>
                  <span className="text-slate-400">{d.category}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Discussion Comments */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-100">Project Discussion ({project.comments?.length || 0})</h3>
          </div>

          <div className="space-y-2.5">
            {project.comments?.map((c) => (
              <div key={c.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span className="font-semibold text-slate-200">{c.user_name || 'Member'}</span>
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-300">{c.content}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handlePostComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Post an update or question regarding this project..."
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

      <ProjectFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onProjectSaved={fetchProjectDetails}
        initialProject={project}
        departments={departments}
        members={members}
      />

      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onTaskSaved={fetchProjectDetails}
        projects={[project]}
        departments={departments}
        members={members}
        allTasks={project.tasks || []}
      />
    </div>
  );
};
