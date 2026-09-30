import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Sparkles, CheckCircle2, Clock, ArrowRight, Loader2, User, CheckSquare } from 'lucide-react';
import { api } from '../services/api.js';
import { Meeting, Department, Project } from '../../../shared/types/index.js';
import { MeetingFormModal } from '../components/MeetingFormModal.js';

export const MeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const [mRes, dRes, pRes] = await Promise.all([
        api.getMeetings(),
        api.getDepartments(),
        api.getProjects(),
      ]);
      setMeetings(mRes);
      setDepartments(dRes);
      setProjects(pRes);
      if (mRes.length > 0 && !selectedMeeting) {
        // Fetch detailed meeting
        const detailed = await api.getMeeting(mRes[0].id);
        setSelectedMeeting(detailed);
      }
    } catch (err) {
      console.error('Fetch meetings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleSelectMeeting = async (meeting: Meeting) => {
    try {
      const detailed = await api.getMeeting(meeting.id);
      setSelectedMeeting(detailed);
    } catch (err) {
      console.error('Fetch detailed meeting error:', err);
    }
  };

  const handleConvertActionItem = async (actionItemId: string) => {
    if (!selectedMeeting) return;
    setConvertingId(actionItemId);
    try {
      await api.convertMeetingActionItem(selectedMeeting.id, actionItemId);
      // Refresh current meeting
      const updated = await api.getMeeting(selectedMeeting.id);
      setSelectedMeeting(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to convert action item to task');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Meeting Intelligence & Action Items</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated AI meeting note triage, decision synthesis, and 1-click action item to task conversion
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="enterprise-btn-primary text-xs py-2 px-3 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record New Meeting</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="enterprise-panel p-12 text-center text-slate-500 text-xs">
          No meeting notes recorded yet. Click "Record New Meeting" to analyze a meeting with AI.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Meeting List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              Recorded Meetings ({meetings.length})
            </h3>
            <div className="space-y-2">
              {meetings.map((m) => {
                const isSelected = selectedMeeting?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMeeting(m)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-amber-500/50 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                        {m.department_name || 'General Sync'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(m.meeting_date).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{m.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{m.summary || m.raw_notes}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Meeting Analysis & Action Item Converter */}
          <div className="lg:col-span-2">
            {selectedMeeting ? (
              <div className="enterprise-panel p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs text-amber-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(selectedMeeting.meeting_date).toLocaleString()}</span>
                    {selectedMeeting.organizer_name && (
                      <span className="text-slate-400">• Organizer: {selectedMeeting.organizer_name}</span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100">{selectedMeeting.title}</h2>
                </div>

                {/* AI Executive Summary Banner */}
                {selectedMeeting.summary && (
                  <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Meeting Synthesis</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {selectedMeeting.summary}
                    </p>
                  </div>
                )}

                {/* Extracted Action Items with 1-Click Task Converter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      AI Extracted Action Items ({selectedMeeting.action_items?.length || 0})
                    </h3>
                    <span className="text-xs text-emerald-400 font-medium">
                      Convert to production task with 1-click
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedMeeting.action_items?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3">No pending action items extracted.</p>
                    ) : (
                      selectedMeeting.action_items?.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-xs sm:text-sm text-slate-200">
                                {item.title}
                              </span>
                              {item.status === 'converted_to_task' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Converted to Task
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{item.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                              {item.assignee_name && (
                                <span>Suggested Owner: {item.assignee_name}</span>
                              )}
                              {item.deadline && (
                                <span>Target: {item.deadline}</span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 self-end sm:self-center">
                            {item.status === 'converted_to_task' ? (
                              item.task_id ? (
                                <a
                                  href={`/tasks/${item.task_id}`}
                                  className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
                                >
                                  <span>View Task</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <span className="text-xs text-slate-500 font-medium">Converted</span>
                              )
                            ) : (
                              <button
                                onClick={() => handleConvertActionItem(item.id)}
                                disabled={convertingId === item.id}
                                className="enterprise-btn-primary text-xs py-1.5 px-3"
                              >
                                {convertingId === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckSquare className="w-3.5 h-3.5" />
                                )}
                                <span>Convert to Task</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Raw Notes Box */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Original Notes Transcript
                  </h3>
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {selectedMeeting.raw_notes}
                  </div>
                </div>
              </div>
            ) : (
              <div className="enterprise-panel p-12 text-center text-slate-400 text-xs">
                Select a meeting from the list to view its AI summary and action items.
              </div>
            )}
          </div>
        </div>
      )}

      <MeetingFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onMeetingSaved={fetchMeetings}
        departments={departments}
        projects={projects}
      />
    </div>
  );
};
