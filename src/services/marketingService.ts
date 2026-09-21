import { apiFetch } from './apiClient';
import { MarketingContent, MarketingStats } from '../models/marketing';

export interface GenerateMarketingParams {
  propertyId: string;
  contentType: string;
  marketingGoal: string;
  targetAudience: string;
  additionalInstruction?: string;
}

export class MarketingService {
  /**
   * Generates new marketing content
   * Only sends user selections, server derives all models, prompts and context
   */
  async generateContent(params: GenerateMarketingParams): Promise<{
    message: string;
    content: MarketingContent;
    aiRunId: string;
    version: number;
    latestAnalysisLoaded: boolean;
  }> {
    const res = await apiFetch('/api/marketing/generate', {
      method: 'POST',
      body: JSON.stringify({
        propertyId: params.propertyId,
        contentType: params.contentType,
        marketingGoal: params.marketingGoal,
        targetAudience: params.targetAudience,
        additionalInstruction: params.additionalInstruction || '',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '行銷內容生成失敗');
    }

    return await res.json();
  }

  /**
   * Retrieves list of marketing contents with RBAC
   */
  async getContents(filters?: { propertyId?: string; contentType?: string }): Promise<MarketingContent[]> {
    const query = new URLSearchParams();
    if (filters?.propertyId) query.set('propertyId', filters.propertyId);
    if (filters?.contentType) query.set('contentType', filters.contentType);

    const qs = query.toString();
    const url = qs ? `/api/marketing/contents?${qs}` : '/api/marketing/contents';

    const res = await apiFetch(url, { method: 'GET' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '載入行銷內容列表失敗');
    }

    const data = await res.json();
    return data.contents || [];
  }

  /**
   * Retrieves version history for a given property and content type
   */
  async getHistory(propertyId: string, contentType: string): Promise<MarketingContent[]> {
    const res = await apiFetch(`/api/marketing/contents/history/${encodeURIComponent(propertyId)}/${encodeURIComponent(contentType)}`, {
      method: 'GET',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '載入歷史版本失敗');
    }

    const data = await res.json();
    return data.history || [];
  }

  /**
   * Retrieves a single marketing content by ID
   */
  async getContentById(id: string): Promise<MarketingContent | null> {
    const res = await apiFetch(`/api/marketing/contents/${encodeURIComponent(id)}`, {
      method: 'GET',
    });

    if (!res.ok) {
      if (res.status === 404 || res.status === 403) return null;
      throw new Error('讀取行銷內容失敗');
    }

    const data = await res.json();
    return data.content || null;
  }

  /**
   * Updates an existing marketing content text or status
   */
  async updateContent(
    id: string,
    updates: { content?: any; status?: 'draft' | 'approved' | 'archived' }
  ): Promise<{ message: string; updatedAt: string }> {
    const res = await apiFetch(`/api/marketing/contents/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '更新行銷內容失敗');
    }

    return await res.json();
  }

  /**
   * Retrieves dashboard marketing statistics
   */
  async getStats(): Promise<MarketingStats> {
    const res = await apiFetch('/api/marketing/stats', {
      method: 'GET',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '載入行銷統計失敗');
    }

    return await res.json();
  }
}

export const marketingService = new MarketingService();
