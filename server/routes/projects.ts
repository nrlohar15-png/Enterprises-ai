import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { CreateProjectSchema, UpdateProjectSchema } from '../../shared/schemas/index.js';
import { logActivity } from '../middleware/audit.js';

const router = Router();

// GET /api/projects
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { status, department_id } = req.query;

    let query = `
      SELECT p.*,
        d.name as department_name,
        u.first_name || ' ' || u.last_name as owner_name,
        (SELECT count(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count
      FROM projects p
      LEFT JOIN departments d ON d.id = p.department_id
      LEFT JOIN users u ON u.id = p.owner_id
      WHERE p.organization_id = $1
    `;

    const params: any[] = [orgId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }
    if (department_id) {
      query += ` AND p.department_id = $${paramIndex++}`;
      params.push(department_id);
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await db.query(query, params);

    const formatted = result.rows.map(p => {
      const total = parseInt(p.task_count || '0', 10);
      const completed = parseInt(p.completed_task_count || '0', 10);
      return {
        ...p,
        task_count: total,
        completed_task_count: completed,
        progress_percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    console.error('Fetch projects error:', error);
    return res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const projRes = await db.query(`
      SELECT p.*,
        d.name as department_name,
        u.first_name || ' ' || u.last_name as owner_name,
        (SELECT count(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_task_count
      FROM projects p
      LEFT JOIN departments d ON d.id = p.department_id
      LEFT JOIN users u ON u.id = p.owner_id
      WHERE p.id = $1 AND p.organization_id = $2
    `, [id, orgId]);

    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projRes.rows[0];
    const total = parseInt(project.task_count || '0', 10);
    const completed = parseInt(project.completed_task_count || '0', 10);
    project.task_count = total;
    project.completed_task_count = completed;
    project.progress_percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Fetch tasks for this project
    const tasksRes = await db.query(`
      SELECT t.*, u.first_name || ' ' || u.last_name as assignee_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.project_id = $1 AND t.organization_id = $2
      ORDER BY t.created_at DESC
    `, [id, orgId]);
    project.tasks = tasksRes.rows;

    // Fetch documents for this project
    const docsRes = await db.query(`
      SELECT d.id, d.title, d.category, d.summary, d.created_at
      FROM documents d
      WHERE d.project_id = $1 AND d.organization_id = $2
    `, [id, orgId]);
    project.documents = docsRes.rows;

    // Fetch comments
    const commentsRes = await db.query(`
      SELECT c.*, u.first_name || ' ' || u.last_name as user_name, u.avatar_url
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.entity_type = 'project' AND c.entity_id = $1 AND c.organization_id = $2
      ORDER BY c.created_at ASC
    `, [id, orgId]);
    project.comments = commentsRes.rows;

    return res.json(project);
  } catch (error: any) {
    console.error('Fetch project details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve project details' });
  }
});

// POST /api/projects
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const validated = CreateProjectSchema.parse(req.body);

    const projectRes = await db.query(
      `INSERT INTO projects (
        organization_id, department_id, name, description, owner_id, status, start_date, target_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        orgId,
        validated.department_id || null,
        validated.name,
        validated.description || null,
        validated.owner_id || req.user!.id,
        validated.status,
        validated.start_date || null,
        validated.target_date || null
      ]
    );

    const newProject = projectRes.rows[0];

    await logActivity(orgId, req.user!.id, 'project.create', 'project', newProject.id, {
      name: newProject.name,
      status: newProject.status
    });

    return res.status(201).json(newProject);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Create project error:', error);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// PATCH /api/projects/:id
router.patch('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const validated = UpdateProjectSchema.parse(req.body);

    const updates: string[] = [];
    const params: any[] = [id, orgId];
    let paramIndex = 3;

    if (validated.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(validated.name);
    }
    if (validated.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(validated.description);
    }
    if (validated.department_id !== undefined) {
      updates.push(`department_id = $${paramIndex++}`);
      params.push(validated.department_id);
    }
    if (validated.owner_id !== undefined) {
      updates.push(`owner_id = $${paramIndex++}`);
      params.push(validated.owner_id);
    }
    if (validated.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(validated.status);
    }
    if (validated.start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      params.push(validated.start_date);
    }
    if (validated.target_date !== undefined) {
      updates.push(`target_date = $${paramIndex++}`);
      params.push(validated.target_date);
    }

    updates.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE projects
      SET ${updates.join(', ')}
      WHERE id = $1 AND organization_id = $2
      RETURNING *
    `;

    const result = await db.query(updateQuery, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    const updated = result.rows[0];

    await logActivity(orgId, req.user!.id, 'project.update', 'project', id, {
      name: updated.name,
      status: updated.status
    });

    return res.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Update project error:', error);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 AND organization_id = $2 RETURNING name',
      [id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    await logActivity(orgId, req.user!.id, 'project.delete', 'project', id, {
      name: result.rows[0].name
    });

    return res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
