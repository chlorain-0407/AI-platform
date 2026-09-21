import { supabase } from '../lib/supabase';
import { User, UserRole } from '../models/user';
import { generateUUID } from '../lib/utils';

const LOCAL_STORAGE_KEY = 'estate_ai_users';

const SEED_USERS: User[] = [
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
    email: 'agent.wang@realestate.com.tw',
    name: '王晨峰',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
    company: '信義卓越地產',
    branch: '大安旗艦店',
    phone: '0912-345-678',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e',
    email: 'admin@estateai.tw',
    name: '系統管理員',
    role: 'admin',
    company: 'EstateAI 平台總部',
    branch: '營運中心',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

export class UserRepository {
  private readonly tableName = 'users';

  private getLocalUsers(): User[] {
    if (typeof window === 'undefined') return SEED_USERS;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_USERS));
        return SEED_USERS;
      }
      return JSON.parse(stored);
    } catch {
      return SEED_USERS;
    }
  }

  private setLocalUsers(users: User[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
    } catch (err) {
      console.warn('Failed to save users to local cache:', err);
    }
  }

  async findById(id: string): Promise<User | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return data as User;
        }
      } catch (err) {
        console.warn('[UserRepository] Supabase findById error:', err);
      }
    }

    const users = this.getLocalUsers();
    return users.find((u) => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        if (!error && data) {
          return data as User;
        }
      } catch (err) {
        console.warn('[UserRepository] Supabase findByEmail error:', err);
      }
    }

    const users = this.getLocalUsers();
    return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  }

  async getAll(): Promise<User[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          this.setLocalUsers(data as User[]);
          return data as User[];
        }
      } catch (err) {
        console.warn('[UserRepository] Supabase getAll error:', err);
      }
    }

    return this.getLocalUsers();
  }

  async create(user: Partial<User>): Promise<User> {
    const newId = user.id || generateUUID();
    const role: UserRole = user.role === 'admin' ? 'admin' : 'agent';
    const now = new Date().toISOString();

    const record: User = {
      id: newId,
      email: user.email?.trim().toLowerCase() || '',
      name: user.name?.trim() || '房仲經紀人',
      role,
      created_at: now,
      avatar: user.avatar,
      company: user.company,
      branch: user.branch,
      phone: user.phone,
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .insert(record)
          .select()
          .single();

        if (error) {
          console.warn('[UserRepository] Supabase insert warning:', error.message);
        } else if (data) {
          const local = this.getLocalUsers();
          this.setLocalUsers([data as User, ...local.filter((u) => u.id !== newId)]);
          return data as User;
        }
      } catch (err) {
        console.warn('[UserRepository] Supabase insert error:', err);
      }
    }

    const local = this.getLocalUsers();
    this.setLocalUsers([record, ...local.filter((u) => u.id !== newId)]);
    return record;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(this.tableName)
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          const local = this.getLocalUsers();
          this.setLocalUsers(local.map((u) => (u.id === id ? (data as User) : u)));
          return data as User;
        }
      } catch (err) {
        console.warn('[UserRepository] Supabase update error:', err);
      }
    }

    const local = this.getLocalUsers();
    const index = local.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('找不到該使用者');
    const updated = { ...local[index], ...updates };
    local[index] = updated;
    this.setLocalUsers(local);
    return updated;
  }
}

export const userRepository = new UserRepository();
