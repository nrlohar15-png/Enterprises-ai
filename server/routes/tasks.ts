import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { CreateTaskSchema, UpdateTaskSchema } from '../../shared/schemas/index.js';
import { logActivity } from '../middleware/audit.js';

const router = Router();

// GET /api/tasks
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { status, priority, department_id, project_id, assignee_id, search } = req.query;

    let query = `
      SELECT t.*,
        p.name as project_name,
        d.name as department_name,
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

    const params: any[] = [orgId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND t.status = $${paramIndex++}`;
      params.push(status);
    }
    if (priority && priority !== 'all') {
      query += ` AND t.priority = $${paramIndex++}`;
      params.push(priority);
    }
    if (department_id) {
      query += ` AND t.department_id = $${paramIndex++}`;
      params.push(department_id);
    }
    if (project_id) {
      query += ` AND t.project_id = $${paramIndex++}`;
      params.push(project_id);
    }
    if (assignee_id) {
      query += ` AND t.assignee_id = $${paramIndex++}`;
      params.push(assignee_id);
    }
    if (search) {
      query += ` AND (LOWER(t.title) LIKE LOWER($${paramIndex}) OR LOWER(t.description) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await db.query(query, params);

    // Fetch dependencies for all returned tasks
    if (result.rows.length > 0) {
      const taskIds = result.rows.map(r => r.id);
      const depQuery = `
        SELECT td.task_id, t_dep.id as dep_id, t_dep.title, t_dep.status
        FROM task_dependencies td
        JOIN tasks t_dep ON t_dep.id = td.depends_on_task_id
        WHERE td.organization_id = $1 AND td.task_id = ANY($2::uuid[])
      `;
      const depsRes = await db.query(depQuery, [orgId, taskIds]);
      const depsMap: Record<string, any[]> = {};
      depsRes.rows.forEach(d => {
        if (!depsMap[d.task_id]) depsMap[d.task_id] = [];
        depsMap[d.task_id].push({ id: d.dep_id, title: d.title, status: d.status });
      });

      result.rows.forEach(r => {
        r.dependencies = depsMap[r.id] || [];
      });
    }

    return res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch tasks error:', error);
    return res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const taskRes = await db.query(`
      SELECT t.*,
        p.name as project_name,
        d.name as department_name,
        u_assignee.first_name || ' ' || u_assignee.last_name as assignee_name,
        u_assignee.avatar_url as assignee_avatar,
        u_creator.first_name || ' ' || u_creator.last_name as creator_name
      FROM tasks t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN departments d ON d.id = t.department_id
      LEFT JOIN users u_assignee ON u_assignee.id = t.assignee_id
      LEFT JOIN users u_creator ON u_creator.id = t.creator_id
      WHERE t.id = $1 AND t.organization_id = $2
    `, [id, orgId]);

    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskRes.rows[0];

    // Fetch dependencies
    const depsRes = await db.query(`
      SELECT t_dep.id, t_dep.title, t_dep.status, t_dep.priority
      FROM task_dependencies td
      JOIN tasks t_dep ON t_dep.id = td.depends_on_task_id
      WHERE td.task_id = $1 AND td.organization_id = $2
    `, [id, orgId]);
    task.dependencies = depsRes.rows;

    // Fetch comments
    const commentsRes = await db.query(`
      SELECT c.*, u.first_name || ' ' || u.last_name as user_name, u.avatar_url
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.entity_type = 'task' AND c.entity_id = $1 AND c.organization_id = $2
      ORDER BY c.created_at ASC
    `, [id, orgId]);
    task.comments = commentsRes.rows;

    return res.json(task);
  } catch (error: any) {
    console.error('Fetch task details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve task details' });
  }
});

// POST /api/tasks
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const validated = CreateTaskSchema.parse(req.body);

    const taskRes = await db.query(
      `INSERT INTO tasks (
        organization_id, creator_id, title, description, project_id, department_id,
        assignee_id, priority, status, due_date, labels
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        orgId,
        req.user!.id,
        validated.title,
        validated.description || null,
        validated.project_id || null,
        validated.department_id || null,
        validated.assignee_id || null,
        validated.priority,
        validated.status,
        validated.due_date || null,
        validated.labels || []
      ]
    );

    const newTask = taskRes.rows[0];

    // Insert dependencies if provided
    if (validated.dependencies && validated.dependencies.length > 0) {
      for (const depId of validated.dependencies) {
        await db.query(
          `INSERT INTO task_dependencies (organization_id, task_id, depends_on_task_id)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [orgId, newTask.id, depId]
        );
      }
    }

    await logActivity(orgId, req.user!.id, 'task.create', 'task', newTask.id, {
      title: newTask.title,
      priority: newTask.priority,
      status: newTask.status
    });

    return res.status(201).json(newTask);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const validated = UpdateTaskSchema.parse(req.body);

    // Verify task exists and belongs to organization
    const existingRes = await db.query(
      'SELECT id, title, status, priority FROM tasks WHERE id = $1 AND organization_id = $2',
      [id, orgId]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    const updates: string[] = [];
    const params: any[] = [id, orgId];
    let paramIndex = 3;

    if (validated.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(validated.title);
    }
    if (validated.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(validated.description);
    }
    if (validated.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(validated.status);
    }
    if (validated.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(validated.priority);
    }
    if (validated.due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      params.push(validated.due_date);
    }
    if (validated.assignee_id !== undefined) {
      updates.push(`assignee_id = $${paramIndex++}`);
      params.push(validated.assignee_id);
    }
    if (validated.project_id !== undefined) {
      updates.push(`project_id = $${paramIndex++}`);
      params.push(validated.project_id);
    }
    if (validated.department_id !== undefined) {
      updates.push(`department_id = $${paramIndex++}`);
      params.push(validated.department_id);
    }
    if (validated.labels !== undefined) {
      updates.push(`labels = $${paramIndex++}`);
      params.push(validated.labels);
    }

    updates.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $1 AND organization_id = $2
      RETURNING *
    `;

    const updatedRes = await db.query(updateQuery, params);
    const updatedTask = updatedRes.rows[0];

    // Handle dependencies if supplied
    if (validated.dependencies !== undefined) {
      await db.query('DELETE FROM task_dependencies WHERE task_id = $1 AND organization_id = $2', [id, orgId]);
      for (const depId of validated.dependencies) {
        await db.query(
          `INSERT INTO task_dependencies (organization_id, task_id, depends_on_task_id)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [orgId, id, depId]
        );
      }
    }

    await logActivity(orgId, req.user!.id, 'task.update', 'task', id, {
      title: updatedTask.title,
      status: updatedTask.status,
      priority: updatedTask.priority
    });

    return res.json(updatedTask);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Update task error:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const taskRes = await db.query(
      'DELETE FROM tasks WHERE id = $1 AND organization_id = $2 RETURNING title',
      [id, orgId]
    );

    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    await logActivity(orgId, req.user!.id, 'task.delete', 'task', id, {
      title: taskRes.rows[0].title
    });

    return res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
