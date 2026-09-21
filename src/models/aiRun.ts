export interface PropertyAnalysisOutput {
  basic_summary?: {
    unit_price_ping: number | string;
    summary_highlights: string[];
    market_positioning: string;
  };
  five_selling_points?: string[];
  resistance_points?: string[];
  resistance_solutions?: string[];
  target_audience?: {
    buyer_profiles: string[];
    lifestyle_appeal: string;
  };
  showing_keypoints?: string[];
  sales_strategy?: {
    pricing_strategy: string;
    negotiation_tips: string;
    marketing_channels: string[];
  };
  next_action_steps?: string[];
  [key: string]: any;
}

export interface MarketingCopyOutput {
  headline?: string;
  facebook_post?: string;
  line_push?: string;
  instagram_xiaohongshu?: string;
  buyer_edm?: string;
  hashtags?: string[];
  [key: string]: any;
}

export interface AiRun {
  id: string; // UUID Primary Key
  user_id: string; // UUID
  property_id?: string; // UUID
  tool_id?: string; // UUID
  input: Record<string, any>; // JSONB
  output: Record<string, any>; // JSONB
  model: string; // text
  created_at: string; // timestamptz
  // UI helpers & backward compatibility
  property_title?: string;
  tool_name?: string;
  tool_code?: string;
  input_params?: Record<string, any>;
  output_result?: Record<string, any>;
  status?: 'success' | 'failed' | 'running';
}
