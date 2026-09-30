import { z } from 'zod';

// ==================== AUTH SCHEMAS ====================
export const RegisterUserSchema = z.object({
  email: z.string().email('Please enter a valid business email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  organization_name: z.string().min(2, 'Organization name is required'),
  department_name: z.string().optional(),
  title: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ==================== TASK SCHEMAS ====================
export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'blocked', 'completed', 'cancelled']);
export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(255),
  description: z.string().optional(),
  project_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  priority: TaskPriorityEnum.default('medium'),
  status: TaskStatusEnum.default('todo'),
  due_date: z.string().optional().nullable(),
  labels: z.array(z.string()).optional(),
  dependencies: z.array(z.string().uuid()).optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

// ==================== PROJECT SCHEMAS ====================
export const ProjectStatusEnum = z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']);

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  department_id: z.string().uuid().optional().nullable(),
  owner_id: z.string().uuid().optional(),
  status: ProjectStatusEnum.default('planning'),
  start_date: z.string().optional().nullable(),
  target_date: z.string().optional().nullable(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

// ==================== DOCUMENT SCHEMAS ====================
export const DocumentCategoryEnum = z.enum([
  'Policy',
  'SOP',
  'Report',
  'Meeting Notes',
  'Project Documentation',
  'Business Document',
  'Knowledge Article',
  'Other'
]);

export const DocumentVisibilityEnum = z.enum(['organization', 'department', 'project', 'private']);

export const CreateDocumentSchema = z.object({
  title: z.string().min(1, 'Document title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  category: DocumentCategoryEnum.default('Knowledge Article'),
  department_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  visibility: DocumentVisibilityEnum.default('organization'),
  tags: z.array(z.string()).optional(),
});

export const UpdateDocumentSchema = CreateDocumentSchema.partial();

// ==================== MEETING SCHEMAS ====================
export const CreateMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(255),
  meeting_date: z.string(),
  department_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  attendees: z.array(z.string()).optional(),
  raw_notes: z.string().min(1, 'Meeting notes are required'),
});

// ==================== SEARCH SCHEMA ====================
export const SearchSchema = z.object({
  query: z.string().min(1, 'Search query must not be empty'),
  department_id: z.string().uuid().optional(),
  type: z.enum(['all', 'document', 'task', 'project', 'meeting', 'policy']).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

// ==================== AI SCHEMAS (Section 15) ====================

// 15.1 Enterprise Chat
export const AIChatSourceSchema = z.object({
  type: z.enum(['task', 'project', 'document', 'meeting', 'department']),
  id: z.string(),
  title: z.string(),
});

export const AIChatSchema = z.object({
  answer: z.string(),
  key_points: z.array(z.string()),
  sources: z.array(AIChatSourceSchema),
  follow_up_questions: z.array(z.string()),
});

// 15.2 Document Summary
export const DocumentSummaryActionItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  suggested_owner: z.string().nullable().optional(),
  suggested_deadline: z.string().nullable().optional(),
});

export const AISummarySchema = z.object({
  summary: z.string(),
  key_points: z.array(z.string()),
  decisions: z.array(z.string()),
  action_items: z.array(DocumentSummaryActionItemSchema),
  risks: z.array(z.string()),
});

// 15.3 AI Task Generation
export const AIGeneratedTaskItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  department: z.string().nullable().optional(),
  suggested_assignee: z.string().nullable().optional(),
  priority: TaskPriorityEnum,
  suggested_due_date: z.string().nullable().optional(),
  dependencies: z.array(z.string()).default([]),
  reasoning: z.string(),
});

export const AITaskGenerationSchema = z.object({
  tasks: z.array(AIGeneratedTaskItemSchema),
});

// 15.4 Meeting Analysis
export const MeetingAnalysisActionItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  owner: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
});

export const MeetingAnalysisSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  action_items: z.array(MeetingAnalysisActionItemSchema),
  risks: z.array(z.string()),
  follow_up_items: z.array(z.string()),
});

// 15.5 Operational Insights
export const AIInsightRecordSchema = z.object({
  type: z.enum(['task', 'project', 'department', 'document']),
  id: z.string(),
});

export const AIInsightItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['deadline', 'workload', 'risk', 'dependency', 'bottleneck', 'performance']),
  evidence: z.array(z.string()),
  recommended_actions: z.array(z.string()),
  related_records: z.array(AIInsightRecordSchema).default([]),
});

export const AIInsightResponseSchema = z.object({
  insights: z.array(AIInsightItemSchema),
});

// 15.6 Executive Report
export const ReportMetricSchema = z.object({
  name: z.string(),
  value: z.string(),
  context: z.string(),
});

export const ReportSchema = z.object({
  executive_summary: z.string(),
  key_metrics: z.array(ReportMetricSchema),
  achievements: z.array(z.string()),
  risks: z.array(z.string()),
  bottlenecks: z.array(z.string()),
  upcoming_priorities: z.array(z.string()),
  recommended_actions: z.array(z.string()),
});

export const CreateCommentSchema = z.object({
  entity_type: z.enum(['task', 'project', 'document', 'meeting']),
  entity_id: z.string().uuid(),
  content: z.string().min(1, 'Comment cannot be empty'),
});

export const AITaskAnalysisSchema = z.object({
  task_id: z.string(),
  task_title: z.string(),
  feasibility_score: z.number().min(0).max(100),
  executive_summary: z.string(),
  action_plan: z.array(z.object({
    phase: z.string(),
    steps: z.array(z.string()),
  })),
  blockers_and_risks: z.array(z.string()),
  prerequisites: z.array(z.string()),
  estimated_completion_days: z.number(),
  recommended_subtasks: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    estimated_hours: z.number().optional(),
  })),
  confidence_rating: z.enum(['high', 'medium', 'low']),
});

