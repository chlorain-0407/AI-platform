import { User } from '../models/user';
import { apiFetch } from './apiClient';

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'manager' | 'agent';
  storeId?: string | null;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'manager' | 'agent';
  storeId?: string | null;
  active?: boolean;
}

export class UserService {
  async getUsers(): Promise<User[]> {
    const res = await apiFetch('/api/users', {
      method: 'GET',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '載入使用者資料失敗');
    }

    const data = await res.json();
    return data.users || [];
  }

  async createUser(data: CreateUserData): Promise<User> {
    const res = await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || '建立使用者失敗');
    }

    return result.user;
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const res = await apiFetch(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || '更新使用者失敗');
    }

    return result.user;
  }
}

export const userService = new UserService();
