import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ListOrdered,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Plus,
  Send,
  Calendar,
  User,
  Briefcase
} from 'lucide-react';
import { Task, AITaskAnalysisResponse, AITaskAnalysisSubtask } from '../../../shared/types/index.js';
import { api } from '../services/api.js';
import { TaskStatusBadge, TaskPriorityBadge } from './Badges.js';

interface TaskAnalysisModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSubtasksCreated?: () => void;
}

export const TaskAnalysisModal: React.FC<TaskAnalysisModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onSubtasksCreated,
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [analysis, setAnalysis] = useState<AITaskAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [selectedSubtasks, setSelectedSubtasks] = useState<Record<number, boolean>>({});
  const [creatingSubtasks, setCreatingSubtasks] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && taskId) {
      loadTaskAndAnalyze(taskId);
    } else {
      setTask(null);
      setAnalysis(null);
      setCustomQuery('');
      setSelectedSubtasks({});
      setCreateSuccessMsg(null);
      setError(null);
    }
  }, [isOpen, taskId]);

  const loadTaskAndAnalyze = async (id: string, query?: string) => {
    setLoading(true);
    setError(null);
    setCreateSuccessMsg(null);
    try {
      // Fetch task details if not already loaded
      const taskData = await api.getTask(id);
      setTask(taskData);

      // Perform AI Analysis
      const analysisData = await api.analyzeTask(id, query);
      setAnalysis(analysisData);

      // Default select all recommended subtasks
      const initialSelected: Record<number, boolean> = {};
      analysisData.recommended_subtasks.forEach((_, idx) => {
        initialSelected[idx] = true;
      });
      setSelectedSubtasks(initialSelected);
    } catch (err: any) {
      console.error('Failed to run task analysis:', err);
      setError(err.message || 'Failed to analyze task');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !customQuery.trim()) return;
    loadTaskAndAnalyze(taskId, customQuery.trim());
  };

  const toggleSubtask = (index: number) => {
    setSelectedSubtasks(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCreateSelectedSubtasks = async () => {
    if (!task || !analysis) return;
    const toCreate = analysis.recommended_subtasks.filter((_, idx) => selectedSubtasks[idx]);
    if (toCreate.length === 0) return;

    setCreatingSubtasks(true);
    setCreateSuccessMsg(null);
    try {
      for (const sub of toCreate) {
        await api.createTask({
          title: sub.title,
          description: `Subtask of "${task.title}": ${sub.description}`,
          project_id: task.project_id,
          department_id: task.department_id,
          priority: sub.priority,
          status: 'todo',
          estimated_hours: sub.estimated_hours,
        });
      }
      setCreateSuccessMsg(`Successfully created ${toCreate.length} subtask(s) in the database!`);
      if (onSubtasksCreated) onSubtasksCreated();
    } catch (err: any) {
      console.error('Failed to create subtasks:', err);
      setError('Failed to create some subtasks. Please try again.');
    } finally {
      setCreatingSubtasks(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">AI Operations Intelligence</span>
                <span className="text-xs text-slate-500">• Deep Task Analysis</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 line-clamp-1">
                {task?.title || 'Analyzing Task...'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-2 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Task Card Context */}
          {task && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  {task.department_name && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      {task.department_name}
                    </span>
                  )}
                  {task.assignee_name && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      {task.assignee_name}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {task.description && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40">
                  {task.description}
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
              <p className="text-sm text-slate-300 font-medium">Synthesizing deep task roadmap and operational dependencies...</p>
              <p className="text-xs text-slate-500">Evaluating risks, prerequisites, and milestone feasibility.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Analysis Results */}
          {!loading && analysis && (
            <div className="space-y-6">
              {/* Feasibility & Confidence Score Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Feasibility Score</span>
                    <span className="font-bold text-slate-100">{analysis.feasibility_score}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        analysis.feasibility_score >= 80
                          ? 'bg-emerald-500'
                          : analysis.feasibility_score >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${analysis.feasibility_score}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                  <span className="text-xs text-slate-400">Execution Estimate</span>
                  <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    ~{analysis.estimated_completion_days} Work Days
                  </span>
                </div>

                <div className="flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                  <span className="text-xs text-slate-400">AI Confidence</span>
                  <span className="text-sm font-bold uppercase tracking-wider text-brand-400 mt-0.5">
                    {analysis.confidence_rating} Confidence
                  </span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  Executive Assessment & Scope
                </h3>
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-sm text-slate-200 leading-relaxed">
                  {analysis.executive_summary}
                </div>
              </div>

              {/* Action Plan Phases */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-purple-400" />
                  Chronological Execution Roadmap
                </h3>
                <div className="space-y-3">
                  {analysis.action_plan.map((phase, pIdx) => (
                    <div key={pIdx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px]">
                          {pIdx + 1}
                        </span>
                        {phase.phase}
                      </div>
                      <ul className="space-y-1.5 pl-7">
                        {phase.steps.map((step, sIdx) => (
                          <li key={sIdx} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-brand-400 font-bold">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blockers, Risks & Prerequisites */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                  <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Blockers & Operational Risks
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {analysis.blockers_and_risks.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                  <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Prerequisites & Verification Gates
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {analysis.prerequisites.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-400 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Subtasks with 1-Click Creation */}
              {analysis.recommended_subtasks?.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      Recommended Subtasks (1-Click Database Creation)
                    </h3>
                    <span className="text-xs text-slate-500">
                      {Object.values(selectedSubtasks).filter(Boolean).length} of {analysis.recommended_subtasks.length} selected
                    </span>
                  </div>

                  {createSuccessMsg && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{createSuccessMsg}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {analysis.recommended_subtasks.map((sub, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleSubtask(idx)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          selectedSubtasks[idx]
                            ? 'bg-slate-900 border-brand-500/40 shadow-sm'
                            : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedSubtasks[idx]}
                          onChange={() => {}} // handled by div click
                          className="mt-1 rounded bg-slate-800 border-slate-700 text-brand-500 focus:ring-brand-400 cursor-pointer"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-100">{sub.title}</span>
                            <div className="flex items-center gap-2">
                              <TaskPriorityBadge priority={sub.priority} />
                              {sub.estimated_hours && (
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {sub.estimated_hours}h
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400">{sub.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleCreateSelectedSubtasks}
                      disabled={creatingSubtasks || Object.values(selectedSubtasks).filter(Boolean).length === 0}
                      className="enterprise-btn-primary text-xs py-2 px-4 flex items-center gap-2 disabled:opacity-50"
                    >
                      {creatingSubtasks ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating Subtasks in Database...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            Create {Object.values(selectedSubtasks).filter(Boolean).length} Selected Subtasks
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Follow-up Prompt Bar */}
          <form onSubmit={handleCustomQuerySubmit} className="pt-4 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Ask AI Deep Questions or Technical Advice About This Task:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customQuery}
                onChange={e => setCustomQuery(e.target.value)}
                placeholder="e.g. What specific tools and credentials do I need for this task?"
                className="enterprise-input text-xs flex-1 py-2"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !customQuery.trim()}
                className="enterprise-btn-primary text-xs py-2 px-3 flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Analyze</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
