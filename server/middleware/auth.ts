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
      first_name: user.first_name,
      last_name: user.last_name,
      organization_id: user.organization_id,
      role: user.role,
      department_id: user.department_id,
      organization_name: user.organization_name,
      department_name: user.department_name,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
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

    req.user = {
      id: payload.id,
      email: payload.email,
      first_name: payload.first_name || '',
      last_name: payload.last_name || '',
      organization_id: payload.organization_id,
      role: payload.role as UserRole,
      department_id: payload.department_id || undefined,
      organization_name: payload.organization_name || 'Apex Global Enterprises',
      department_name: payload.department_name || undefined,
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
