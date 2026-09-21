import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getCollection } from '../db/mongo';
import { requireAuth, JWT_SECRET } from '../middleware/auth';

export const authRouter = Router();

/**
 * POST /api/auth/login
 * Verifies email & password against MongoDB users collection,
 * sets secure HttpOnly cookie on success.
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '請輸入電子郵件與密碼' });
    }

    const usersCol = await getCollection('users');
    const user = await usersCol.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: '電子郵件或密碼不正確' });
    }

    if (user.active === false) {
      return res.status(403).json({ error: '此帳號已被停用，請洽管理員' });
    }

    // Verify bcrypt password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: '電子郵件或密碼不正確' });
    }

    // Generate JWT token
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      storeId: user.storeId ? user.storeId.toString() : undefined,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Set secure cookie compatible with cross-origin iframes
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return safe user profile and token for Authorization header fallback in iframes
    return res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: user.storeId ? user.storeId.toString() : undefined,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: '登入服務處理異常' });
  }
});

/**
 * POST /api/auth/logout
 * Clears the session cookie
 */
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
  return res.json({ message: '已成功登出系統' });
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const currentToken = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    return res.json({
      token: currentToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: '取得使用者資料異常' });
  }
});
