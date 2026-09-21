export interface QueryOptions {
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

/**
 * IDatabaseProvider defines the abstract contract for data storage.
 * This allows swapping between Supabase PostgreSQL, Firebase Firestore,
 * or direct PostgreSQL without changing any Repositories, Services, or UI components.
 */
export interface IDatabaseProvider {
  /**
   * Query records from a table/collection with optional filters and sorting.
   */
  query<T>(table: string, filter?: Record<string, any>, options?: QueryOptions): Promise<T[]>;

  /**
   * Retrieve a single record by primary key id.
   */
  getById<T>(table: string, id: string): Promise<T | null>;

  /**
   * Insert a new record into a table/collection.
   */
  insert<T extends { id?: string }>(table: string, item: T): Promise<T>;

  /**
   * Update an existing record by id.
   */
  update<T>(table: string, id: string, updates: Partial<T>): Promise<T>;

  /**
   * Delete a record by id.
   */
  delete(table: string, id: string): Promise<boolean>;
}
