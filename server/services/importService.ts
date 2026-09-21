import { ObjectId } from 'mongodb';
import { getCollection } from '../db/mongo';
import { validateSafeUrl } from '../utils/urlSecurity';
import { scrapeAndExtractWebsite, ExtractedPropertySchema } from '../importers/websiteImporter';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
  storeId?: string;
}

function idQuery(id: string) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }
  return { _id: id as any };
}

function matchesStore(docStoreId: any, userStoreId?: string): boolean {
  if (!docStoreId || !userStoreId) return false;
  return docStoreId.toString() === userStoreId;
}

function matchesUser(docUserId: any, userId?: string): boolean {
  if (!docUserId || !userId) return false;
  return docUserId.toString() === userId;
}

export class ImportService {
  /**
   * Starts website import workflow:
   * 1. SSRF validation
   * 2. Insert import record (status: 'processing')
   * 3. Duplicate check against existing properties
   * 4. Scrape, clean, and extract structured data
   * 5. Update import record (status: 'preview' or 'failed')
   */
  async startWebsiteImport(user: AuthenticatedUser, targetUrl: string) {
    // 1. SSRF and URL validation
    const sec = await validateSafeUrl(targetUrl);
    if (!sec.safe) {
      const err: any = new Error(sec.errorMessage || '無效或受阻擋的網址');
      err.code = sec.errorCode || 'INVALID_URL';
      throw err;
    }

    const safeUrl = sec.normalizedUrl || targetUrl.trim();
    const parsed = new URL(safeUrl);
    const sourceSite = parsed.hostname.replace(/^www\./, '');

    const importsCol = await getCollection('imports');
    const propertiesCol = await getCollection('properties');

    // 2. Duplicate Check: check if any property already has this sourceUrl
    const existingProperty = await propertiesCol.findOne({
      sourceUrl: safeUrl,
    });
    const isDuplicate = !!existingProperty;
    const duplicateProperty = existingProperty
      ? {
          id: existingProperty._id.toString(),
          title: existingProperty.title,
          address: existingProperty.address,
          price: existingProperty.price,
        }
      : null;

    // 3. Create initial imports record (processing)
    const userObjId = ObjectId.isValid(user.id) ? new ObjectId(user.id) : user.id;
    const storeObjId = user.storeId && ObjectId.isValid(user.storeId) ? new ObjectId(user.storeId) : user.storeId;

    const importDoc = {
      _id: new ObjectId(),
      userId: userObjId,
      storeId: storeObjId,
      type: 'website' as const,
      sourceUrl: safeUrl,
      sourceSite,
      rawMetadata: {},
      extractedData: null,
      confirmedData: null,
      status: 'processing' as const,
      errorCode: null,
      propertyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await importsCol.insertOne(importDoc);
    const importId = importDoc._id.toString();

    // 4. Fetch & Extract
    const scrapeResult = await scrapeAndExtractWebsite(safeUrl);

    if (!scrapeResult.success) {
      await importsCol.updateOne(
        { _id: importDoc._id },
        {
          $set: {
            status: 'failed',
            errorCode: scrapeResult.errorCode || 'FETCH_FAILED',
            updatedAt: new Date(),
          },
        }
      );

      const err: any = new Error(scrapeResult.errorMessage || '網站擷取失敗');
      err.code = scrapeResult.errorCode || 'FETCH_FAILED';
      err.importId = importId;
      throw err;
    }

    // 5. Update to preview
    await importsCol.updateOne(
      { _id: importDoc._id },
      {
        $set: {
          status: 'preview',
          rawMetadata: scrapeResult.rawMetadata || {},
          extractedData: scrapeResult.extractedData,
          sourceSite: scrapeResult.rawMetadata?.sourceSite || sourceSite,
          updatedAt: new Date(),
        },
      }
    );

    return {
      importId,
      status: 'preview',
      extractedData: scrapeResult.extractedData,
      rawMetadata: scrapeResult.rawMetadata,
      isDuplicate,
      duplicateProperty,
    };
  }

  /**
   * Retrieves an import record by ID with RBAC enforcement.
   */
  async getImportById(id: string, user: AuthenticatedUser) {
    const importsCol = await getCollection('imports');
    const doc = await importsCol.findOne(idQuery(id));

    if (!doc) {
      const err: any = new Error('找不到指定的匯入任務紀錄');
      err.code = 'IMPORT_NOT_FOUND';
      throw err;
    }

    // RBAC validation
    if (user.role === 'agent') {
      if (!matchesUser(doc.userId, user.id)) {
        const err: any = new Error('權限不足：您只能查看自己的匯入紀錄');
        err.code = 'PERMISSION_DENIED';
        throw err;
      }
    } else if (user.role === 'manager') {
      if (!matchesStore(doc.storeId, user.storeId)) {
        const err: any = new Error('權限不足：您只能查看所屬門店的匯入紀錄');
        err.code = 'PERMISSION_DENIED';
        throw err;
      }
    }

    return {
      id: doc._id.toString(),
      _id: doc._id.toString(),
      userId: doc.userId?.toString() || '',
      storeId: doc.storeId?.toString() || '',
      type: doc.type,
      sourceUrl: doc.sourceUrl,
      sourceSite: doc.sourceSite,
      rawMetadata: doc.rawMetadata,
      extractedData: doc.extractedData,
      confirmedData: doc.confirmedData,
      status: doc.status,
      errorCode: doc.errorCode,
      propertyId: doc.propertyId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Confirms import data and creates a property in MongoDB properties collection.
   * userId and storeId are STRICTLY assigned from current user's session!
   */
  async confirmImport(id: string, user: AuthenticatedUser, confirmedData: any) {
    const importsCol = await getCollection('imports');
    const propertiesCol = await getCollection('properties');

    const importDoc = await importsCol.findOne(idQuery(id));
    if (!importDoc) {
      const err: any = new Error('找不到指定的匯入任務紀錄');
      err.code = 'IMPORT_NOT_FOUND';
      throw err;
    }

    // RBAC check
    if (user.role === 'agent') {
      if (!matchesUser(importDoc.userId, user.id)) {
        const err: any = new Error('權限不足：您只能確認自己的匯入任務');
        err.code = 'PERMISSION_DENIED';
        throw err;
      }
    } else if (user.role === 'manager') {
      if (!matchesStore(importDoc.storeId, user.storeId)) {
        const err: any = new Error('權限不足：您只能確認所屬門店的匯入任務');
        err.code = 'PERMISSION_DENIED';
        throw err;
      }
    }

    // Required fields validation
    const title = confirmedData.title?.trim();
    const address = confirmedData.address?.trim();
    const price = Number(confirmedData.price);
    const area = Number(confirmedData.area);

    if (!title || !address || isNaN(price) || price <= 0 || isNaN(area) || area <= 0) {
      const err: any = new Error('案件名稱、地址、總價與坪數為必填欄位且數值須大於 0');
      err.code = 'INVALID_DATA';
      throw err;
    }

    // Prepare images array
    const rawImages: any[] = Array.isArray(confirmedData.images) ? confirmedData.images : [];
    const formattedImages = rawImages.map((item) => {
      if (typeof item === 'string') {
        return { url: item, source: importDoc.sourceSite || 'website' };
      }
      return {
        url: item.url || '',
        source: item.source || importDoc.sourceSite || 'website',
      };
    }).filter((img) => img.url && typeof img.url === 'string');

    // Create property document in properties collection
    const assignedUserId = ObjectId.isValid(user.id) ? new ObjectId(user.id) : user.id;
    let assignedStoreId: any = undefined;
    if (user.storeId) {
      assignedStoreId = ObjectId.isValid(user.storeId) ? new ObjectId(user.storeId) : user.storeId;
    }

    const newPropertyDoc = {
      _id: new ObjectId(),
      userId: assignedUserId,
      storeId: assignedStoreId,
      title,
      community: confirmedData.community?.trim() || '',
      address,
      price,
      area,
      building_age: Number(confirmedData.buildingAge || confirmedData.building_age || 0),
      layout: confirmedData.layout?.trim() || '',
      floor: confirmedData.floor?.trim() || '',
      parking: confirmedData.parking?.trim() || '',
      description: confirmedData.description?.trim() || '',
      owner_reason: confirmedData.ownerReason?.trim() || '外部網站匯入案件',
      // Source tracking fields
      sourceType: 'website' as const,
      sourceUrl: importDoc.sourceUrl,
      sourceSite: importDoc.sourceSite || '',
      importId: importDoc._id.toString(),
      importedAt: new Date(),
      images: formattedImages,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await propertiesCol.insertOne(newPropertyDoc);

    // Update import record to completed
    await importsCol.updateOne(
      { _id: importDoc._id },
      {
        $set: {
          status: 'completed',
          confirmedData,
          propertyId: newPropertyDoc._id.toString(),
          updatedAt: new Date(),
        },
      }
    );

    return {
      message: '案件匯入成功並已建檔',
      propertyId: newPropertyDoc._id.toString(),
      property: {
        id: newPropertyDoc._id.toString(),
        userId: user.id,
        storeId: user.storeId,
        ...newPropertyDoc,
      },
    };
  }

  /**
   * Retrieves import history based on user RBAC permissions.
   */
  async getImportHistory(user: AuthenticatedUser) {
    const importsCol = await getCollection('imports');

    let filter: any = {};
    if (user.role === 'admin') {
      filter = {};
    } else if (user.role === 'manager') {
      if (!user.storeId) {
        return [];
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

    const docs = await importsCol.find(filter).sort({ createdAt: -1 }).limit(100).toArray();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      _id: doc._id.toString(),
      userId: doc.userId?.toString() || '',
      storeId: doc.storeId?.toString() || '',
      type: doc.type,
      sourceUrl: doc.sourceUrl,
      sourceSite: doc.sourceSite,
      rawMetadata: doc.rawMetadata,
      extractedData: doc.extractedData,
      status: doc.status,
      errorCode: doc.errorCode,
      propertyId: doc.propertyId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }
}

export const importService = new ImportService();
