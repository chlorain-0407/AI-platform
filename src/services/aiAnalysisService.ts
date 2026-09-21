import { aiRunRepository } from '../repositories/aiRunRepository';
import { Property } from '../models/property';
import { AiRun, PropertyAnalysisOutput, MarketingCopyOutput } from '../models/aiRun';
import { authService } from './authService';
import { apiFetch } from './apiClient';

export class AiAnalysisService {
  /**
   * Run 20-Year Real Estate Veteran Property Analysis.
   * Calls the server-side API (protecting GEMINI_API_KEY) and persists into ai_runs.
   */
  async runPropertyAnalysis(property: Property): Promise<AiRun> {
    const user = authService.getCurrentUser();
    const userId = user ? user.id : property.user_id;

    const response = await apiFetch('/api/ai/property-analysis', {
      method: 'POST',
      body: JSON.stringify({
        property,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `AI 案件分析請求失敗 (${response.status})`);
    }

    const data: { analysis: PropertyAnalysisOutput } = await response.json();

    // Persist to ai_runs table
    const aiRunRecord = await aiRunRepository.create({
      user_id: userId,
      property_id: property.id,
      property_title: property.title,
      tool_code: 'property_analysis',
      tool_name: 'AI 案件深度剖析',
      model: (data as any).model || 'gemini-3.1-flash-lite',
      input: {
        property_id: property.id,
        title: property.title,
        price: property.price,
        area: property.area,
        address: property.address,
        layout: property.layout,
      },
      output: data.analysis,
      status: 'success',
    });

    return aiRunRecord;
  }

  /**
   * Run AI Marketing Copy Generation.
   * Calls server-side API and persists into ai_runs.
   */
  async runMarketingCopy(property: Property, tone: string = '專業吸引人'): Promise<AiRun> {
    const user = authService.getCurrentUser();
    const userId = user ? user.id : property.user_id;

    const response = await apiFetch('/api/ai/marketing-copy', {
      method: 'POST',
      body: JSON.stringify({
        property,
        tone,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `AI 行銷文案請求失敗 (${response.status})`);
    }

    const data: { marketing: MarketingCopyOutput } = await response.json();

    // Persist to ai_runs table
    const aiRunRecord = await aiRunRepository.create({
      user_id: userId,
      property_id: property.id,
      property_title: property.title,
      tool_code: 'marketing_copy',
      tool_name: 'AI 行銷文案專家',
      model: (data as any).model || 'gemini-3.1-flash-lite',
      input: {
        property_id: property.id,
        title: property.title,
        tone,
      },
      output: data.marketing,
      status: 'success',
    });

    return aiRunRecord;
  }
}

export const aiAnalysisService = new AiAnalysisService();
