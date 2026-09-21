export interface PropertyImage {
  url: string;
  source?: string;
}

export interface Property {
  id: string; // UUID Primary Key
  user_id: string; // UUID
  userId?: string;
  store_id?: string;
  storeId?: string;
  userName?: string;
  storeName?: string;
  title: string;
  community: string;
  address: string;
  price: number; // numeric (萬元)
  area: number; // numeric (坪數)
  building_age: number; // numeric (屋齡 年)
  layout: string;
  floor: string;
  parking: string;
  description: string;
  owner_reason: string;
  // External import tracking
  sourceType?: 'manual' | 'website' | 'csv' | 'excel' | 'google_sheet' | 'api' | string;
  sourceUrl?: string;
  sourceSite?: string;
  importId?: string;
  importedAt?: string;
  images?: PropertyImage[];
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PropertyFormData = Omit<Property, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
