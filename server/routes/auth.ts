import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { RegisterUserSchema, LoginSchema } from '../../shared/schemas/index.js';
import { authenticateToken, signToken } from '../middleware/auth.js';
import { logActivity } from '../middleware/audit.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validated = RegisterUserSchema.parse(req.body);

    // Check if email already registered
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [validated.email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    // 1. Create User
    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, title, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, email, first_name, last_name, title, is_active, created_at, updated_at`,
      [
        validated.email.toLowerCase(),
        passwordHash,
        validated.first_name,
        validated.last_name,
        validated.title || 'Team Member'
      ]
    );
    const newUser = userRes.rows[0];

    // 2. Create Organization
    const slug = validated.organization_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.floor(Math.random() * 1000);
    const orgRes = await db.query(
      `INSERT INTO organizations (name, slug, domain, plan)
       VALUES ($1, $2, $3, 'enterprise')
       RETURNING id, name, slug`,
      [validated.organization_name, slug, validated.email.split('@')[1] || '']
    );
    const newOrg = orgRes.rows[0];

    // 3. Create Default Department
    const deptName = validated.department_name?.trim() || 'General Operations';
    const deptCode = deptName.slice(0, 4).toUpperCase();
    const deptRes = await db.query(
      `INSERT INTO departments (organization_id, name, code, description, head_user_id)
       VALUES ($1, $2, $3, 'Initial organizational department', $4)
       RETURNING id, name`,
      [newOrg.id, deptName, deptCode, newUser.id]
    );
    const newDept = deptRes.rows[0];

    // 4. Create Organization Member with organization_admin role
    await db.query(
      `INSERT INTO organization_members (organization_id, user_id, department_id, role)
       VALUES ($1, $2, $3, 'organization_admin')`,
      [newOrg.id, newUser.id, newDept.id]
    );

    const authUser = {
      ...newUser,
      organization_id: newOrg.id,
      organization_name: newOrg.name,
      department_id: newDept.id,
      department_name: newDept.name,
      role: 'organization_admin' as const,
    };

    const token = signToken(authUser);

    await logActivity(newOrg.id, newUser.id, 'user.register', 'user', newUser.id, {
      email: newUser.email,
      role: 'organization_admin',
    });

    return res.status(201).json({
      user: authUser,
      token,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validated = LoginSchema.parse(req.body);

    const userRes = await db.query(
      `SELECT 
        u.id, u.email, u.password_hash, u.first_name, u.last_name, u.title, u.avatar_url, u.is_active,
        om.organization_id, om.role, om.department_id,
        o.name as organization_name,
        d.name as department_name
       FROM users u
       JOIN organization_members om ON om.user_id = u.id
       JOIN organizations o ON o.id = om.organization_id
       LEFT JOIN departments d ON d.id = om.department_id
       WHERE u.email = $1 AND u.is_active = TRUE
       LIMIT 1`,
      [validated.email.toLowerCase()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const row = userRes.rows[0];
    const isPasswordValid = await bcrypt.compare(validated.password, row.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const authUser = {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      title: row.title,
      avatar_url: row.avatar_url,
      is_active: row.is_active,
      organization_id: row.organization_id,
      role: row.role,
      department_id: row.department_id || undefined,
      organization_name: row.organization_name,
      department_name: row.department_name || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const token = signToken(authUser);

    await logActivity(authUser.organization_id, authUser.id, 'user.login', 'user', authUser.id, {
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      user: authUser,
      token,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation error' });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to process login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  if (req.user) {
    await logActivity(req.user.organization_id, req.user.id, 'user.logout', 'user', req.user.id);
  }
  return res.json({ message: 'Successfully logged out.' });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
