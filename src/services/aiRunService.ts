import { AiRun } from '../models/aiRun';
import { apiFetch } from './apiClient';

export class AiRunService {
  async getHistory(filter?: { property_id?: string; tool_code?: string }): Promise<AiRun[]> {
    try {
      const res = await apiFetch('/api/ai/runs', {
        method: 'GET',
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      let runs: AiRun[] = data.runs || [];

      if (filter?.property_id) {
        runs = runs.filter((r) => r.property_id === filter.property_id);
      }
      if (filter?.tool_code) {
        runs = runs.filter((r) => r.tool_code === filter.tool_code);
      }

      return runs;
    } catch (err) {
      console.warn('Failed to fetch AI runs history:', err);
      return [];
    }
  }

  async getById(id: string): Promise<AiRun | null> {
    const runs = await this.getHistory();
    return runs.find((r) => r.id === id) || null;
  }

  async deleteRun(id: string): Promise<boolean> {
    try {
      const res = await apiFetch(`/api/ai/runs/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const aiRunService = new AiRunService();
