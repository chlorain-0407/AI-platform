import { IDatabaseProvider } from './DatabaseProvider';
import { SupabasePostgresProvider } from './SupabasePostgresProvider';

/**
 * Global Database Provider instance.
 * Currently active: Supabase PostgreSQL Provider.
 *
 * To swap to Firebase Firestore or another SQL provider in the future:
 * 1. Implement IDatabaseProvider (e.g. FirebaseFirestoreProvider).
 * 2. Set currentDatabaseProvider = new FirebaseFirestoreProvider().
 * No frontend components, services, or repositories need to be altered!
 */
let currentDatabaseProvider: IDatabaseProvider = new SupabasePostgresProvider();

export function getDatabaseProvider(): IDatabaseProvider {
  return currentDatabaseProvider;
}

export function setDatabaseProvider(provider: IDatabaseProvider): void {
  currentDatabaseProvider = provider;
}

export * from './DatabaseProvider';
export * from './SupabasePostgresProvider';
