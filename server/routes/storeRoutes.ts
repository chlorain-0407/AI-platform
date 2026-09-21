import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getCollection } from '../db/mongo';
import { requireAuth, requireRole } from '../middleware/auth';

export const storeRouter = Router();

/**
 * GET /api/stores
 * All authenticated users can view the store list
 */
storeRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const storesCol = await getCollection('stores');
    const stores = await storesCol.find({}).sort({ createdAt: -1 }).toArray();

    return res.json({
      stores: stores.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        code: s.code,
        active: s.active !== false,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Fetch stores error:', error);
    return res.status(500).json({ error: '載入門店資料失敗' });
  }
});

/**
 * POST /api/stores
 * Admin only: create a new store
 */
storeRouter.post('/', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;

    if (!name?.trim() || !code?.trim()) {
      return res.status(400).json({ error: '請輸入門店名稱與門店代碼' });
    }

    const storesCol = await getCollection('stores');
    const cleanCode = code.trim().toUpperCase();

    // Check duplicate code
    const existing = await storesCol.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({ error: `門店代碼「${cleanCode}」已存在` });
    }

    const newStore = {
      _id: new ObjectId(),
      name: name.trim(),
      code: cleanCode,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storesCol.insertOne(newStore);

    return res.status(201).json({
      message: '門店建立成功',
      store: {
        id: newStore._id.toString(),
        name: newStore.name,
        code: newStore.code,
        active: newStore.active,
        createdAt: newStore.createdAt,
        updatedAt: newStore.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Create store error:', error);
    return res.status(500).json({ error: '建立門店失敗' });
  }
});

/**
 * PUT /api/stores/:id
 * Admin only: update store name, code, or active status
 */
storeRouter.put('/:id', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, active } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: '無效的門店 ID' });
    }

    const storesCol = await getCollection('stores');
    const store = await storesCol.findOne({ _id: new ObjectId(id) });

    if (!store) {
      return res.status(404).json({ error: '找不到該門店' });
    }

    const updateDoc: any = {
      updatedAt: new Date(),
    };

    if (name?.trim()) updateDoc.name = name.trim();
    if (code?.trim()) {
      const cleanCode = code.trim().toUpperCase();
      // If code changed, check duplicate
      if (cleanCode !== store.code) {
        const dup = await storesCol.findOne({ code: cleanCode, _id: { $ne: store._id } });
        if (dup) {
          return res.status(409).json({ error: `門店代碼「${cleanCode}」已被其他門店使用` });
        }
      }
      updateDoc.code = cleanCode;
    }
    if (typeof active === 'boolean') {
      updateDoc.active = active;
    }

    await storesCol.updateOne({ _id: store._id }, { $set: updateDoc });

    return res.json({
      message: '門店更新成功',
      store: {
        id: store._id.toString(),
        ...store,
        ...updateDoc,
      },
    });
  } catch (error: any) {
    console.error('Update store error:', error);
    return res.status(500).json({ error: '更新門店失敗' });
  }
});
