import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { UserRole } from '../../shared/types/index.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  role: UserRole;
  department_id?: string;
  organization_name: string;
  department_name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.SESSION_SECRET || 'enterprise-ai-platform-dev-session-secret-2025-secure';

export function signToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      organization_id: user.organization_id,
      role: user.role,
      department_id: user.department_id,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No session token provided.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;

    // Verify user and active organization membership in database
    const query = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.is_active,
        om.organization_id, om.role, om.department_id,
        o.name as organization_name,
        d.name as department_name
      FROM users u
      JOIN organization_members om ON om.user_id = u.id AND om.organization_id = $1
      JOIN organizations o ON o.id = om.organization_id
      LEFT JOIN departments d ON d.id = om.department_id
      WHERE u.id = $2 AND u.is_active = TRUE
    `;

    const result = await db.query(query, [payload.organization_id, payload.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User session invalid or organization membership revoked.' });
    }

    const row = result.rows[0];
    req.user = {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      organization_id: row.organization_id,
      role: row.role as UserRole,
      department_id: row.department_id || undefined,
      organization_name: row.organization_name,
      department_name: row.department_name || undefined,
    };

    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
