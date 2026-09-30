import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { CreateDocumentSchema, UpdateDocumentSchema } from '../../shared/schemas/index.js';
import { logActivity } from '../middleware/audit.js';

const router = Router();

// GET /api/documents
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { category, department_id, project_id, search } = req.query;

    let query = `
      SELECT d.*,
        dept.name as department_name,
        p.name as project_name,
        u.first_name || ' ' || u.last_name as author_name
      FROM documents d
      LEFT JOIN departments dept ON dept.id = d.department_id
      LEFT JOIN projects p ON p.id = d.project_id
      LEFT JOIN users u ON u.id = d.author_id
      WHERE d.organization_id = $1
    `;

    const params: any[] = [orgId];
    let paramIndex = 2;

    if (category && category !== 'all') {
      query += ` AND d.category = $${paramIndex++}`;
      params.push(category);
    }
    if (department_id) {
      query += ` AND d.department_id = $${paramIndex++}`;
      params.push(department_id);
    }
    if (project_id) {
      query += ` AND d.project_id = $${paramIndex++}`;
      params.push(project_id);
    }
    if (search) {
      query += ` AND (d.title ILIKE $${paramIndex} OR d.content ILIKE $${paramIndex} OR d.summary ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY d.created_at DESC`;

    const result = await db.query(query, params);
    return res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch documents error:', error);
    return res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

// GET /api/documents/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const docRes = await db.query(`
      SELECT d.*,
        dept.name as department_name,
        p.name as project_name,
        u.first_name || ' ' || u.last_name as author_name
      FROM documents d
      LEFT JOIN departments dept ON dept.id = d.department_id
      LEFT JOIN projects p ON p.id = d.project_id
      LEFT JOIN users u ON u.id = d.author_id
      WHERE d.id = $1 AND d.organization_id = $2
    `, [id, orgId]);

    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docRes.rows[0];

    // Fetch tags
    const tagsRes = await db.query(
      'SELECT tag FROM document_tags WHERE document_id = $1 AND organization_id = $2',
      [id, orgId]
    );
    doc.tags = tagsRes.rows.map(r => r.tag);

    // Fetch comments
    const commentsRes = await db.query(`
      SELECT c.*, u.first_name || ' ' || u.last_name as user_name, u.avatar_url
      FROM comments c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.entity_type = 'document' AND c.entity_id = $1 AND c.organization_id = $2
      ORDER BY c.created_at ASC
    `, [id, orgId]);
    doc.comments = commentsRes.rows;

    return res.json(doc);
  } catch (error: any) {
    console.error('Fetch document details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve document details' });
  }
});

// POST /api/documents
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const validated = CreateDocumentSchema.parse(req.body);

    const docRes = await db.query(
      `INSERT INTO documents (
        organization_id, author_id, title, content, category, department_id, project_id, visibility, summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        orgId,
        req.user!.id,
        validated.title,
        validated.content,
        validated.category,
        validated.department_id || null,
        validated.project_id || null,
        validated.visibility,
        validated.content.slice(0, 180) + '...'
      ]
    );

    const newDoc = docRes.rows[0];

    // Add tags if present
    if (validated.tags && validated.tags.length > 0) {
      for (const tag of validated.tags) {
        await db.query(
          `INSERT INTO document_tags (organization_id, document_id, tag)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [orgId, newDoc.id, tag]
        );
      }
    }

    await logActivity(orgId, req.user!.id, 'document.create', 'document', newDoc.id, {
      title: newDoc.title,
      category: newDoc.category
    });

    return res.status(201).json(newDoc);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Create document error:', error);
    return res.status(500).json({ error: 'Failed to create document' });
  }
});

// PATCH /api/documents/:id
router.patch('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const validated = UpdateDocumentSchema.parse(req.body);

    const updates: string[] = [];
    const params: any[] = [id, orgId];
    let paramIndex = 3;

    if (validated.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(validated.title);
    }
    if (validated.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      params.push(validated.content);
    }
    if (validated.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(validated.category);
    }
    if (validated.department_id !== undefined) {
      updates.push(`department_id = $${paramIndex++}`);
      params.push(validated.department_id);
    }
    if (validated.project_id !== undefined) {
      updates.push(`project_id = $${paramIndex++}`);
      params.push(validated.project_id);
    }
    if (validated.visibility !== undefined) {
      updates.push(`visibility = $${paramIndex++}`);
      params.push(validated.visibility);
    }

    updates.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE documents
      SET ${updates.join(', ')}
      WHERE id = $1 AND organization_id = $2
      RETURNING *
    `;

    const result = await db.query(updateQuery, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    const updated = result.rows[0];

    if (validated.tags !== undefined) {
      await db.query('DELETE FROM document_tags WHERE document_id = $1 AND organization_id = $2', [id, orgId]);
      for (const tag of validated.tags) {
        await db.query(
          `INSERT INTO document_tags (organization_id, document_id, tag)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [orgId, id, tag]
        );
      }
    }

    await logActivity(orgId, req.user!.id, 'document.update', 'document', id, {
      title: updated.title
    });

    return res.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Update document error:', error);
    return res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM documents WHERE id = $1 AND organization_id = $2 RETURNING title',
      [id, orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    await logActivity(orgId, req.user!.id, 'document.delete', 'document', id, {
      title: result.rows[0].title
    });

    return res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Delete document error:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
