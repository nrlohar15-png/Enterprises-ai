import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/departments
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;

    const query = `
      SELECT d.*,
        u.first_name || ' ' || u.last_name as head_name,
        (SELECT count(*) FROM organization_members om WHERE om.department_id = d.id) as member_count,
        (SELECT count(*) FROM projects p WHERE p.department_id = d.id) as project_count,
        (SELECT count(*) FROM tasks t WHERE t.department_id = d.id) as task_count
      FROM departments d
      LEFT JOIN users u ON u.id = d.head_user_id
      WHERE d.organization_id = $1
      ORDER BY d.name ASC
    `;

    const result = await db.query(query, [orgId]);

    const formatted = result.rows.map(d => ({
      ...d,
      member_count: parseInt(d.member_count || '0', 10),
      project_count: parseInt(d.project_count || '0', 10),
      task_count: parseInt(d.task_count || '0', 10),
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error('Fetch departments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve departments' });
  }
});

// GET /api/departments/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const deptRes = await db.query(`
      SELECT d.*,
        u.first_name || ' ' || u.last_name as head_name
      FROM departments d
      LEFT JOIN users u ON u.id = d.head_user_id
      WHERE d.id = $1 AND d.organization_id = $2
    `, [id, orgId]);

    if (deptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const dept = deptRes.rows[0];

    // Fetch members
    const membersRes = await db.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.title, u.avatar_url, om.role, om.joined_at
      FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE om.department_id = $1 AND om.organization_id = $2
    `, [id, orgId]);
    dept.members = membersRes.rows;

    // Fetch projects
    const projRes = await db.query(`
      SELECT p.*,
        (SELECT count(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count
      FROM projects p
      WHERE p.department_id = $1 AND p.organization_id = $2
      ORDER BY p.created_at DESC
    `, [id, orgId]);
    dept.projects = projRes.rows.map(p => {
      const total = parseInt(p.task_count || '0', 10);
      const completed = parseInt(p.completed_task_count || '0', 10);
      return {
        ...p,
        task_count: total,
        completed_task_count: completed,
        progress_percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });

    // Fetch tasks
    const tasksRes = await db.query(`
      SELECT t.*, u.first_name || ' ' || u.last_name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.department_id = $1 AND t.organization_id = $2
      ORDER BY t.created_at DESC
    `, [id, orgId]);
    dept.tasks = tasksRes.rows;

    // Fetch documents
    const docsRes = await db.query(`
      SELECT d.*, u.first_name || ' ' || u.last_name as author_name
      FROM documents d
      LEFT JOIN users u ON u.id = d.author_id
      WHERE d.department_id = $1 AND d.organization_id = $2
      ORDER BY d.created_at DESC
    `, [id, orgId]);
    dept.documents = docsRes.rows;

    return res.json(dept);
  } catch (error: any) {
    console.error('Fetch department details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve department details' });
  }
});

export default router;
