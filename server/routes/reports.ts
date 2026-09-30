import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// GET /api/reports
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;

    const query = `
      SELECT r.*, u.first_name || ' ' || u.last_name as creator_name
      FROM reports r
      LEFT JOIN users u ON u.id = r.creator_id
      WHERE r.organization_id = $1
      ORDER BY r.created_at DESC
    `;

    const result = await db.query(query, [orgId]);
    return res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch reports error:', error);
    return res.status(500).json({ error: 'Failed to retrieve reports' });
  }
});

// GET /api/reports/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const result = await db.query(`
      SELECT r.*, u.first_name || ' ' || u.last_name as creator_name
      FROM reports r
      LEFT JOIN users u ON u.id = r.creator_id
      WHERE r.id = $1 AND r.organization_id = $2
    `, [id, orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Fetch report details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve report' });
  }
});

export default router;
