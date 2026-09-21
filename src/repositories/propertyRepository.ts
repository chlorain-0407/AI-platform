import { supabase } from '../lib/supabase';
import { Property } from '../models/property';
import { generateUUID } from '../lib/utils';

export interface PropertyFilter {
  user_id?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
}

const LOCAL_STORAGE_KEY = 'estate_ai_properties';

// Default initial seeded properties with valid RFC4122 UUIDs
const SEED_PROPERTIES: Property[] = [
  {
    id: 'e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b01',
    user_id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    title: '大安森林公園旁・首泰景觀高樓四房',
    community: '首泰信義',
    address: '台北市大安區信義路三段 147 號',
    price: 6880,
    area: 68.5,
    building_age: 7,
    layout: '4房2廳3衛2陽台',
    floor: '12F / 18F',
    parking: 'B2 坡道平面車位 x 2',
    description: '面大安森林公園永久綠意樹海，雙主臥規劃，頂級進口廚具衛浴。飯店式24小時特勤物業管理，捷運大安森林公園站步行僅3分鐘。',
    owner_reason: '屋主為科技業高階主管，因全家遷居海外經商，誠意讓售非投機客。價格只要符合行情即可乾脆簽約。',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b02',
    user_id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    title: '新板特區水岸首排・板橋大遠百旁景觀捷運豪邸',
    community: '橋峰',
    address: '新北市板橋區中山路一段 161 號',
    price: 3680,
    area: 52.8,
    building_age: 11,
    layout: '3房2廳2衛',
    floor: '18F / 29F',
    parking: 'B3 坡道平面車位',
    description: '新板特區核心地段，四鐵共構步行5分鐘。採光極佳高樓遠眺觀音山水岸夕陽，鋼骨SRC抗震制震宅。',
    owner_reason: '屋主子女已大學畢業離巢，夫妻打算換屋至林口或淡水退休養生大坪數別墅，心態平和。',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b03',
    user_id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    title: '台中草悟道勤美誠品名邸・邊間三面採光綠園道首排',
    community: '由鉅大恆',
    address: '台中市西區五權西路一段 105 號',
    price: 4980,
    area: 75.2,
    building_age: 5,
    layout: '4房2廳3衛',
    floor: '9F / 25F',
    parking: 'B1 雙平面連號車位',
    description: '國美館特區地標建案，建築大師操刀。三面採光南北通透，面草悟道林蔭大道。SRC鋼骨制震。',
    owner_reason: '台商企業主資產重新配置，部分資金需轉向新廠房投資擴廠，希望在年底前完成交屋手續。',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'e1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b04',
    user_id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    title: '竹北高鐵特區・水圳公園旁優質三房平車',
    community: '國泰Twin Park',
    address: '新竹縣竹北市復興二路 23 號',
    price: 2880,
    area: 43.6,
    building_age: 6,
    layout: '3房2廳2衛',
    floor: '7F / 14F',
    parking: 'B2 坡道平面大車位',
    description: '高鐵特區指標建商，步行至高鐵新竹站約7分鐘。臨水圳森林公園，社區素質極高。雙衛浴皆開窗。',
    owner_reason: '屋主剛升遷調職回台積電中科廠，需在台中置產換屋，急尋誠意買方，若看中可迅速敲定斡旋。',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export class PropertyRepository {
  private readonly tableName = 'properties';

  /**
   * Helper: Retrieve fallback local storage records
   */
  private getLocalProperties(): Property[] {
    if (typeof window === 'undefined') return SEED_PROPERTIES;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_PROPERTIES));
        return SEED_PROPERTIES;
      }
      return JSON.parse(stored);
    } catch {
      return SEED_PROPERTIES;
    }
  }

  /**
   * Helper: Save fallback local storage records
   */
  private setLocalProperties(properties: Property[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(properties));
    } catch (err) {
      console.warn('Failed to save to local cache:', err);
    }
  }

  /**
   * Query all properties from Supabase, with automatic fallback & filtering
   */
  async getAll(filter?: PropertyFilter): Promise<Property[]> {
    if (supabase) {
      try {
        let query = supabase
          .from(this.tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (filter?.user_id) {
          query = query.eq('user_id', filter.user_id);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('[PropertyRepository] Supabase query warning, falling back:', error.message);
        } else if (data && data.length > 0) {
          // Sync local storage cache
          this.setLocalProperties(data as Property[]);
          return this.applyClientFilters(data as Property[], filter);
        }
      } catch (err) {
        console.warn('[PropertyRepository] Supabase connection error:', err);
      }
    }

    // Fallback to local storage (persists across page reloads)
    const local = this.getLocalProperties();
    return this.applyClientFilters(local, filter);
  }

  private applyClientFilters(list: Property[], filter?: PropertyFilter): Property[] {
    let filtered = list;
    if (filter?.user_id) {
      filtered = filtered.filter((p) => p.user_id === filter.user_id);
    }
    if (filter?.keyword) {
      const q = filter.keyword.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.community?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.layout?.toLowerCase().includes(q)
      );
    }
    if (filter?.minPrice !== undefined && filter.minPrice > 0) {
      filtered = filtered.filter((p) => Number(p.price) >= filter.minPrice!);
    }
    if (filter?.maxPrice !== undefined && filter.maxPrice > 0) {
      filtered = filtered.filter((p) => Number(p.price) <= filter.maxPrice!);
    }
    return filtered;
  }

  /**
   * Get single property by UUID
   */
  async getById(id: string): Promise<Property | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return data as Property;
        }
      } catch (err) {
        console.warn('[PropertyRepository] Supabase getById error:', err);
      }
    }

    const local = this.getLocalProperties();
    return local.find((p) => p.id === id) || null;
  }

  /**
   * Insert new property using UUID Primary Key
   */
  async create(data: Omit<Property, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Property> {
    const newId = data.id || generateUUID();
    const now = new Date().toISOString();

    const record: Property = {
      ...data,
      id: newId,
      price: Number(data.price),
      area: Number(data.area),
      building_age: Number(data.building_age || 0),
      created_at: now,
      updated_at: now,
    };

    if (supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from(this.tableName)
          .insert(record)
          .select()
          .single();

        if (error) {
          console.warn('[PropertyRepository] Supabase insert warning:', error.message);
        } else if (inserted) {
          // Also save in local storage for instant consistency
          const local = this.getLocalProperties();
          this.setLocalProperties([inserted as Property, ...local.filter((p) => p.id !== newId)]);
          return inserted as Property;
        }
      } catch (err) {
        console.warn('[PropertyRepository] Supabase insert error:', err);
      }
    }

    // Persist to local storage
    const local = this.getLocalProperties();
    const updatedList = [record, ...local.filter((p) => p.id !== newId)];
    this.setLocalProperties(updatedList);
    return record;
  }

  /**
   * Update existing property by UUID
   */
  async update(id: string, updates: Partial<Property>): Promise<Property> {
    const now = new Date().toISOString();
    const payload = {
      ...updates,
      updated_at: now,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          const local = this.getLocalProperties();
          this.setLocalProperties(local.map((p) => (p.id === id ? (data as Property) : p)));
          return data as Property;
        }
      } catch (err) {
        console.warn('[PropertyRepository] Supabase update error:', err);
      }
    }

    const local = this.getLocalProperties();
    const index = local.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`找不到 ID 為 ${id} 的案件`);
    }

    const updated = {
      ...local[index],
      ...payload,
    };
    local[index] = updated;
    this.setLocalProperties(local);
    return updated;
  }

  /**
   * Delete property by UUID
   */
  async delete(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from(this.tableName).delete().eq('id', id);
        if (error) {
          console.warn('[PropertyRepository] Supabase delete warning:', error.message);
        }
      } catch (err) {
        console.warn('[PropertyRepository] Supabase delete error:', err);
      }
    }

    const local = this.getLocalProperties();
    const filtered = local.filter((p) => p.id !== id);
    this.setLocalProperties(filtered);
    return true;
  }
}

export const propertyRepository = new PropertyRepository();
