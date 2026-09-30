// Shared TypeScript Type Definitions

export type UserRole = 'employee' | 'manager' | 'department_admin' | 'organization_admin';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export type DocumentCategory = 
  | 'Policy' 
  | 'SOP' 
  | 'Report' 
  | 'Meeting Notes' 
  | 'Project Documentation' 
  | 'Business Document' 
  | 'Knowledge Article' 
  | 'Other';

export type DocumentVisibility = 'organization' | 'department' | 'project' | 'private';

export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';
export type InsightCategory = 'deadline' | 'workload' | 'risk' | 'dependency' | 'bottleneck' | 'performance';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  description?: string;
  head_user_id?: string;
  head_name?: string;
  member_count?: number;
  project_count?: number;
  task_count?: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  department_id?: string;
  role: UserRole;
  joined_at: string;
  user?: User;
  department_name?: string;
}

export interface AuthUser extends User {
  organization_id: string;
  role: UserRole;
  department_id?: string;
  organization_name: string;
  department_name?: string;
}

export interface Project {
  id: string;
  organization_id: string;
  department_id?: string;
  department_name?: string;
  name: string;
  description?: string;
  owner_id: string;
  owner_name?: string;
  status: ProjectStatus;
  start_date?: string;
  target_date?: string;
  task_count?: number;
  completed_task_count?: number;
  progress_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
  project_id?: string;
  project_name?: string;
  department_id?: string;
  department_name?: string;
  creator_id: string;
  creator_name?: string;
  assignee_id?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  labels?: string[];
  dependencies?: { id: string; title: string; status: TaskStatus }[];
  depends_on_task_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  organization_id: string;
  department_id?: string;
  department_name?: string;
  project_id?: string;
  project_name?: string;
  author_id: string;
  author_name?: string;
  title: string;
  content: string;
  category: DocumentCategory;
  visibility: DocumentVisibility;
  summary?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface MeetingActionItem {
  id: string;
  organization_id: string;
  meeting_id: string;
  task_id?: string;
  title: string;
  description?: string;
  assignee_name?: string;
  deadline?: string;
  status: 'pending' | 'converted_to_task' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  organization_id: string;
  department_id?: string;
  department_name?: string;
  project_id?: string;
  project_name?: string;
  organizer_id: string;
  organizer_name?: string;
  title: string;
  meeting_date: string;
  attendees?: string[];
  raw_notes: string;
  summary?: string;
  action_items?: MeetingActionItem[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  organization_id: string;
  entity_type: 'task' | 'project' | 'document' | 'meeting';
  entity_id: string;
  user_id: string;
  user_name?: string;
  avatar_url?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface AIConversation {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: AIMessage[];
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  structured_data?: any;
  created_at: string;
}

// AI Output Schemas Interfaces as required by Section 15
export interface AIChatSource {
  type: 'task' | 'project' | 'document' | 'meeting' | 'department';
  id: string;
  title: string;
}

export interface AIChatResponse {
  answer: string;
  key_points: string[];
  sources: AIChatSource[];
  follow_up_questions: string[];
}

export interface DocumentSummaryActionItem {
  title: string;
  description: string;
  suggested_owner?: string | null;
  suggested_deadline?: string | null;
}

export interface DocumentSummaryResponse {
  summary: string;
  key_points: string[];
  decisions: string[];
  action_items: DocumentSummaryActionItem[];
  risks: string[];
}

export interface AIGeneratedTaskItem {
  title: string;
  description: string;
  department?: string | null;
  suggested_assignee?: string | null;
  priority: TaskPriority;
  suggested_due_date?: string | null;
  dependencies: string[];
  reasoning: string;
}

export interface AITaskGenerationResponse {
  tasks: AIGeneratedTaskItem[];
}

export interface AITaskAnalysisSubtask {
  title: string;
  description: string;
  priority: TaskPriority;
  estimated_hours?: number;
}

export interface AITaskAnalysisPhase {
  phase: string;
  steps: string[];
}

export interface AITaskAnalysisResponse {
  task_id: string;
  task_title: string;
  feasibility_score: number;
  executive_summary: string;
  action_plan: AITaskAnalysisPhase[];
  blockers_and_risks: string[];
  prerequisites: string[];
  estimated_completion_days: number;
  recommended_subtasks: AITaskAnalysisSubtask[];
  confidence_rating: 'high' | 'medium' | 'low';
}

export interface MeetingAnalysisActionItem {
  title: string;
  description: string;
  owner?: string | null;
  deadline?: string | null;
}

export interface MeetingAnalysisResponse {
  summary: string;
  decisions: string[];
  action_items: MeetingAnalysisActionItem[];
  risks: string[];
  follow_up_items: string[];
}

export interface AIInsightRecord {
  type: 'task' | 'project' | 'department' | 'document';
  id: string;
}

export interface AIInsightItem {
  id?: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: InsightCategory;
  evidence: string[];
  recommended_actions: string[];
  related_records: AIInsightRecord[];
  is_resolved?: boolean;
  created_at?: string;
}

export interface AIInsightResponse {
  insights: AIInsightItem[];
}

export interface ReportMetric {
  name: string;
  value: string;
  context: string;
}

export interface ExecutiveReportResponse {
  id?: string;
  title?: string;
  report_type?: string;
  executive_summary: string;
  key_metrics: ReportMetric[];
  achievements: string[];
  risks: string[];
  bottlenecks: string[];
  upcoming_priorities: string[];
  recommended_actions: string[];
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  organization_id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface SearchResultItem {
  id: string;
  type: 'task' | 'project' | 'document' | 'meeting' | 'department' | 'policy';
  title: string;
  snippet: string;
  relevance: number;
  source_reference: string;
  department_name?: string;
  timestamp: string;
  url: string;
}

export interface DashboardData {
  active_projects: Project[];
  assigned_tasks: Task[];
  overdue_tasks: Task[];
  upcoming_deadlines: Task[];
  recent_documents: Document[];
  ai_insights: AIInsightItem[];
  recent_activity: ActivityLog[];
  metrics: {
    total_projects: number;
    active_projects: number;
    total_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    department_count: number;
    active_members: number;
    completion_rate: number;
  };
}
