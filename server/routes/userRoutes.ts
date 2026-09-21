import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getCollection } from '../db/mongo';
import { requireAuth, requireRole } from '../middleware/auth';

export const userRouter = Router();

/**
 * GET /api/users
 * Admin can view all users;
 * Manager can view users of their own store;
 * Agent is forbidden.
 */
userRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    const usersCol = await getCollection('users');
    const storesCol = await getCollection('stores');

    let query: any = {};

    if (currentUser.role === 'admin') {
      // Admin views all users
      query = {};
    } else if (currentUser.role === 'manager') {
      // Manager views users in their own store only
      if (!currentUser.storeId) {
        return res.json({ users: [] });
      }
      query = {
        $or: [
          { storeId: new ObjectId(currentUser.storeId) },
          { storeId: currentUser.storeId },
        ],
      };
    } else {
      // Agent is forbidden
      return res.status(403).json({ error: '權限不足：經紀人無權查看使用者名單' });
    }

    const rawUsers = await usersCol.find(query).sort({ createdAt: -1 }).toArray();
    const stores = await storesCol.find({}).toArray();
    const storeMap = new Map<string, string>();
    stores.forEach((s) => {
      storeMap.set(s._id.toString(), s.code ? `${s.name} (${s.code})` : s.name);
    });

    const safeUsers = rawUsers.map((u) => {
      const storeIdStr = u.storeId ? u.storeId.toString() : '';
      let resolvedStoreName = storeMap.get(storeIdStr);
      if (!resolvedStoreName) {
        resolvedStoreName = u.role === 'admin' ? '總部 (全系統存取)' : '未分配門店';
      }
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        storeId: storeIdStr,
        storeName: resolvedStoreName,
        active: u.active !== false,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    return res.json({ users: safeUsers });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ error: '載入使用者資料失敗' });
  }
});

/**
 * POST /api/users
 * Admin only: create new user
 */
userRouter.post('/', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { email, name, password, role, storeId } = req.body;

    if (!email?.trim() || !name?.trim() || !password) {
      return res.status(400).json({ error: '請提供電子郵件、姓名與密碼' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const validRoles = ['admin', 'manager', 'agent'];
    const chosenRole = validRoles.includes(role) ? role : 'agent';

    const usersCol = await getCollection('users');

    // Check duplicate email
    const existing = await usersCol.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: `電子郵件「${cleanEmail}」已被註冊` });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let parsedStoreId: any = null;
    if (storeId && storeId !== 'none' && storeId !== '' && storeId !== 'null') {
      parsedStoreId = ObjectId.isValid(storeId) ? new ObjectId(storeId) : storeId;
    }

    const newUser = {
      _id: new ObjectId(),
      email: cleanEmail,
      name: name.trim(),
      passwordHash,
      role: chosenRole,
      storeId: parsedStoreId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCol.insertOne(newUser);

    const storesCol = await getCollection('stores');
    let storeName = '未分配門店';
    if (parsedStoreId) {
      const st = await storesCol.findOne({
        _id: ObjectId.isValid(parsedStoreId) ? new ObjectId(parsedStoreId) : parsedStoreId,
      });
      if (st) {
        storeName = st.code ? `${st.name} (${st.code})` : st.name;
      }
    } else if (chosenRole === 'admin') {
      storeName = '總部 (全系統存取)';
    }

    return res.status(201).json({
      message: '使用者建立成功',
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        storeId: newUser.storeId ? newUser.storeId.toString() : '',
        storeName,
        active: newUser.active,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: '建立使用者失敗' });
  }
});

/**
 * PUT /api/users/:id
 * Admin only: update user (role, name, storeId, active, password)
 */
userRouter.put('/:id', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, storeId, active } = req.body;

    const usersCol = await getCollection('users');
    let userRecord: any = null;

    if (ObjectId.isValid(id)) {
      userRecord = await usersCol.findOne({ _id: new ObjectId(id) });
    }
    if (!userRecord) {
      userRecord = await usersCol.findOne({ _id: id as any });
    }

    if (!userRecord) {
      return res.status(404).json({ error: '找不到該使用者' });
    }

    // Safety guard: Cannot demote or deactivate the last active admin
    if (
      userRecord.role === 'admin' &&
      ((role && role !== 'admin') || active === false)
    ) {
      const remainingAdmins = await usersCol.countDocuments({
        role: 'admin',
        active: true,
        _id: { $ne: userRecord._id },
      });
      if (remainingAdmins === 0) {
        return res.status(400).json({
          error: '系統中必須保留至少一位啟用的系統管理員，無法變更或停用最後一位管理員。',
        });
      }
    }

    const updateDoc: any = {
      updatedAt: new Date(),
    };

    if (name?.trim()) updateDoc.name = name.trim();

    if (email?.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== userRecord.email) {
        const dup = await usersCol.findOne({ email: cleanEmail, _id: { $ne: userRecord._id } });
        if (dup) {
          return res.status(409).json({ error: `電子郵件「${cleanEmail}」已被其他使用者使用` });
        }
        updateDoc.email = cleanEmail;
      }
    }

    if (role && ['admin', 'manager', 'agent'].includes(role)) {
      updateDoc.role = role;
    }

    if (storeId !== undefined) {
      if (!storeId || storeId === 'none' || storeId === '' || storeId === 'null') {
        updateDoc.storeId = null;
      } else if (ObjectId.isValid(storeId)) {
        updateDoc.storeId = new ObjectId(storeId);
      } else {
        updateDoc.storeId = storeId;
      }
    }

    if (typeof active === 'boolean') {
      updateDoc.active = active;
    }

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      updateDoc.passwordHash = await bcrypt.hash(password, salt);
    }

    await usersCol.updateOne({ _id: userRecord._id }, { $set: updateDoc });

    const finalRole = updateDoc.role || userRecord.role;
    const finalStoreId = updateDoc.storeId !== undefined ? updateDoc.storeId : userRecord.storeId;

    const storesCol = await getCollection('stores');
    let storeName = '未分配門店';
    if (finalStoreId) {
      const st = await storesCol.findOne({
        _id: ObjectId.isValid(finalStoreId) ? new ObjectId(finalStoreId) : finalStoreId,
      });
      if (st) {
        storeName = st.code ? `${st.name} (${st.code})` : st.name;
      }
    } else if (finalRole === 'admin') {
      storeName = '總部 (全系統存取)';
    }

    return res.json({
      message: '使用者資料更新成功',
      user: {
        id: userRecord._id.toString(),
        email: updateDoc.email || userRecord.email,
        name: updateDoc.name || userRecord.name,
        role: finalRole,
        storeId: finalStoreId ? finalStoreId.toString() : '',
        storeName,
        active: updateDoc.active !== undefined ? updateDoc.active : userRecord.active,
        updatedAt: updateDoc.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: '更新使用者失敗' });
  }
});
