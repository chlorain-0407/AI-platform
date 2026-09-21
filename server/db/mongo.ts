import { MongoClient, Db, Collection } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_URL.startsWith('mongodb')
    ? process.env.VITE_SUPABASE_URL
    : '');

export async function getDb(): Promise<Db> {
  if (db) return db;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  if (!client) {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
  }

  db = client.db();
  // Ensure indexes in background without blocking startup
  ensureIndexes(db).catch((e) => console.warn('Index init note:', e?.message));
  return db;
}

export async function getCollection<T = any>(name: string): Promise<Collection<T>> {
  const database = await getDb();
  return database.collection<T>(name);
}

/**
 * Ensures required unique and performance indexes on collections
 */
async function ensureIndexes(database: Db) {
  try {
    // 1. users: unique email, storeId index, role index
    const users = database.collection('users');
    await users.createIndex({ email: 1 }, { unique: true });
    await users.createIndex({ storeId: 1 });
    await users.createIndex({ role: 1 });

    // 2. stores: unique code index
    const stores = database.collection('stores');
    await stores.createIndex({ code: 1 }, { unique: true });

    // 3. properties: userId, storeId, createdAt
    const properties = database.collection('properties');
    await properties.createIndex({ userId: 1 });
    await properties.createIndex({ storeId: 1 });
    await properties.createIndex({ createdAt: -1 });

    // 4. ai_runs: userId, storeId, createdAt
    const aiRuns = database.collection('ai_runs');
    await aiRuns.createIndex({ userId: 1 });
    await aiRuns.createIndex({ storeId: 1 });
    await aiRuns.createIndex({ createdAt: -1 });

    console.log('✅ MongoDB indexes verified');
  } catch (err: any) {
    console.warn('⚠️ Index initialization warning:', err?.message);
  }
}
