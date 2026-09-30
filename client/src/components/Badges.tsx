import React from 'react';
import { TaskStatus, TaskPriority, ProjectStatus, InsightSeverity } from '../../../shared/types/index.js';

export const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const configs: Record<TaskStatus, { bg: string; text: string; dot: string; label: string }> = {
    todo: { bg: 'bg-slate-800 text-slate-300 border-slate-700', text: 'text-slate-300', dot: 'bg-slate-400', label: 'To Do' },
    in_progress: { bg: 'bg-blue-950/60 text-blue-300 border-blue-800/60', text: 'text-blue-300', dot: 'bg-blue-400', label: 'In Progress' },
    blocked: { bg: 'bg-rose-950/60 text-rose-300 border-rose-800/60', text: 'text-rose-300', dot: 'bg-rose-400 animate-pulse', label: 'Blocked' },
    completed: { bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60', text: 'text-emerald-300', dot: 'bg-emerald-400', label: 'Completed' },
    cancelled: { bg: 'bg-slate-900 text-slate-400 border-slate-800', text: 'text-slate-400', dot: 'bg-slate-500', label: 'Cancelled' },
  };

  const cfg = configs[status] || configs.todo;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

export const TaskPriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const configs: Record<TaskPriority, { bg: string; text: string; label: string }> = {
    low: { bg: 'bg-slate-800 text-slate-300 border-slate-700', text: 'text-slate-300', label: 'Low' },
    medium: { bg: 'bg-amber-950/50 text-amber-300 border-amber-800/50', text: 'text-amber-300', label: 'Medium' },
    high: { bg: 'bg-orange-950/50 text-orange-300 border-orange-800/50', text: 'text-orange-300', label: 'High' },
    critical: { bg: 'bg-rose-950/60 text-rose-300 border-rose-800/60', text: 'text-rose-300', label: 'Critical' },
  };

  const cfg = configs[priority] || configs.medium;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
};

export const ProjectStatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const configs: Record<ProjectStatus, { bg: string; label: string }> = {
    planning: { bg: 'bg-purple-950/50 text-purple-300 border-purple-800/50', label: 'Planning' },
    active: { bg: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50', label: 'Active' },
    on_hold: { bg: 'bg-amber-950/50 text-amber-300 border-amber-800/50', label: 'On Hold' },
    completed: { bg: 'bg-blue-950/50 text-blue-300 border-blue-800/50', label: 'Completed' },
    cancelled: { bg: 'bg-slate-900 text-slate-400 border-slate-800', label: 'Cancelled' },
  };

  const cfg = configs[status] || configs.planning;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: InsightSeverity }> = ({ severity }) => {
  const configs: Record<InsightSeverity, { bg: string; label: string }> = {
    low: { bg: 'bg-slate-800 text-slate-300 border-slate-700', label: 'Low Severity' },
    medium: { bg: 'bg-amber-950/60 text-amber-300 border-amber-800/60', label: 'Medium Severity' },
    high: { bg: 'bg-orange-950/60 text-orange-300 border-orange-800/60', label: 'High Risk' },
    critical: { bg: 'bg-rose-950/80 text-rose-200 border-rose-700 animate-pulse', label: 'Critical Alert' },
  };

  const cfg = configs[severity] || configs.medium;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
};
