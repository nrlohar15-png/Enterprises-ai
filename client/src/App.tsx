import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { AppLayout } from './layouts/AppLayout.js';

import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AIAssistantPage } from './pages/AIAssistantPage.js';
import { SearchPage } from './pages/SearchPage.js';
import { TasksPage } from './pages/TasksPage.js';
import { TaskDetailsPage } from './pages/TaskDetailsPage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage.js';
import { DepartmentsPage } from './pages/DepartmentsPage.js';
import { DepartmentDetailsPage } from './pages/DepartmentDetailsPage.js';
import { DocumentsPage } from './pages/DocumentsPage.js';
import { DocumentDetailsPage } from './pages/DocumentDetailsPage.js';
import { MeetingsPage } from './pages/MeetingsPage.js';
import { InsightsPage } from './pages/InsightsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { ActivityPage } from './pages/ActivityPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying secure enterprise session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Enterprise Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="assistant" element={<AIAssistantPage />} />
        <Route path="search" element={<SearchPage />} />

        {/* Tasks */}
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:id" element={<TaskDetailsPage />} />

        {/* Projects */}
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailsPage />} />

        {/* Departments */}
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="departments/:id" element={<DepartmentDetailsPage />} />

        {/* Documents */}
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/:id" element={<DocumentDetailsPage />} />

        {/* Meetings */}
        <Route path="meetings" element={<MeetingsPage />} />

        {/* Intelligence */}
        <Route path="insights" element={<InsightsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="activity" element={<ActivityPage />} />

        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/profile" element={<SettingsPage />} />
        <Route path="settings/organization" element={<SettingsPage />} />
        <Route path="settings/members" element={<SettingsPage />} />
        <Route path="settings/security" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
