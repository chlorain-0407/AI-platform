import { Store } from '../models/user';
import { apiFetch } from './apiClient';

export interface CreateStoreData {
  name: string;
  code: string;
}

export interface UpdateStoreData {
  name?: string;
  code?: string;
  active?: boolean;
}

export class StoreService {
  async getStores(): Promise<Store[]> {
    const res = await apiFetch('/api/stores', {
      method: 'GET',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '載入門店資料失敗');
    }

    const data = await res.json();
    return data.stores || [];
  }

  async createStore(data: CreateStoreData): Promise<Store> {
    const res = await apiFetch('/api/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || '建立門店失敗');
    }

    return result.store;
  }

  async updateStore(id: string, data: UpdateStoreData): Promise<Store> {
    const res = await apiFetch(`/api/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || '更新門店失敗');
    }

    return result.store;
  }
}

export const storeService = new StoreService();
