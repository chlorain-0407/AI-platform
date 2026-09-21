export interface AiTool {
  id: string; // UUID Primary Key
  name: string; // text
  description: string; // text
  system_prompt: string; // text
  model: string; // text
  enabled: boolean; // boolean
  created_at: string; // timestamptz
  updated_at?: string; // timestamptz
  // UI helpers
  code?: string;
  icon?: string;
  category?: string;
}
