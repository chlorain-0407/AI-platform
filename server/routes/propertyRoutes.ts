import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getCollection } from '../db/mongo';
import { requireAuth } from '../middleware/auth';

export const propertyRouter = Router();

function idQuery(id: string) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }
  return { _id: id as any };
}

function matchesStore(propStoreId: any, userStoreId?: string): boolean {
  if (!propStoreId || !userStoreId) return false;
  return propStoreId.toString() === userStoreId;
}

function matchesUser(propUserId: any, userId?: string): boolean {
  if (!propUserId || !userId) return false;
  return propUserId.toString() === userId;
}

/**
 * GET /api/properties
 * agent: only gets userId === currentUser.id
 * manager: only gets storeId === currentUser.storeId
 * admin: gets all properties
 */
propertyRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const propertiesCol = await getCollection('properties');
    const usersCol = await getCollection('users');
    const storesCol = await getCollection('stores');

    let filter: any = {};

    if (user.role === 'admin') {
      filter = {};
    } else if (user.role === 'manager') {
      if (!user.storeId) {
        return res.json({ properties: [] });
      }
      filter = {
        $or: [
          { storeId: new ObjectId(user.storeId) },
          { storeId: user.storeId },
        ],
      };
    } else {
      // agent
      filter = {
        $or: [
          { userId: new ObjectId(user.id) },
          { userId: user.id },
        ],
      };
    }

    const { search } = req.query;
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { title: regex },
            { community: regex },
            { address: regex },
            { layout: regex },
          ],
        },
      ];
    }

    const rawProps = await propertiesCol.find(filter).sort({ createdAt: -1 }).toArray();

    // Map store & agent info for display
    const users = await usersCol.find({}).toArray();
    const stores = await storesCol.find({}).toArray();
    const userMap = new Map<string, string>();
    users.forEach((u) => userMap.set(u._id.toString(), u.name));
    const storeMap = new Map<string, string>();
    stores.forEach((s) => storeMap.set(s._id.toString(), s.name));

    const formatted = rawProps.map((p) => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      userId: p.userId ? p.userId.toString() : '',
      user_id: p.userId ? p.userId.toString() : '',
      userName: p.userId ? userMap.get(p.userId.toString()) || '未知業務' : '',
      storeId: p.storeId ? p.storeId.toString() : '',
      store_id: p.storeId ? p.storeId.toString() : '',
      storeName: p.storeId ? storeMap.get(p.storeId.toString()) || '未知門店' : '',
      title: p.title,
      community: p.community || '',
      address: p.address,
      price: Number(p.price) || 0,
      area: Number(p.area) || 0,
      building_age: Number(p.building_age || 0),
      layout: p.layout || '',
      floor: p.floor || '',
      parking: p.parking || '',
      description: p.description || '',
      owner_reason: p.owner_reason || '',
      sourceType: p.sourceType || 'manual',
      sourceUrl: p.sourceUrl || '',
      sourceSite: p.sourceSite || '',
      importId: p.importId || '',
      importedAt: p.importedAt || null,
      images: p.images || [],
      created_at: p.createdAt || p.created_at || new Date().toISOString(),
      createdAt: p.createdAt || p.created_at || new Date().toISOString(),
      updated_at: p.updatedAt || p.updated_at || new Date().toISOString(),
      updatedAt: p.updatedAt || p.updated_at || new Date().toISOString(),
    }));

    return res.json({ properties: formatted });
  } catch (error: any) {
    console.error('Fetch properties error:', error);
    return res.status(500).json({ error: '載入案件失敗' });
  }
});

/**
 * GET /api/properties/:id
 * Strictly verifies role permissions before returning property
 */
propertyRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const propertiesCol = await getCollection('properties');

    const property = await propertiesCol.findOne(idQuery(id));
    if (!property) {
      return res.status(404).json({ error: '找不到該案件' });
    }

    // Role-based Access Verification
    if (user.role === 'agent') {
      if (!matchesUser(property.userId, user.id)) {
        return res.status(403).json({ error: '權限不足：您只能查看自己的案件' });
      }
    } else if (user.role === 'manager') {
      if (!matchesStore(property.storeId, user.storeId)) {
        return res.status(403).json({ error: '權限不足：您只能查看所屬門店的案件' });
      }
    }

    return res.json({
      property: {
        id: property._id.toString(),
        userId: property.userId ? property.userId.toString() : '',
        storeId: property.storeId ? property.storeId.toString() : '',
        title: property.title,
        community: property.community || '',
        address: property.address,
        price: Number(property.price) || 0,
        area: Number(property.area) || 0,
        building_age: Number(property.building_age || 0),
        layout: property.layout || '',
        floor: property.floor || '',
        parking: property.parking || '',
        description: property.description || '',
        owner_reason: property.owner_reason || '',
        sourceType: property.sourceType || 'manual',
        sourceUrl: property.sourceUrl || '',
        sourceSite: property.sourceSite || '',
        importId: property.importId || '',
        importedAt: property.importedAt || null,
        images: property.images || [],
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Fetch property by ID error:', error);
    return res.status(500).json({ error: '讀取案件失敗' });
  }
});

