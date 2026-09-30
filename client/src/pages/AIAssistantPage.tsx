import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Loader2, FileText, CheckSquare, Briefcase, Calendar, Building2, HelpCircle, ArrowRight, User, Clock, ChevronDown, Layers } from 'lucide-react';
import { api } from '../services/api.js';
import { AIChatResponse, Task } from '../../../shared/types/index.js';
import { Link } from 'react-router-dom';
import { TaskStatusBadge, TaskPriorityBadge } from '../components/Badges.js';
import { TaskAnalysisModal } from '../components/TaskAnalysisModal.js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  structured?: AIChatResponse;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  'What are the pending tasks for the marketing department?',
  'Which projects are currently at risk or have overdue tasks?',
  'Summarize the latest architectural decisions from the engineering sync.',
  'What are the major operational bottlenecks facing our DevOps team?',
  'Give me an executive summary of current platform deliverables.',
];

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Enterprise AI Operations Assistant. I analyze live organizational data across tasks, departments, project milestones, meeting notes, and SOPs to provide actionable intelligence.',
      structured: {
        answer: 'I am ready to assist with enterprise operations, cross-department dependencies, and status syntheses.',
        key_points: [
          'Direct access to current department workloads',
          'Deep task feasibility and roadmap decomposition',
          'Contextual citations to internal tasks and SOPs'
        ],
        sources: [],
        follow_up_questions: [
          'What are the highest priority overdue tasks?',
          'What was discussed in the last architecture sync?'
        ]
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [analysisModalTaskId, setAnalysisModalTaskId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getTasks().then(setTasks).catch(() => {});
  }, []);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const text = (queryText || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithAI(text, conversationId);
      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        structured: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to process enterprise AI query.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'project': return <Briefcase className="w-3.5 h-3.5 text-purple-400" />;
      case 'document': return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'meeting': return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      default: return <Building2 className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSourceUrl = (source: { type: string; id: string }) => {
    switch (source.type) {
      case 'task': return `/tasks/${source.id}`;
      case 'project': return `/projects/${source.id}`;
      case 'document': return `/documents/${source.id}`;
      case 'meeting': return `/meetings`;
      default: return `/departments`;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto enterprise-panel overflow-hidden">
      {/* Assistant Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Enterprise AI Operations Copilot</span>
              <span className="text-[10px] font-semibold bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full border border-brand-500/30">
                Ground Truth RAG
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Authorized organizational intelligence layer • ISO/SOC2 isolated
            </p>
          </div>
        </div>
      </div>

      {/* Task Selection and Quick Analysis Bar */}
      <div className="px-6 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 shrink-0">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            Select Task to Analyze:
          </span>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="flex-1 enterprise-input text-xs py-1.5 px-2.5 bg-slate-900 border-slate-800 rounded-lg text-slate-200 focus:border-brand-500"
          >
            <option value="">-- Choose an active task to run AI analysis --</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                [{task.priority.toUpperCase()}] {task.title} ({task.status.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>

        {selectedTask && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnalysisModalTaskId(selectedTask.id)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full AI Deep Analysis</span>
            </button>
          </div>
        )}
      </div>

      {/* Selected Task Highlight Card */}
      {selectedTask && (
        <div className="mx-6 mt-3 p-3 rounded-xl bg-slate-900/90 border border-brand-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-100 truncate">{selectedTask.title}</span>
              <TaskStatusBadge status={selectedTask.status} />
              <TaskPriorityBadge priority={selectedTask.priority} />
            </div>
            {selectedTask.description && (
              <p className="text-xs text-slate-400 line-clamp-1">{selectedTask.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              onClick={() => handleSend(`Analyze this task and assess its risks and dependencies: "${selectedTask.title}"`)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Ask Risks
            </button>
            <button
              onClick={() => handleSend(`What are the step-by-step technical implementation phases for "${selectedTask.title}"?`)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Phases
            </button>
            <button
              onClick={() => setAnalysisModalTaskId(selectedTask.id)}
              className="text-xs px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-colors font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Roadmap & Subtasks
            </button>
          </div>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-2xl rounded-2xl p-4.5 ${
              msg.role === 'user'
                ? 'bg-brand-600 text-white shadow-lg'
                : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-md'
            }`}>
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {msg.content}
              </p>

              {/* Structured AI Outputs (Section 15.1) */}
              {msg.structured && (
                <div className="mt-4 pt-3.5 border-t border-slate-800 space-y-3">
                  {/* Key Points */}
                  {msg.structured.key_points && msg.structured.key_points.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Key Synthesis Points
                      </h5>
                      <ul className="space-y-1">
                        {msg.structured.key_points.map((pt, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sources Grounding */}
                  {msg.structured.sources && msg.structured.sources.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Referenced Enterprise Sources
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {msg.structured.sources.map((src, i) => (
                          <Link
                            key={i}
                            to={getSourceUrl(src)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-brand-300 transition-colors"
                          >
                            {getSourceIcon(src.type)}
                            <span className="font-medium truncate max-w-[180px]">{src.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Prompts */}
                  {msg.structured.follow_up_questions && msg.structured.follow_up_questions.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Suggested Follow-Up Enquiries
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.structured.follow_up_questions.map((fq, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(fq)}
                            className="text-left text-xs px-2.5 py-1 rounded-lg bg-brand-950/40 hover:bg-brand-900/50 text-brand-300 border border-brand-800/40 transition-colors flex items-center gap-1.5"
                          >
                            <HelpCircle className="w-3 h-3 text-brand-400 shrink-0" />
                            <span>{fq}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <span className={`text-[10px] mt-2 block ${
                msg.role === 'user' ? 'text-brand-200' : 'text-slate-500'
              }`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-400 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Bot className="w-4 h-4 text-brand-400" />
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
              <span>Analyzing organizational knowledge & synthesizing response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Row */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about department tasks, blockers, meeting outcomes, or policies..."
            disabled={loading}
            className="flex-1 enterprise-input text-sm py-2.5"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="enterprise-btn-primary px-4 py-2.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>
      </div>

      {/* Task Analysis Deep Modal */}
      {analysisModalTaskId && (
        <TaskAnalysisModal
          taskId={analysisModalTaskId}
          onClose={() => setAnalysisModalTaskId(null)}
          onSubtasksCreated={() => {
            api.getTasks().then(setTasks).catch(() => {});
          }}
        />
      )}
    </div>
  );
};
