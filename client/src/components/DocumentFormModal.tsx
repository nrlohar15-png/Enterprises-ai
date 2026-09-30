import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { Document, Department, Project, DocumentCategory, DocumentVisibility } from '../../../shared/types/index.js';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentSaved: () => void;
  initialDocument?: Document | null;
  departments: Department[];
  projects: Project[];
}

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  isOpen,
  onClose,
  onDocumentSaved,
  initialDocument,
  departments,
  projects,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Knowledge Article');
  const [departmentId, setDepartmentId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [visibility, setVisibility] = useState<DocumentVisibility>('organization');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDocument) {
      setTitle(initialDocument.title);
      setContent(initialDocument.content);
      setCategory(initialDocument.category);
      setDepartmentId(initialDocument.department_id || '');
      setProjectId(initialDocument.project_id || '');
      setVisibility(initialDocument.visibility);
      setTags((initialDocument.tags || []).join(', '));
    } else {
      setTitle('');
      setContent('');
      setCategory('Knowledge Article');
      setDepartmentId('');
      setProjectId('');
      setVisibility('organization');
      setTags('');
    }
    setError(null);
  }, [initialDocument, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      category,
      department_id: departmentId || null,
      project_id: projectId || null,
      visibility,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    try {
      if (initialDocument) {
        await api.updateDocument(initialDocument.id, payload);
      } else {
        await api.createDocument(payload);
      }
      onDocumentSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-slate-100">
              {initialDocument ? 'Edit Knowledge Document' : 'Create Enterprise Document'}
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
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Incident Response & Zero-Trust Architecture Playbook"
              className="enterprise-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="enterprise-input"
              >
                <option value="Policy">Policy</option>
                <option value="SOP">SOP</option>
                <option value="Report">Report</option>
                <option value="Meeting Notes">Meeting Notes</option>
                <option value="Project Documentation">Project Documentation</option>
                <option value="Business Document">Business Document</option>
                <option value="Knowledge Article">Knowledge Article</option>
                <option value="Other">Other</option>
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
                <option value="">Organization-wide</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as DocumentVisibility)}
                className="enterprise-input"
              >
                <option value="organization">Organization (All Members)</option>
                <option value="department">Department Only</option>
                <option value="project">Project Team</option>
                <option value="private">Private (Restricted)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Content & Specifications *
            </label>
            <textarea
              rows={10}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or write documentation, policy guidelines, SOP procedures..."
              className="enterprise-input font-mono text-xs leading-relaxed resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="security, compliance, audit, soc2"
              className="enterprise-input"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="enterprise-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="enterprise-btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{initialDocument ? 'Save Changes' : 'Publish Document'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
