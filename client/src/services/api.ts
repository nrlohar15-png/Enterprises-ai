import {
  AuthUser,
  DashboardData,
  Task,
  Project,
  Department,
  Document,
  Meeting,
  AIInsightItem,
  ExecutiveReportResponse,
  ActivityLog,
  SearchResultItem,
  AIChatResponse,
  DocumentSummaryResponse,
  AITaskGenerationResponse,
  MeetingAnalysisResponse,
  Comment,
  AITaskAnalysisResponse
} from '../../../shared/types/index.js';

class ApiService {
  private baseUrl = '/api';

  private getToken(): string | null {
    return localStorage.getItem('enterprise_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Don't clear session here for /auth/me — AuthContext.initAuth handles that.
      // For all other endpoints, a 401 means the active token is rejected; clear session.
      if (endpoint !== '/auth/me') {
        localStorage.removeItem('enterprise_token');
        localStorage.removeItem('enterprise_user');
        window.dispatchEvent(new Event('auth_state_changed'));
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: Failed to execute request`);
    }

    return data as T;
  }

  // Auth
  async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: any): Promise<{ user: AuthUser; token: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('enterprise_token');
      localStorage.removeItem('enterprise_user');
      window.dispatchEvent(new Event('auth_state_changed'));
    }
  }

  async getMe(): Promise<{ user: AuthUser }> {
    return this.request('/auth/me');
  }

  // Dashboard
  async getDashboard(): Promise<DashboardData> {
    return this.request('/dashboard');
  }

  // Tasks
  async getTasks(params: Record<string, string> = {}): Promise<Task[]> {
    const q = new URLSearchParams(params).toString();
    return this.request(`/tasks${q ? '?' + q : ''}`);
  }

  async getTask(id: string): Promise<Task & { comments: Comment[] }> {
    return this.request(`/tasks/${id}`);
  }

  async createTask(data: any): Promise<Task> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any): Promise<Task> {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  // Projects
  async getProjects(params: Record<string, string> = {}): Promise<Project[]> {
    const q = new URLSearchParams(params).toString();
    return this.request(`/projects${q ? '?' + q : ''}`);
  }

  async getProject(id: string): Promise<Project & { tasks: Task[]; documents: Document[]; comments: Comment[] }> {
    return this.request(`/projects/${id}`);
  }

  async createProject(data: any): Promise<Project> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: any): Promise<Project> {
    return this.request(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    return this.request(`/projects/${id}`, { method: 'DELETE' });
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    return this.request('/departments');
  }

  async getDepartment(id: string): Promise<Department & { members: any[]; projects: Project[]; tasks: Task[]; documents: Document[] }> {
    return this.request(`/departments/${id}`);
  }

  // Documents
  async getDocuments(params: Record<string, string> = {}): Promise<Document[]> {
    const q = new URLSearchParams(params).toString();
    return this.request(`/documents${q ? '?' + q : ''}`);
  }

  async getDocument(id: string): Promise<Document & { tags: string[]; comments: Comment[] }> {
    return this.request(`/documents/${id}`);
  }

  async createDocument(data: any): Promise<Document> {
    return this.request('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDocument(id: string, data: any): Promise<Document> {
    return this.request(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: string): Promise<{ message: string }> {
    return this.request(`/documents/${id}`, { method: 'DELETE' });
  }

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    return this.request('/meetings');
  }

  async getMeeting(id: string): Promise<Meeting> {
    return this.request(`/meetings/${id}`);
  }

  async createMeeting(data: any): Promise<Meeting> {
    return this.request('/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async convertMeetingActionItem(meetingId: string, actionItemId: string): Promise<{ message: string; task: Task }> {
    return this.request(`/meetings/${meetingId}/action-items/${actionItemId}/convert-to-task`, {
      method: 'POST',
    });
  }

  // Search
  async search(query: string, type = 'all', department_id?: string): Promise<SearchResultItem[]> {
    const params = new URLSearchParams({ query, type });
    if (department_id) params.append('department_id', department_id);
    return this.request(`/search?${params.toString()}`);
  }

  // AI Services
  async chatWithAI(query: string, conversation_id?: string): Promise<AIChatResponse & { conversation_id: string }> {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ query, conversation_id }),
    });
  }

  async summarizeDocumentAI(data: { title: string; content: string; category?: string }): Promise<DocumentSummaryResponse> {
    return this.request('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateTasksAI(inputText: string): Promise<AITaskGenerationResponse> {
    return this.request('/ai/generate-tasks', {
      method: 'POST',
      body: JSON.stringify({ input_text: inputText }),
    });
  }

  async generateInsightsAI(): Promise<{ insights: AIInsightItem[] }> {
    return this.request('/ai/generate-insights', { method: 'POST' });
  }

  async generateExecutiveReportAI(title?: string): Promise<ExecutiveReportResponse> {
    return this.request('/ai/generate-report', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  // Insights
  async getInsights(params: Record<string, string> = {}): Promise<AIInsightItem[]> {
    const q = new URLSearchParams(params).toString();
    return this.request(`/insights${q ? '?' + q : ''}`);
  }

  async resolveInsight(id: string, is_resolved = true): Promise<AIInsightItem> {
    return this.request(`/insights/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ is_resolved }),
    });
  }

  // Reports
  async getReports(): Promise<ExecutiveReportResponse[]> {
    return this.request('/reports');
  }

  async getReport(id: string): Promise<ExecutiveReportResponse> {
    return this.request(`/reports/${id}`);
  }

  // Activity Logs
  async getActivity(params: Record<string, string> = {}): Promise<ActivityLog[]> {
    const q = new URLSearchParams(params).toString();
    return this.request(`/activity${q ? '?' + q : ''}`);
  }

  // Comments
  async getComments(entity_type: string, entity_id: string): Promise<Comment[]> {
    return this.request(`/comments?entity_type=${entity_type}&entity_id=${entity_id}`);
  }

  async createComment(entity_type: string, entity_id: string, content: string): Promise<Comment> {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify({ entity_type, entity_id, content }),
    });
  }

  // Settings
  async getOrganization(): Promise<any> {
    return this.request('/settings/organization');
  }

  async getMembers(): Promise<any[]> {
    return this.request('/settings/members');
  }

  async updateMemberRole(memberId: string, role: string, departmentId?: string): Promise<any> {
    return this.request(`/settings/members/${memberId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, department_id: departmentId }),
    });
  }

  async updateProfile(data: any): Promise<any> {
    return this.request('/settings/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // AI Task Analysis
  async analyzeTask(taskId: string, query?: string): Promise<AITaskAnalysisResponse> {
    return this.request<AITaskAnalysisResponse>('/ai/analyze-task', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, query }),
    });
  }
}

export const api = new ApiService();
