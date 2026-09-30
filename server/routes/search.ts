import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { SearchResultItem } from '../../shared/types/index.js';

const router = Router();

// GET /api/search
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const query = (req.query.query as string || '').trim();
    const type = (req.query.type as string || 'all').toLowerCase();
    const departmentId = req.query.department_id as string;

    if (!query) {
      return res.json([]);
    }

    const searchTerm = `%${query}%`;
    const results: SearchResultItem[] = [];

    // 1. Search Documents
    if (type === 'all' || type === 'document' || type === 'policy') {
      let docQuery = `
        SELECT d.id, d.title, d.content, d.summary, d.category, d.updated_at, dept.name as department_name
        FROM documents d
        LEFT JOIN departments dept ON dept.id = d.department_id
        WHERE d.organization_id = $1 AND (d.title ILIKE $2 OR d.content ILIKE $2 OR d.summary ILIKE $2)
      `;
      const docParams: any[] = [orgId, searchTerm];
      if (departmentId) {
        docQuery += ` AND d.department_id = $3`;
        docParams.push(departmentId);
      }
      docQuery += ` LIMIT 15`;

      const docsRes = await db.query(docQuery, docParams);
      docsRes.rows.forEach(d => {
        const text = d.content || d.summary || '';
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        const start = Math.max(0, idx - 40);
        const snippet = text.slice(start, start + 160) + '...';

        results.push({
          id: d.id,
          type: d.category === 'Policy' ? 'policy' : 'document',
          title: d.title,
          snippet: snippet || d.summary || 'Enterprise document reference',
          relevance: d.title.toLowerCase().includes(query.toLowerCase()) ? 0.95 : 0.8,
          source_reference: `Document • ${d.category}`,
          department_name: d.department_name,
          timestamp: d.updated_at,
          url: `/documents/${d.id}`
        });
      });
    }

    // 2. Search Tasks
    if (type === 'all' || type === 'task') {
      let taskQuery = `
        SELECT t.id, t.title, t.description, t.status, t.priority, t.updated_at, dept.name as department_name
        FROM tasks t
        LEFT JOIN departments dept ON dept.id = t.department_id
        WHERE t.organization_id = $1 AND (t.title ILIKE $2 OR t.description ILIKE $2)
      `;
      const taskParams: any[] = [orgId, searchTerm];
      if (departmentId) {
        taskQuery += ` AND t.department_id = $3`;
        taskParams.push(departmentId);
      }
      taskQuery += ` LIMIT 15`;

      const tasksRes = await db.query(taskQuery, taskParams);
      tasksRes.rows.forEach(t => {
        results.push({
          id: t.id,
          type: 'task',
          title: t.title,
          snippet: t.description ? t.description.slice(0, 160) + '...' : `Task status: ${t.status} | Priority: ${t.priority}`,
          relevance: t.title.toLowerCase().includes(query.toLowerCase()) ? 0.92 : 0.75,
          source_reference: `Task • ${t.status.toUpperCase()} (${t.priority})`,
          department_name: t.department_name,
          timestamp: t.updated_at,
          url: `/tasks/${t.id}`
        });
      });
    }

    // 3. Search Projects
    if (type === 'all' || type === 'project') {
      let projQuery = `
        SELECT p.id, p.name, p.description, p.status, p.updated_at, dept.name as department_name
        FROM projects p
        LEFT JOIN departments dept ON dept.id = p.department_id
        WHERE p.organization_id = $1 AND (p.name ILIKE $2 OR p.description ILIKE $2)
      `;
      const projParams: any[] = [orgId, searchTerm];
      if (departmentId) {
        projQuery += ` AND p.department_id = $3`;
        projParams.push(departmentId);
      }
      projQuery += ` LIMIT 10`;

      const projRes = await db.query(projQuery, projParams);
      projRes.rows.forEach(p => {
        results.push({
          id: p.id,
          type: 'project',
          title: p.name,
          snippet: p.description ? p.description.slice(0, 160) + '...' : `Project status: ${p.status}`,
          relevance: p.name.toLowerCase().includes(query.toLowerCase()) ? 0.94 : 0.78,
          source_reference: `Project • ${p.status}`,
          department_name: p.department_name,
          timestamp: p.updated_at,
          url: `/projects/${p.id}`
        });
      });
    }

    // 4. Search Meetings
    if (type === 'all' || type === 'meeting') {
      let meetQuery = `
        SELECT m.id, m.title, m.raw_notes, m.summary, m.updated_at, dept.name as department_name
        FROM meetings m
        LEFT JOIN departments dept ON dept.id = m.department_id
        WHERE m.organization_id = $1 AND (m.title ILIKE $2 OR m.raw_notes ILIKE $2 OR m.summary ILIKE $2)
      `;
      const meetParams: any[] = [orgId, searchTerm];
      if (departmentId) {
        meetQuery += ` AND m.department_id = $3`;
        meetParams.push(departmentId);
      }
      meetQuery += ` LIMIT 10`;

      const meetRes = await db.query(meetQuery, meetParams);
      meetRes.rows.forEach(m => {
        results.push({
          id: m.id,
          type: 'meeting',
          title: m.title,
          snippet: m.summary || m.raw_notes.slice(0, 160) + '...',
          relevance: m.title.toLowerCase().includes(query.toLowerCase()) ? 0.91 : 0.74,
          source_reference: `Meeting Notes`,
          department_name: m.department_name,
          timestamp: m.updated_at,
          url: `/meetings`
        });
      });
    }

    // Sort by relevance desc
    results.sort((a, b) => b.relevance - a.relevance);

    return res.json(results);
  } catch (error: any) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Failed to execute enterprise search' });
  }
});

export default router;
