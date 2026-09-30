import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/activity
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { action, entity_type, limit = 50 } = req.query;

    let query = `
      SELECT a.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.avatar_url
      FROM activity_logs a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.organization_id = $1
    `;

    const params: any[] = [orgId];
    let paramIndex = 2;

    if (action) {
      query += ` AND a.action = $${paramIndex++}`;
      params.push(action);
    }
    if (entity_type) {
      query += ` AND a.entity_type = $${paramIndex++}`;
      params.push(entity_type);
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex}`;
    params.push(Math.min(100, parseInt(limit as string, 10) || 50));

    const result = await db.query(query, params);
    return res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch activity error:', error);
    return res.status(500).json({ error: 'Failed to retrieve activity logs' });
  }
});

export default router;
