import { apiFetch } from './apiClient';
import { ImportRecord, StartImportResponse } from '../models/import';
import { Property } from '../models/property';

export class ImportService {
  async importWebsite(url: string): Promise<StartImportResponse> {
    const res = await apiFetch('/api/imports/website', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || '網站匯入失敗');
      err.errorCode = data.errorCode;
      err.importId = data.importId;
      throw err;
    }

    return data;
  }

  async getImport(id: string): Promise<ImportRecord> {
    const res = await apiFetch(`/api/imports/${id}`, {
      method: 'GET',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '讀取匯入紀錄失敗');
    }

    return data.import;
  }

  async confirmImport(
    id: string,
    confirmedData: any
  ): Promise<{ message: string; propertyId: string; property: Property }> {
    const res = await apiFetch(`/api/imports/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ confirmedData }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '確認匯入案件失敗');
    }

    return data;
  }

  async getImports(): Promise<ImportRecord[]> {
    const res = await apiFetch('/api/imports', {
      method: 'GET',
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.imports || [];
  }
}

export const importService = new ImportService();
