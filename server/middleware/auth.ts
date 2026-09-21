import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollection } from '../db/mongo';

export const JWT_SECRET = process.env.JWT_SECRET || 'realestate_ai_secure_jwt_secret_key_2026';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
  storeId?: string;
  active: boolean;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication Middleware
 * Validates HttpOnly Cookie (or Authorization header Bearer token as fallback)
 * Ensures user is active in MongoDB
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({ error: '未登入或憑證不存在，請先登入系統' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      // Clear invalid cookie
      res.clearCookie('token', { path: '/' });
      return res.status(401).json({ error: '登入逾期或無效憑證，請重新登入' });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: '無效的使用者憑證' });
    }

    // Lookup user in MongoDB to confirm existence and active status
    const usersCollection = await getCollection('users');
    let userRecord: any = null;

    if (ObjectId.isValid(decoded.id)) {
      userRecord = await usersCollection.findOne({ _id: new ObjectId(decoded.id) });
    }
    if (!userRecord) {
      userRecord = await usersCollection.findOne({ _id: decoded.id as any });
    }

    if (!userRecord) {
      res.clearCookie('token', { path: '/' });
      return res.status(401).json({ error: '使用者帳號不存在' });
    }

    if (userRecord.active === false) {
      res.clearCookie('token', { path: '/' });
      return res.status(403).json({ error: '此帳號已被停用，請聯繫系統管理員' });
    }

    req.user = {
      id: userRecord._id.toString(),
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      storeId: userRecord.storeId ? userRecord.storeId.toString() : undefined,
      active: userRecord.active !== false,
    };

    next();
  } catch (error: any) {
    console.error('requireAuth error:', error);
    return res.status(500).json({ error: '身份驗證服務異常' });
  }
}

/**
 * Authorization Middleware: Checks if current authenticated user has one of the allowed roles
 */
export function requireRole(allowedRoles: Array<'admin' | 'manager' | 'agent'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登入' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `權限不足：您的角色為 [${req.user.role}]，僅限 [${allowedRoles.join(', ')}] 存取`,
      });
    }

    next();
  };
}
