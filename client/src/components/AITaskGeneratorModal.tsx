import React, { useState } from 'react';
import { Sparkles, X, Plus, Check, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { AIGeneratedTaskItem, Department, TaskPriority } from '../../../shared/types/index.js';
import { TaskPriorityBadge } from './Badges.js';

interface AITaskGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: () => void;
  departments: Department[];
}

export const AITaskGeneratorModal: React.FC<AITaskGeneratorModalProps> = ({
  isOpen,
  onClose,
  onTasksCreated,
  departments,
}) => {
  const [prompt, setPrompt] = useState(
    'We need to launch the new enterprise customer portal next month. Marketing should prepare the promotional campaign and blog post, Engineering must complete deployment and load testing, and Finance should approve the cloud infrastructure budget.'
  );
  const [generating, setGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<AIGeneratedTaskItem[]>([]);
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await api.generateTasksAI(prompt);
      setGeneratedTasks(res.tasks);
      // Select all generated tasks by default for confirmation
      setSelectedTaskIndices(res.tasks.map((_, i) => i));
    } catch (err: any) {
      setError(err.message || 'Failed to generate tasks with AI');
    } finally {
      setGenerating(false);
    }
  };

  const toggleSelect = (index: number) => {
    if (selectedTaskIndices.includes(index)) {
      setSelectedTaskIndices(selectedTaskIndices.filter(i => i !== index));
    } else {
      setSelectedTaskIndices([...selectedTaskIndices, index]);
    }
  };

  const handleConfirmAndSave = async () => {
    if (selectedTaskIndices.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      const tasksToCreate = selectedTaskIndices.map(i => generatedTasks[i]);

      for (const t of tasksToCreate) {
        // Map department name to department_id
        const matchedDept = departments.find(
          d => d.name.toLowerCase() === (t.department || '').toLowerCase()
        );

        await api.createTask({
          title: t.title,
          description: `${t.description}\n\n[AI Reasoning]: ${t.reasoning}`,
          department_id: matchedDept?.id || null,
          priority: t.priority as TaskPriority,
          due_date: t.suggested_due_date,
          status: 'todo',
          labels: ['ai-generated']
        });
      }

      onTasksCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save confirmed tasks to database');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-500/10 rounded-lg border border-brand-500/20 text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">AI Task Generation & Auto-Decomposition</h3>
              <p className="text-xs text-slate-400">Convert unstructured requests into structured, confirmable enterprise tasks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-200 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Unstructured input prompt */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Unstructured Operational Request
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Next quarter we must launch feature X, marketing needs to build landing page..."
              className="enterprise-input resize-none"
            />
            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="enterprise-btn-primary"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Decomposing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Structured Tasks</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Tasks Review List */}
          {generatedTasks.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Generated Tasks ({selectedTaskIndices.length} of {generatedTasks.length} selected)
                </span>
                <span className="text-xs text-brand-400 font-medium">
                  Review & Confirm before saving to database
                </span>
              </div>

              <div className="space-y-2.5">
                {generatedTasks.map((t, idx) => {
                  const isSelected = selectedTaskIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelect(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/70 border-brand-500/50 shadow-md'
                          : 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                            isSelected
                              ? 'bg-brand-600 border-brand-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-slate-100">{t.title}</h4>
                            <TaskPriorityBadge priority={t.priority} />
                            {t.department && (
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                                {t.department}
                              </span>
                            )}
                            {t.suggested_due_date && (
                              <span className="text-xs text-slate-400">
                                Due: {t.suggested_due_date}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{t.description}</p>
                          <div className="mt-2 text-xs text-brand-300/90 bg-brand-950/40 p-2 rounded-lg border border-brand-900/40">
                            <strong>Reasoning:</strong> {t.reasoning}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <button type="button" onClick={onClose} className="enterprise-btn-secondary">
            Cancel
          </button>
          {generatedTasks.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmAndSave}
              disabled={saving || selectedTaskIndices.length === 0}
              className="enterprise-btn-primary"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Committing to Records...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm & Create {selectedTaskIndices.length} Tasks</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
