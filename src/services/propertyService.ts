import { Property, PropertyFormData } from '../models/property';
import { apiFetch } from './apiClient';

export class PropertyService {
  async getProperties(search?: string): Promise<Property[]> {
    const url = search ? `/api/properties?search=${encodeURIComponent(search)}` : '/api/properties';
    const res = await apiFetch(url, {
      method: 'GET',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '載入案件失敗');
    }

    const data = await res.json();
    return data.properties || [];
  }

  async getPropertyById(id: string): Promise<Property | null> {
    const res = await apiFetch(`/api/properties/${id}`, {
      method: 'GET',
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 403) return null;
      throw new Error('讀取案件失敗');
    }

    const data = await res.json();
    return data.property || null;
  }

  async createProperty(data: PropertyFormData): Promise<Property> {
    const res = await apiFetch('/api/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || '新增案件失敗');
    }

    return result.property;
  }

  async updateProperty(id: string, data: Partial<PropertyFormData>): Promise<Property> {
    const res = await apiFetch(`/api/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || '更新案件失敗');
    }

    return result.property;
  }

  async deleteProperty(id: string): Promise<boolean> {
    const res = await apiFetch(`/api/properties/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const result = await res.json().catch(() => ({}));
      throw new Error(result.error || '刪除案件失敗');
    }

    return true;
  }

  /**
   * Get stats for Dashboard
   */
  async getDashboardStats() {
    const properties = await this.getProperties();
    const totalCount = properties.length;
    const totalValue = properties.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
    const avgPrice = totalCount > 0 ? Math.round(totalValue / totalCount) : 0;
    const avgUnitPrice =
      totalCount > 0
        ? (
            properties.reduce((acc, p) => acc + (Number(p.price) / (Number(p.area) || 1)), 0) /
            totalCount
          ).toFixed(1)
        : '0';

    return {
      totalCount,
      totalValue,
      avgPrice,
      avgUnitPrice,
      properties,
    };
  }
}

export const propertyService = new PropertyService();
