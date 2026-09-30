import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Sparkles, User, Calendar, FileText, Loader2, MessageSquare, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api.js';
import { Document, Department, Project, Comment, DocumentSummaryResponse } from '../../../shared/types/index.js';
import { DocumentFormModal } from '../components/DocumentFormModal.js';

export const DocumentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<(Document & { tags: string[]; comments: Comment[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<DocumentSummaryResponse | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchDoc = async () => {
    if (!id) return;
    try {
      const [docData, dData, pData] = await Promise.all([
        api.getDocument(id),
        api.getDepartments(),
        api.getProjects(),
      ]);
      setDoc(docData);
      setDepartments(dData);
      setProjects(pData);
    } catch (err) {
      console.error('Fetch document error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteDocument(id);
      navigate('/documents');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleRunAISummary = async () => {
    if (!doc) return;
    setSummarizing(true);
    try {
      const res = await api.summarizeDocumentAI({
        title: doc.title,
        content: doc.content,
        category: doc.category,
      });
      setAiSummary(res);
    } catch (err) {
      console.error('Summarize error:', err);
    } finally {
      setSummarizing(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      await api.createComment('document', id, commentText.trim());
      setCommentText('');
      fetchDoc();
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="enterprise-panel p-12 text-center text-slate-400 text-sm">
        Document not found or access denied.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Knowledge Repository</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAISummary}
            disabled={summarizing}
            className="enterprise-btn-primary text-xs py-1.5 px-3"
          >
            {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Run AI Summary</span>
          </button>
          <button
            onClick={() => setEditModalOpen(true)}
            className="enterprise-btn-secondary text-xs py-1.5 px-3"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="enterprise-panel p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/40 px-2.5 py-0.5 rounded border border-blue-800/40">
              {doc.category}
            </span>
            <span className="text-xs text-slate-400 capitalize">
              Visibility: {doc.visibility}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{doc.title}</h1>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block">Author</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{doc.author_name || 'System'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Department</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{doc.department_name || 'Organization-wide'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Created</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{new Date(doc.created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Last Modified</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{new Date(doc.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* AI Summary Section if triggered */}
        {aiSummary && (
          <div className="p-5 rounded-xl bg-brand-950/20 border border-brand-500/30 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Executive AI Intelligence & Synthesis</span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">{aiSummary.summary}</p>

            {aiSummary.key_points && (
              <div>
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Key Points</h5>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {aiSummary.key_points.map((pt, i) => <li key={i}>{pt}</li>)}
                </ul>
              </div>
            )}

            {aiSummary.action_items && aiSummary.action_items.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Action Items</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {aiSummary.action_items.map((act, i) => (
                    <div key={i} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                      <span className="font-semibold text-slate-200 block">{act.title}</span>
                      <span className="text-slate-400 mt-0.5 block">{act.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Document Body */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Document Content
          </h3>
          <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {doc.content}
          </div>
        </div>

        {/* Discussion Comments */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-100">Document Feedback & Peer Review ({doc.comments?.length || 0})</h3>
          </div>

          <div className="space-y-2.5">
            {doc.comments?.map((c) => (
              <div key={c.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span className="font-semibold text-slate-200">{c.user_name || 'Reviewer'}</span>
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
              placeholder="Leave revision feedback or questions..."
              className="enterprise-input text-xs"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="enterprise-btn-primary px-3 text-xs shrink-0"
            >
              {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Comment</span>
            </button>
          </form>
        </div>
      </div>

      <DocumentFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onDocumentSaved={fetchDoc}
        initialDocument={doc}
        departments={departments}
        projects={projects}
      />
    </div>
  );
};
