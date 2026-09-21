import { supabase } from '../lib/supabase';
import { AiTool } from '../models/aiTool';
import { generateUUID } from '../lib/utils';

const LOCAL_STORAGE_KEY = 'estate_ai_tools';

const SEED_AI_TOOLS: AiTool[] = [
  {
    id: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4c01',
    name: 'AI 案件深度剖析',
    code: 'property_analysis',
    description: '20年實戰不動產顧問視角：五大賣點、抗性拆解、目標客群、帶看攻略與下一步策略',
    system_prompt: '你是一位具有20年實戰經驗的不動產顧問...',
    model: 'gemini-3.1-flash-lite',
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4c02',
    name: 'AI 行銷文案專家',
    code: 'marketing_copy',
    description: '快速生成 Facebook 社群貼文、LINE 推播快訊、買方 EDM、小紅書吸引眼球之文案',
    system_prompt: '你是一位專精房地產數位行銷的文案大師...',
    model: 'gemini-3.1-flash-lite',
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export class AiToolRepository {
  private readonly tableName = 'ai_tools';

  private getLocalTools(): AiTool[] {
    if (typeof window === 'undefined') return SEED_AI_TOOLS;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_AI_TOOLS));
        return SEED_AI_TOOLS;
      }
      return JSON.parse(stored);
    } catch {
      return SEED_AI_TOOLS;
    }
  }

  async getAll(): Promise<AiTool[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('enabled', true)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data as AiTool[];
        }
      } catch (err) {
        console.warn('[AiToolRepository] Supabase getAll error:', err);
      }
    }

    return this.getLocalTools();
  }

  async getById(id: string): Promise<AiTool | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return data as AiTool;
        }
      } catch (err) {
        console.warn('[AiToolRepository] Supabase getById error:', err);
      }
    }

    const tools = this.getLocalTools();
    return tools.find((t) => t.id === id) || null;
  }

  async getByCode(code: string): Promise<AiTool | null> {
    const tools = await this.getAll();
    return (
      tools.find(
        (t) =>
          t.code === code ||
          t.id === code ||
          (code === 'property_analysis' && t.name.includes('剖析')) ||
          (code === 'marketing_copy' && t.name.includes('文案'))
      ) || null
    );
  }

  async create(tool: Partial<AiTool>): Promise<AiTool> {
    const newId = tool.id || generateUUID();
    const now = new Date().toISOString();

    const record: AiTool = {
      id: newId,
      name: tool.name || 'AI 工具',
      description: tool.description || '',
      system_prompt: tool.system_prompt || '',
      model: tool.model || 'gemini-3.1-flash-lite',
      enabled: tool.enabled ?? true,
      created_at: now,
      updated_at: now,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .insert(record)
          .select()
          .single();

        if (!error && data) {
          return data as AiTool;
        }
      } catch (err) {
        console.warn('[AiToolRepository] Supabase create error:', err);
      }
    }

    return record;
  }
}

export const aiToolRepository = new AiToolRepository();
