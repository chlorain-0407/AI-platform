import { aiToolRepository } from '../repositories/aiToolRepository';
import { AiTool } from '../models/aiTool';

export class AiToolService {
  async getTools(): Promise<AiTool[]> {
    return aiToolRepository.getAll();
  }

  async getToolByCode(code: string): Promise<AiTool | null> {
    return aiToolRepository.getByCode(code);
  }
}

export const aiToolService = new AiToolService();
