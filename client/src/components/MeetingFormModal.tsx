import React, { useState } from 'react';
import { X, Calendar, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { Department, Project } from '../../../shared/types/index.js';

interface MeetingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingSaved: () => void;
  departments: Department[];
  projects: Project[];
}

export const MeetingFormModal: React.FC<MeetingFormModalProps> = ({
  isOpen,
  onClose,
  onMeetingSaved,
  departments,
  projects,
}) => {
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0, 16));
  const [departmentId, setDepartmentId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [attendees, setAttendees] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawNotes.trim()) {
      setError('Title and meeting notes are required');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      meeting_date: new Date(meetingDate).toISOString(),
      department_id: departmentId || null,
      project_id: projectId || null,
      attendees: attendees ? attendees.split(',').map(a => a.trim()).filter(Boolean) : [],
      raw_notes: rawNotes.trim(),
    };

    try {
      await api.createMeeting(payload);
      onMeetingSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to analyze and save meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-slate-100">Record Meeting & Run AI Triage</h3>
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
              Meeting Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Infrastructure Architecture & Security Review"
              className="enterprise-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Meeting Date & Time
              </label>
              <input
                type="datetime-local"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="enterprise-input"
              />
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
                <option value="">Cross-functional / General</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Attendees (comma-separated)
            </label>
            <input
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Sarah Chen, Marcus Vance, Elena Rostova, David Kim"
              className="enterprise-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Raw Meeting Notes & Discussion *
            </label>
            <textarea
              rows={8}
              required
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Paste raw notes, minutes, transcripts, or bullets. AI will automatically extract decisions, action items, risks, and follow-ups..."
              className="enterprise-input font-mono text-xs resize-none leading-relaxed"
            />
          </div>

          <div className="p-3 bg-brand-950/30 border border-brand-500/20 rounded-xl text-xs text-brand-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-brand-400" />
            <span>AI will analyze notes on submission and generate convertable action items.</span>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="enterprise-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="enterprise-btn-primary">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze & Record Meeting</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
