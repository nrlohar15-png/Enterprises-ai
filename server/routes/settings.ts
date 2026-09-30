import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logActivity } from '../middleware/audit.js';

const router = Router();

// GET /api/settings/organization
router.get('/organization', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const result = await db.query('SELECT * FROM organizations WHERE id = $1', [orgId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Fetch organization error:', error);
    return res.status(500).json({ error: 'Failed to retrieve organization' });
  }
});

// GET /api/settings/members
router.get('/members', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const query = `
      SELECT 
        om.id as member_id, om.role, om.joined_at,
        u.id as user_id, u.first_name, u.last_name, u.email, u.title, u.avatar_url, u.is_active,
        d.id as department_id, d.name as department_name
      FROM organization_members om
      JOIN users u ON u.id = om.user_id
      LEFT JOIN departments d ON d.id = om.department_id
      WHERE om.organization_id = $1
      ORDER BY u.first_name ASC
    `;
    const result = await db.query(query, [orgId]);
    return res.json(result.rows);
  } catch (error: any) {
    console.error('Fetch members error:', error);
    return res.status(500).json({ error: 'Failed to retrieve organization members' });
  }
});

// PATCH /api/settings/members/:id/role (admin only)
router.patch('/members/:id/role', authenticateToken, requireRole(['organization_admin']), async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organization_id;
    const { id } = req.params;
    const { role, department_id } = req.body;

    if (!['employee', 'manager', 'department_admin', 'organization_admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const updates: string[] = ['role = $1'];
    const params: any[] = [role, id, orgId];
    let paramIndex = 4;

    if (department_id !== undefined) {
      updates.push(`department_id = $${paramIndex++}`);
      params.push(department_id || null);
    }

    const query = `
      UPDATE organization_members
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `;

    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found or unauthorized' });
    }

    await logActivity(orgId, req.user!.id, 'member.role_update', 'organization_member', id, {
      new_role: role
    });

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update member role error:', error);
    return res.status(500).json({ error: 'Failed to update member role' });
  }
});

// PATCH /api/settings/profile
router.patch('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { first_name, last_name, title, current_password, new_password } = req.body;

    const updates: string[] = [];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (first_name) {
      updates.push(`first_name = $${paramIndex++}`);
      params.push(first_name);
    }
    if (last_name) {
      updates.push(`last_name = $${paramIndex++}`);
      params.push(last_name);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(title);
    }

    // Optional password change
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }

      const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      const isMatch = await bcrypt.compare(current_password, userRes.rows[0]?.password_hash || '');
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password does not match records' });
      }

      const newHash = await bcrypt.hash(new_password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      params.push(newHash);
    }

    updates.push(`updated_at = NOW()`);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING id, email, first_name, last_name, title`,
      params
    );

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default router;
