import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { CreateCommentSchema } from '../../shared/schemas/index.js';
import { logActivity } from '../middleware/audit.js';

const router = Router();

// GET /api/comments
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { entity_type, entity_id } = req.query;

    if (!entity_type || !entity_id) {
      return res.status(400).json({ error: 'entity_type and entity_id are required' });
    }

    const query = `
      SELECT c.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.avatar_url
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.organization_id = $1 AND c.entity_type = $2 AND c.entity_id = $3
      ORDER BY c.created_at ASC
    `;

    const result = await db.query(query, [orgId, entity_type, entity_id]);
    return res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch comments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// POST /api/comments
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const validated = CreateCommentSchema.parse(req.body);

    const result = await db.query(
      `INSERT INTO comments (organization_id, entity_type, entity_id, user_id, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orgId, validated.entity_type, validated.entity_id, req.user!.id, validated.content]
    );

    const newComment = result.rows[0];
    newComment.user_name = `${req.user!.first_name} ${req.user!.last_name}`;

    await logActivity(orgId, req.user!.id, 'comment.create', validated.entity_type, validated.entity_id, {
      comment_id: newComment.id
    });

    return res.status(201).json(newComment);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Create comment error:', error);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

export default router;
