import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const orgId = user.organization_id;
    const nowStr = new Date().toISOString().split('T')[0];

    // 1. Active Projects
    const projectsQuery = `
      SELECT p.*, d.name as department_name, u.first_name || ' ' || u.last_name as owner_name,
        (SELECT count(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count
      FROM projects p
      LEFT JOIN departments d ON d.id = p.department_id
      LEFT JOIN users u ON u.id = p.owner_id
      WHERE p.organization_id = $1 AND p.status = 'active'
      ORDER BY p.updated_at DESC
      LIMIT 8
    `;
    const projectsRes = await db.query(projectsQuery, [orgId]);

    // Calculate progress percentage
    const activeProjects = projectsRes.rows.map(p => ({
      ...p,
      task_count: parseInt(p.task_count || '0', 10),
      completed_task_count: parseInt(p.completed_task_count || '0', 10),
      progress_percentage: parseInt(p.task_count || '0', 10) > 0 
        ? Math.round((parseInt(p.completed_task_count || '0', 10) / parseInt(p.task_count, 10)) * 100) 
        : 0
    }));

    // 2. Assigned Tasks (for employee/manager) or Organization Tasks
    let assignedTasksQuery = `
      SELECT t.*, p.name as project_name, d.name as department_name,
        u_assignee.first_name || ' ' || u_assignee.last_name as assignee_name,
        u_assignee.avatar_url as assignee_avatar,
        u_creator.first_name || ' ' || u_creator.last_name as creator_name
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN departments d ON d.id = t.department_id
      LEFT JOIN users u_assignee ON u_assignee.id = t.assignee_id
      LEFT JOIN users u_creator ON u_creator.id = t.creator_id
      WHERE t.organization_id = $1
    `;

    const queryParams: any[] = [orgId];

    if (user.role === 'employee') {
      assignedTasksQuery += ` AND t.assignee_id = $2`;
      queryParams.push(user.id);
    } else if (user.role === 'department_admin' && user.department_id) {
      assignedTasksQuery += ` AND (t.department_id = $2 OR t.assignee_id = $3)`;
      queryParams.push(user.department_id, user.id);
    }

    assignedTasksQuery += ` ORDER BY CASE WHEN t.priority = 'critical' THEN 1 WHEN t.priority = 'high' THEN 2 WHEN t.priority = 'medium' THEN 3 ELSE 4 END, t.due_date ASC NULLS LAST LIMIT 12`;

    const assignedTasksRes = await db.query(assignedTasksQuery, queryParams);

    // 3. Overdue Tasks
    const overdueRes = await db.query(`
      SELECT t.*, p.name as project_name, d.name as department_name,
        u.first_name || ' ' || u.last_name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN departments d ON d.id = t.department_id
      LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.organization_id = $1 AND t.due_date < $2 AND t.status != 'completed' AND t.status != 'cancelled'
      ORDER BY t.due_date ASC
      LIMIT 6
    `, [orgId, nowStr]);

    // 4. Upcoming Deadlines (within next 7 days)
    const upcomingDeadlinesRes = await db.query(`
      SELECT t.*, p.name as project_name, d.name as department_name,
        u.first_name || ' ' || u.last_name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN departments d ON d.id = t.department_id
      LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.organization_id = $1 AND t.due_date >= $2 AND t.status != 'completed' AND t.status != 'cancelled'
      ORDER BY t.due_date ASC
      LIMIT 6
    `, [orgId, nowStr]);

    // 5. Recent Documents
    const documentsRes = await db.query(`
      SELECT d.*, dept.name as department_name, u.first_name || ' ' || u.last_name as author_name
      FROM documents d
      LEFT JOIN departments dept ON dept.id = d.department_id
      LEFT JOIN users u ON u.id = d.author_id
      WHERE d.organization_id = $1
      ORDER BY d.updated_at DESC
      LIMIT 6
    `, [orgId]);

    // 6. AI Insights (Active/Unresolved)
    const insightsRes = await db.query(`
      SELECT * FROM ai_insights
      WHERE organization_id = $1 AND is_resolved = FALSE
      ORDER BY CASE WHEN severity = 'critical' THEN 1 WHEN severity = 'high' THEN 2 WHEN severity = 'medium' THEN 3 ELSE 4 END, created_at DESC
      LIMIT 5
    `, [orgId]);

    // 7. Recent Activity
    const activityRes = await db.query(`
      SELECT a.*, u.first_name || ' ' || u.last_name as user_name
      FROM activity_logs a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.organization_id = $1
      ORDER BY a.created_at DESC
      LIMIT 8
    `, [orgId]);

    // 8. Overall KPI Metrics
    const metricsRes = await db.query(`
      SELECT
        (SELECT count(*) FROM projects WHERE organization_id = $1) as total_projects,
        (SELECT count(*) FROM projects WHERE organization_id = $1 AND status = 'active') as active_projects,
        (SELECT count(*) FROM tasks WHERE organization_id = $1) as total_tasks,
        (SELECT count(*) FROM tasks WHERE organization_id = $1 AND status = 'completed') as completed_tasks,
        (SELECT count(*) FROM tasks WHERE organization_id = $1 AND due_date < $2 AND status != 'completed' AND status != 'cancelled') as overdue_tasks,
        (SELECT count(*) FROM departments WHERE organization_id = $1) as department_count,
        (SELECT count(*) FROM organization_members WHERE organization_id = $1) as active_members
    `, [orgId, nowStr]);

    const m = metricsRes.rows[0];
    const totalTasks = parseInt(m.total_tasks || '0', 10);
    const completedTasks = parseInt(m.completed_tasks || '0', 10);

    return res.json({
      active_projects: activeProjects,
      assigned_tasks: assignedTasksRes.rows,
      overdue_tasks: overdueRes.rows,
      upcoming_deadlines: upcomingDeadlinesRes.rows,
      recent_documents: documentsRes.rows,
      ai_insights: insightsRes.rows,
      recent_activity: activityRes.rows,
      metrics: {
        total_projects: parseInt(m.total_projects || '0', 10),
        active_projects: parseInt(m.active_projects || '0', 10),
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        overdue_tasks: parseInt(m.overdue_tasks || '0', 10),
        department_count: parseInt(m.department_count || '0', 10),
        active_members: parseInt(m.active_members || '0', 10),
        completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      }
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard metrics' });
  }
});

export default router;
