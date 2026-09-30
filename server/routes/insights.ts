import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { logActivity } from '../middleware/audit.js';

const router = Router();

// GET /api/insights
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { severity, category, is_resolved } = req.query;

    let query = `
      SELECT * FROM ai_insights
      WHERE organization_id = $1
    `;
    const params: any[] = [orgId];
    let paramIndex = 2;

    if (severity && severity !== 'all') {
      query += ` AND severity = $${paramIndex++}`;
      params.push(severity);
    }
    if (category && category !== 'all') {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }
    if (is_resolved !== undefined) {
      query += ` AND is_resolved = $${paramIndex++}`;
      params.push(is_resolved === 'true');
    }

    query += ` ORDER BY CASE WHEN severity = 'critical' THEN 1 WHEN severity = 'high' THEN 2 WHEN severity = 'medium' THEN 3 ELSE 4 END, created_at DESC`;

    const result = await db.query(query, params);
    return res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch insights error:', error);
    return res.status(500).json({ error: 'Failed to retrieve insights' });
  }
});

// GET /api/insights/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM ai_insights WHERE id = $1 AND organization_id = $2',
      [id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Fetch insight details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve insight' });
  }
});

// PATCH /api/insights/:id/resolve
router.patch('/:id/resolve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const { is_resolved } = req.body;

    const result = await db.query(
      `UPDATE ai_insights
       SET is_resolved = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [is_resolved !== undefined ? is_resolved : true, id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    const updated = result.rows[0];

    await logActivity(orgId, req.user!.id, 'insight.resolve', 'ai_insights', id, {
      title: updated.title,
      is_resolved: updated.is_resolved
    });

    return res.json(updated);
  } catch (error: any) {
    console.error('Resolve insight error:', error);
    return res.status(500).json({ error: 'Failed to update insight resolution status' });
  }
});

export default router;
