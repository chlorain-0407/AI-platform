export type MarketingContentType =
  | 'facebook_post'
  | 'line_message'
  | 'video_30s'
  | 'video_60s'
  | 'listing_title';

export type MarketingStatus = 'draft' | 'approved' | 'archived';

export interface FacebookContent {
  headline: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export interface LineContent {
  opening: string;
  message: string;
  cta: string;
}

export interface Video30Segment {
  duration: string;
  visual: string;
  voiceover: string;
}

export interface Video30Content {
  hook: string;
  segments: Video30Segment[];
  cta: string;
}

export interface Video60Content {
  hook: string;
  script: string;
  cta: string;
}

export interface ListingTitleItem {
  type: string;
  title: string;
}

export interface ListingTitleContent {
  titles: ListingTitleItem[];
}

export interface MarketingContent {
  id: string;
  userId: string;
  userName?: string;
  storeId?: string | null;
  propertyId: string;
  propertyTitle?: string;
  aiRunId?: string;
  contentType: MarketingContentType;
  marketingGoal: string;
  targetAudience: string;
  additionalInstruction?: string;
  content: any;
  version: number;
  status: MarketingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingStats {
  monthCount: number;
  totalCount: number;
  topContentType: string;
  topContentTypeLabel: string;
  typeBreakdown: Record<string, number>;
  recentContents: Array<{
    id: string;
    propertyId: string;
    propertyTitle: string;
    userName: string;
    contentType: string;
    contentTypeLabel: string;
    marketingGoal: string;
    targetAudience: string;
    version: number;
    status: string;
    createdAt: string;
  }>;
  scopeLabel: string;
}

export const MARKETING_CONTENT_TYPE_META: Record<
  MarketingContentType,
  {
    label: string;
    tag: string;
    description: string;
    iconName: string;
    color: string;
  }
> = {
  facebook_post: {
    label: 'Facebook 貼文',
    tag: '社群互動',
    description: '真誠房仲語氣，吸睛標題、痛點呼應、段落排版與促動看屋標籤',
    iconName: 'Share2',
    color: 'blue',
  },
  line_message: {
    label: 'LINE 文案',
    tag: '私域即時',
    description: '簡明扼要、規格清晰、親切問候，適合直接轉發推播與一對一私訊',
    iconName: 'MessageSquare',
    color: 'emerald',
  },
  video_30s: {
    label: '30秒短影音',
    tag: 'Reels / Shorts',
    description: '前3秒吸睛金句Hook、三段鏡頭分鏡規劃與配音口播台詞',
    iconName: 'Film',
    color: 'purple',
  },
  video_60s: {
    label: '60秒口播',
    tag: '經紀人口播',
    description: '自然流暢台灣日常口語，經紀人鏡頭前隨口即念，專業親切高轉換',
    iconName: 'Mic',
    color: 'amber',
  },
  listing_title: {
    label: '物件標題',
    tag: '5大買方切角',
    description: '價格型、生活型、家庭型、稀有型、專業型，一次生成 5 款吸睛點閱標題',
    iconName: 'Sparkles',
    color: 'rose',
  },
};
