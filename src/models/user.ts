export type UserRole = 'admin' | 'manager' | 'agent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  storeId?: string;
  storeName?: string;
  active?: boolean;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
  avatar?: string;
  company?: string;
  branch?: string;
  title?: string;
  license_number?: string;
  phone?: string;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}
