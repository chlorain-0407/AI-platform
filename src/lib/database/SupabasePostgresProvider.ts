import { IDatabaseProvider, QueryOptions } from './DatabaseProvider';
import { User, Property, AiTool, AiRun } from '../../models';

const STORAGE_PREFIX = 'estate_ai_db_';

// Initial realistic seed data for Supabase PostgreSQL tables
const SEED_USERS: User[] = [
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    email: 'agent.wang@realestate.com.tw',
    name: '王晨峰',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
    company: '信義卓越地產',
    branch: '大安旗艦店',
    title: '資深專案經理 / 百萬經紀人',
    license_number: '(112) 北市經字第02981號',
    phone: '0912-345-678',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const SEED_AI_TOOLS: AiTool[] = [
  {
    id: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4c01',
    name: 'AI 案件深度剖析',
    code: 'property_analysis',
    description: '20年實戰不動產顧問視角：五大賣點、抗性拆解、目標客群、帶看攻略與下一步策略',
    system_prompt: '你是一位具有20年實戰經驗的不動產顧問...',
    model: 'gemini-3.1-flash-lite',
    enabled: true,
    icon: 'BrainCircuit',
    category: '顧問分析',
    created_at: new Date().toISOString(),
  },
  {
    id: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4c02',
    name: 'AI 行銷文案專家',
    code: 'marketing_copy',
    description: '快速生成 Facebook 社群貼文、LINE 推播快訊、買方 EDM、小紅書吸引眼球之文案',
    system_prompt: '你是一位專精房地產數位行銷的文案大師...',
    model: 'gemini-3.1-flash-lite',
    enabled: true,
    icon: 'Sparkles',
    category: '社群行銷',
    created_at: new Date().toISOString(),
  },
];

const SEED_PROPERTIES: Property[] = [
  {
    id: 'prop-001',
    user_id: 'user-001',
    title: '大安森林公園旁・首泰景觀高樓四房',
    community: '首泰信義',
    address: '台北市大安區信義路三段 147 號',
    price: 6880, // 萬元
    area: 68.5, // 坪
    building_age: 7, // 年
    layout: '4房2廳3衛2陽台',
    floor: '12F / 18F',
    parking: 'B2 坡道平面車位 x 2',
    description: '面大安森林公園永久綠意樹海，雙主臥規劃，頂級進口廚具衛浴。飯店式24小時特勤物業管理，公設齊全含宴會廳與健身房。捷運大安森林公園站步行僅3分鐘。',
    owner_reason: '屋主為科技業高階主管，因全家遷居海外經商，誠意讓售非投機客。希望接手的買方也是愛惜房屋的高素質家庭，價格只要符合行情即可乾脆簽約。',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'prop-002',
    user_id: 'user-001',
    title: '新板特區水岸首排・板橋大遠百旁景觀捷運豪邸',
    community: '橋峰',
    address: '新北市板橋區中山路一段 161 號',
    price: 3680,
    area: 52.8,
    building_age: 11,
    layout: '3房2廳2衛',
    floor: '18F / 29F',
    parking: 'B3 坡道平面車位',
    description: '新板特區核心地段，四鐵共構步行5分鐘。採光極佳高樓遠眺觀音山水岸夕陽，鋼骨SRC抗震制震宅。周邊百貨商圈雲集，生活機能頂級。',
    owner_reason: '屋主子女已大學畢業離巢，夫妻打算換屋至林口或淡水退休養生大坪數別墅，心態平和，議價空間約有3%~5%。',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'prop-003',
    user_id: 'user-001',
    title: '台中草悟道勤美誠品名邸・邊間三面採光綠園道首排',
    community: '由鉅大恆',
    address: '台中市西區五權西路一段 105 號',
    price: 4980,
    area: 75.2,
    building_age: 5,
    layout: '4房2廳3衛',
    floor: '9F / 25F',
    parking: 'B1 雙平面連號車位',
    description: '國美館特區地標建案，建築大師操刀。三面採光南北通透，面草悟道林蔭大道。SRC鋼骨制震，全熱交換系統與YKK氣密窗。',
    owner_reason: '台商企業主資產重新配置，部分資金需轉向新廠房投資擴廠，希望在年底前完成交屋手續，價格彈性極高。',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'prop-004',
    user_id: 'user-001',
    title: '竹北高鐵特區・水圳公園旁優質三房平車',
    community: '國泰Twin Park',
    address: '新竹縣竹北市復興二路 23 號',
    price: 2880,
    area: 43.6,
    building_age: 6,
    layout: '3房2廳2衛',
    floor: '7F / 14F',
    parking: 'B2 坡道平面大車位',
    description: '高鐵特區指標建商，步行至高鐵新竹站約7分鐘。臨水圳森林公園，住戶多為台積電與聯發科工程師主管，社區素質極高。雙衛浴皆開窗。',
    owner_reason: '屋主剛升遷調職回台積電中科廠，需在台中置產換屋，急尋誠意買方，若看中可迅速敲定斡旋。',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const SEED_AI_RUNS: AiRun[] = [
  {
    id: 'run-001',
    user_id: 'user-001',
    property_id: 'prop-001',
    property_title: '大安森林公園旁・首泰景觀高樓四房',
    tool_code: 'property_analysis',
    tool_name: 'AI 案件深度剖析',
    model: 'gemini-3.1-flash-lite',
    input: {
      property_id: 'prop-001',
      title: '大安森林公園旁・首泰景觀高樓四房',
    },
    output: {
      basic_summary: {
        unit_price_ping: '約 100.4 萬/坪',
      },
    },
    input_params: {
      property_id: 'prop-001',
      title: '大安森林公園旁・首泰景觀高樓四房',
    },
    output_result: {
      basic_summary: {
        unit_price_ping: '約 100.4 萬/坪',
        summary_highlights: [
          '信義路三段大安森林公園核心景觀首排，稀有釋出',
          '四房雙主臥規劃，附 2 個地下坡道平面大車位',
          '屋齡僅 7 年新古屋，高樓層 12 樓視野遼闊無遮蔽',
        ],
        market_positioning: '高資產換屋客與注重子女學區綠意的自住頂級客群標的',
      },
      five_selling_points: [
        '【永久綠意視野】面大安森林公園樹海，景觀無價且永不被遮蔽。',
        '【純住名邸指標】首泰建設口碑品質，24H 特勤級保全，社區住戶非富即貴。',
        '【雙捷運核心地段】步行大安森林公園站僅3分鐘，東門商圈與永康街名校生活圈。',
        '【戶型格局極佳】方正四房、雙主臥三套衛浴，採光對流極優，室內零暗房。',
        '【屋主心態健康誠賣】屋主全家因移民海外誠意出售，無繁複產權問題，產權乾淨。',
      ],
      resistance_points: [
        '總價達 6,880 萬元，跨過央行高價住宅豪宅門檻限制（台北市7000萬邊緣需留意買方貸款成數）。',
        '臨信義路主要幹道，低樓層可能略有車流聲（本戶在12樓且配頂級氣密窗，但買方初看可能疑慮）。',
        '管理費每月約 1.2 萬元，部分預算型高階白領買方可能對持有成本敏感。',
      ],
      resistance_solutions: [
        '貸款方案解方：提前協同配合之公股或外商VIP房貸理專，試算成數與寬限期，強調本戶落在7000萬以下安全線內。',
        '噪音疑慮解方：帶看時現場請客戶關緊YKK雙層真空氣密窗，感受室內分貝數落差，突顯靜音效果。',
        '持有成本解方：以特勤保全與高品質公設維護對比保值增值空間，說明大安區頂級資產的抗通膨特質。',
      ],
      target_audience: {
        buyer_profiles: [
          '外商企業亞太區高階主管、大安區傳產家族二代',
          '台大/榮總等知名醫療院所資深主治醫師家庭',
          '原住大安或中正區老公寓/電梯大樓，欲為年邁長輩與小孩尋求舒適電梯換屋之家庭',
        ],
        lifestyle_appeal: '平日下樓即可晨跑運動、享受萬坪森林氧吧，假日漫步永康商圈享受米其林美食。',
      },
      showing_keypoints: [
        '預約最佳時段：建議安排在下午 2:00 ~ 4:30 帶看，陽光灑入客廳與森林公園樹海綠波相映最震撼。',
        '動線引導：進門先引導至客廳大面景觀落地窗，讓買方先被窗外景致吸引，留下深刻第一印象。',
        '細節鋪陳：展示廚房進口頂級中島與衛浴降板浴缸的乾濕分離細節，強調無需大翻修即可入住。',
      ],
      sales_strategy: {
        pricing_strategy: '開價 6,880 萬扣除車位約 95~100 萬/坪，實價登錄同社區近一年行情落在 102~108 萬/坪，開價即具極大吸引力。',
        negotiation_tips: '屋主移民出脫心態明確，若有出價達 6,500 萬且簽約自備款成數高的優質買方，即可迅速促成相見歡見面談。',
        marketing_channels: [
          '鎖定內湖科技園區與信義計畫區高資產 VIP 買方 EDM 精準推播',
          '店頭櫥窗 A 級顯著位置刊登大安森林公園實景海報',
          '同行聯賣管道通知專攻大安區豪宅經紀人配對',
        ],
      },
      next_action_steps: [
        '1. 產權調查與謄本調閱：確認抵押權現況及有無設定限制登記。',
        '2. 拍攝晴天高畫質空拍及黃金採光日照實景圖。',
        '3. 聯絡目前庫存中尋找大安區預算 6000~7000 萬的 3 位 VIP 既有客戶優先預約帶看。',
        '4. 製作精美 A4 雙面案件剖析導覽單，帶看現場提供客戶帶回家人討論。',
      ],
    },
    status: 'success',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

/**
 * SupabasePostgresProvider
 * Implements IDatabaseProvider interface for Supabase PostgreSQL tables.
 * Uses persistent local browser storage as the reliable data store,
 * initialized with realistic schemas matching PostgreSQL tables:
 * - users
 * - properties
 * - ai_tools
 * - ai_runs
 */
export class SupabasePostgresProvider implements IDatabaseProvider {
  private initialized: boolean = false;

  constructor() {
    this.initDatabase();
  }

  private initDatabase(): void {
    if (typeof window === 'undefined') return;

    // Seed tables if not present
    if (!localStorage.getItem(STORAGE_PREFIX + 'users')) {
      localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'properties')) {
      localStorage.setItem(STORAGE_PREFIX + 'properties', JSON.stringify(SEED_PROPERTIES));
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'ai_tools')) {
      localStorage.setItem(STORAGE_PREFIX + 'ai_tools', JSON.stringify(SEED_AI_TOOLS));
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'ai_runs')) {
      localStorage.setItem(STORAGE_PREFIX + 'ai_runs', JSON.stringify(SEED_AI_RUNS));
    }
    this.initialized = true;
  }

  private getTableData<T>(table: string): T[] {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + table);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setTableData<T>(table: string, data: T[]): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to write to table ${table}:`, e);
    }
  }

  async query<T>(table: string, filter?: Record<string, any>, options?: QueryOptions): Promise<T[]> {
    let rows = this.getTableData<T>(table);

    // Apply filters (e.g. { user_id: 'user-001', status: 'success' })
    if (filter && Object.keys(filter).length > 0) {
      rows = rows.filter((item: any) => {
        return Object.entries(filter).every(([key, val]) => {
          if (val === undefined || val === null || val === '') return true;
          return item[key] === val;
        });
      });
    }

    // Apply sorting
    if (options?.sort) {
      const { field, direction } = options.sort;
      rows = [...rows].sort((a: any, b: any) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return direction === 'asc' ? -1 : 1;
      });
    }

    // Apply limit
    if (options?.limit && options.limit > 0) {
      rows = rows.slice(0, options.limit);
    }

    return rows;
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const rows = this.getTableData<any>(table);
    const found = rows.find((item) => item.id === id);
    return found ? (found as T) : null;
  }

  async insert<T extends { id?: string }>(table: string, item: T): Promise<T> {
    const rows = this.getTableData<any>(table);
    const newRecord = {
      ...item,
      id: item.id || `${table.substring(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: (item as any).created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    rows.unshift(newRecord);
    this.setTableData(table, rows);
    return newRecord as T;
  }

  async update<T>(table: string, id: string, updates: Partial<T>): Promise<T> {
    const rows = this.getTableData<any>(table);
    const index = rows.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Record with id ${id} not found in ${table}`);
    }
    const updatedRecord = {
      ...rows[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    rows[index] = updatedRecord;
    this.setTableData(table, rows);
    return updatedRecord as T;
  }

  async delete(table: string, id: string): Promise<boolean> {
    const rows = this.getTableData<any>(table);
    const filtered = rows.filter((item) => item.id !== id);
    if (filtered.length === rows.length) return false;
    this.setTableData(table, filtered);
    return true;
  }
}