/**
 * POST /api/properties
 * Creates a new property.
 * CRITICAL SECURITY: userId and storeId MUST be set from backend session, NEVER from client request!
 */
propertyRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      title,
      community,
      address,
      price,
      area,
      building_age,
      layout,
      floor,
      parking,
      description,
      owner_reason,
    } = req.body;

    if (!title?.trim() || !address?.trim() || !price || !area) {
      return res.status(400).json({ error: '案件名稱、地址、總價與坪數為必填欄位' });
    }

    const propertiesCol = await getCollection('properties');

    // userId and storeId are derived strictly from authenticated user session
    const assignedUserId = ObjectId.isValid(user.id) ? new ObjectId(user.id) : user.id;
    let assignedStoreId: any = undefined;
    if (user.storeId) {
      assignedStoreId = ObjectId.isValid(user.storeId) ? new ObjectId(user.storeId) : user.storeId;
    }

    const newDoc = {
      _id: new ObjectId(),
      userId: assignedUserId,
      storeId: assignedStoreId,
      title: title.trim(),
      community: community?.trim() || '',
      address: address.trim(),
      price: Number(price),
      area: Number(area),
      building_age: Number(building_age || 0),
      layout: layout?.trim() || '',
      floor: floor?.trim() || '',
      parking: parking?.trim() || '',
      description: description?.trim() || '',
      owner_reason: owner_reason?.trim() || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await propertiesCol.insertOne(newDoc);

    return res.status(201).json({
      message: '案件建檔成功',
      property: {
        id: newDoc._id.toString(),
        userId: user.id,
        storeId: user.storeId,
        ...newDoc,
      },
    });
  } catch (error: any) {
    console.error('Create property error:', error);
    return res.status(500).json({ error: '建檔案件失敗' });
  }
});

/**
 * PUT /api/properties/:id
 * Updates an existing property.
 * Strictly verifies ownership or store affiliation.
 * Prevents modifying userId or storeId via mass assignment.
 */
propertyRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const propertiesCol = await getCollection('properties');

    const property = await propertiesCol.findOne(idQuery(id));
    if (!property) {
      return res.status(404).json({ error: '找不到該案件' });
    }

    // Role check
    if (user.role === 'agent') {
      if (!matchesUser(property.userId, user.id)) {
        return res.status(403).json({ error: '權限不足：您只能修改自己的案件' });
      }
    } else if (user.role === 'manager') {
      if (!matchesStore(property.storeId, user.storeId)) {
        return res.status(403).json({ error: '權限不足：您只能修改所屬門店的案件' });
      }
    }
    // Admin can update all

    const {
      title,
      community,
      address,
      price,
      area,
      building_age,
      layout,
      floor,
      parking,
      description,
      owner_reason,
    } = req.body;

    const updateDoc: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateDoc.title = title.trim();
    if (community !== undefined) updateDoc.community = community.trim();
    if (address !== undefined) updateDoc.address = address.trim();
    if (price !== undefined) updateDoc.price = Number(price);
    if (area !== undefined) updateDoc.area = Number(area);
    if (building_age !== undefined) updateDoc.building_age = Number(building_age);
    if (layout !== undefined) updateDoc.layout = layout.trim();
    if (floor !== undefined) updateDoc.floor = floor.trim();
    if (parking !== undefined) updateDoc.parking = parking.trim();
    if (description !== undefined) updateDoc.description = description.trim();
    if (owner_reason !== undefined) updateDoc.owner_reason = owner_reason.trim();

    // userId and storeId are deliberately ignored to prevent privilege escalation

    await propertiesCol.updateOne({ _id: property._id }, { $set: updateDoc });

    return res.json({
      message: '案件資料更新成功',
      property: {
        id: property._id.toString(),
        userId: property.userId ? property.userId.toString() : '',
        storeId: property.storeId ? property.storeId.toString() : '',
        ...property,
        ...updateDoc,
      },
    });
  } catch (error: any) {
    console.error('Update property error:', error);
    return res.status(500).json({ error: '更新案件失敗' });
  }
});

/**
 * DELETE /api/properties/:id
 * Deletes an existing property.
 * Strictly verifies ownership or store affiliation.
 */
propertyRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const propertiesCol = await getCollection('properties');

    const property = await propertiesCol.findOne(idQuery(id));
    if (!property) {
      return res.status(404).json({ error: '找不到該案件' });
    }

    if (user.role === 'agent') {
      if (!matchesUser(property.userId, user.id)) {
        return res.status(403).json({ error: '權限不足：您只能刪除自己的案件' });
      }
    } else if (user.role === 'manager') {
      if (!matchesStore(property.storeId, user.storeId)) {
        return res.status(403).json({ error: '權限不足：您只能刪除所屬門店的案件' });
      }
    }

    await propertiesCol.deleteOne({ _id: property._id });

    return res.json({ message: '案件已成功刪除' });
  } catch (error: any) {
    console.error('Delete property error:', error);
    return res.status(500).json({ error: '刪除案件失敗' });
  }
});
