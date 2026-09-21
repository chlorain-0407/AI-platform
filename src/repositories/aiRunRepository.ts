import { supabase } from '../lib/supabase';
import { AiRun } from '../models/aiRun';
import { generateUUID } from '../lib/utils';

const LOCAL_STORAGE_KEY = 'estate_ai_runs';

export class AiRunRepository {
  private readonly tableName = 'ai_runs';

  private normalizeRun(r: any): AiRun {
    const outputData = r.output_result || r.output || {};
    const inputData = r.input_params || r.input || {};
    return {
      id: r.id || r._id?.toString() || generateUUID(),
      user_id: r.user_id || r.userId || '',
      property_id: r.property_id || '',
      tool_id: r.tool_id || '',
      input: inputData,
      input_params: inputData,
      output: outputData,
      output_result: outputData,
      model: r.model || 'gemini-3.1-flash-lite',
      created_at: r.created_at || r.createdAt || new Date().toISOString(),
      property_title: r.property_title || '',
      tool_name: r.tool_name || '',
      tool_code: r.tool_code || 'property_analysis',
      status: r.status || 'success',
    };
  }

  private getLocalRuns(): AiRun[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.map((item) => this.normalizeRun(item)) : [];
    } catch {
      return [];
    }
  }

  private setLocalRuns(runs: AiRun[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(runs));
    } catch (err) {
      console.warn('Failed to save ai_runs to local cache:', err);
    }
  }

  async getAll(filter?: { user_id?: string; property_id?: string }): Promise<AiRun[]> {
    if (supabase) {
      try {
        let query = supabase
          .from(this.tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (filter?.user_id) {
          query = query.eq('user_id', filter.user_id);
        }
        if (filter?.property_id) {
          query = query.eq('property_id', filter.property_id);
        }

        const { data, error } = await query;
        if (!error && data) {
          const normalized = (data as any[]).map((d) => this.normalizeRun(d));
          this.setLocalRuns(normalized);
          return normalized;
        }
      } catch (err) {
        console.warn('[AiRunRepository] Supabase getAll error:', err);
      }
    }

    let runs = this.getLocalRuns();
    if (filter?.user_id) {
      runs = runs.filter((r) => r.user_id === filter.user_id);
    }
    if (filter?.property_id) {
      runs = runs.filter((r) => r.property_id === filter.property_id);
    }
    return runs;
  }

  async getById(id: string): Promise<AiRun | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return this.normalizeRun(data);
        }
      } catch (err) {
        console.warn('[AiRunRepository] Supabase getById error:', err);
      }
    }

    const runs = this.getLocalRuns();
    const found = runs.find((r) => r.id === id);
    return found ? this.normalizeRun(found) : null;
  }

  async create(run: Partial<AiRun>): Promise<AiRun> {
    const newId = run.id || generateUUID();
    const now = new Date().toISOString();
    const outputData = run.output_result || run.output || {};
    const inputData = run.input_params || run.input || {};

    const record: AiRun = {
      id: newId,
      user_id: run.user_id || generateUUID(),
      property_id: run.property_id,
      tool_id: run.tool_id,
      input: inputData,
      input_params: inputData,
      output: outputData,
      output_result: outputData,
      model: run.model || 'gemini-3.1-flash-lite',
      created_at: now,
      property_title: run.property_title,
      tool_name: run.tool_name,
      tool_code: run.tool_code || 'property_analysis',
      status: run.status || 'success',
    };

    if (supabase) {
      try {
        // Strip non-table helper fields for PostgreSQL insertion
        const { property_title, tool_name, tool_code, output_result, input_params, status, ...dbRecord } = record;
        const { data, error } = await supabase
          .from(this.tableName)
          .insert(dbRecord)
          .select()
          .single();

        if (!error && data) {
          const combined = this.normalizeRun({ ...record, ...data });
          const local = this.getLocalRuns();
          this.setLocalRuns([combined, ...local.filter((r) => r.id !== newId)]);
          return combined;
        }
      } catch (err) {
        console.warn('[AiRunRepository] Supabase create error:', err);
      }
    }

    const local = this.getLocalRuns();
    this.setLocalRuns([record, ...local.filter((r) => r.id !== newId)]);
    return record;
  }

  async delete(id: string): Promise<boolean> {
    if (supabase) {
      try {
        await supabase.from(this.tableName).delete().eq('id', id);
      } catch (err) {
        console.warn('[AiRunRepository] Supabase delete error:', err);
      }
    }

    const local = this.getLocalRuns();
    this.setLocalRuns(local.filter((r) => r.id !== id));
    return true;
  }
}

export const aiRunRepository = new AiRunRepository();
