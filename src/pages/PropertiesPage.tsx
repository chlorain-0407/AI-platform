import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  ArrowUpDown,
  X,
  Database,
  RefreshCw,
  Code,
  CheckCircle2,
  Copy,
  Layers,
} from 'lucide-react';
import { Property, PropertyFormData } from '../models/property';
import { propertyService } from '../services/propertyService';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyModal } from '../components/PropertyModal';
import { isSupabaseConfigured } from '../lib/supabase';

interface PropertiesPageProps {
  onAnalyze: (property: Property) => void;
  onMarketing: (property: Property) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const PropertiesPage: React.FC<PropertiesPageProps> = ({
  onAnalyze,
  onMarketing,
  onShowToast,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'area_desc'>('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const loadProperties = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const list = await propertyService.getProperties();
      setProperties(list);
    } catch (err: any) {
      onShowToast(err.message || '載入案件失敗', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleCreateOrUpdate = async (formData: PropertyFormData) => {
    if (editingProperty) {
      await propertyService.updateProperty(editingProperty.id, formData);
      onShowToast('案件資料更新成功！', 'success');
    } else {
      const created = await propertyService.createProperty(formData);
      onShowToast(`新案件「${created.title}」已成功建檔（UUID: ${created.id.substring(0, 8)}...）！`, 'success');
    }
    await loadProperties(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除此筆案件資料嗎？此操作不可撤銷。')) {
      try {
        await propertyService.deleteProperty(id);
        onShowToast('案件已刪除', 'info');
        await loadProperties(true);
      } catch (err: any) {
        onShowToast(err.message || '刪除失敗', 'error');
      }
    }
  };

  const handleCopySql = () => {
    const sqlContent = `-- Supabase PostgreSQL Schema DDL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  community TEXT,
  address TEXT NOT NULL,
  price NUMERIC NOT NULL,
  area NUMERIC NOT NULL,
  building_age NUMERIC DEFAULT 0,
  layout TEXT,
  floor TEXT,
  parking TEXT,
  description TEXT,
  owner_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  model TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES ai_tools(id) ON DELETE SET NULL,
  input JSONB,
  output JSONB,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;
    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
    onShowToast('Supabase SQL 結構已複製到剪貼簿！', 'success');
  };

  // Filter & Sort
  const filteredProperties = properties
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.community?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.layout?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'area_desc') return b.area - a.area;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Supabase Database Status Banner */}
      <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${isSupabaseConfigured ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">Supabase PostgreSQL 架構</span>
              {isSupabaseConfigured ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  雲端直連模式
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  本機持久儲存（重整保留）
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              資料存取階層：UI Component → Service → Repository → Supabase (UUID Primary Key)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>Supabase SQL 結構</span>
          </button>

          <button
            onClick={() => loadProperties(true)}
            disabled={refreshing}
            title="從資料庫重新載入資料，驗證持久化"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>重新讀取</span>
          </button>
        </div>
      </div>

      {/* Top Bar: Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            我的在庫案件庫
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            共 {properties.length} 筆案件，每筆均使用 UUID Primary Key 儲存於 properties 表
          </p>
        </div>

        <button
          id="properties-add-btn"
          onClick={() => {
            setEditingProperty(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>新增案件</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋案件名稱、社區、地址或格局..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>排序方式：</span>
          </div>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-hidden focus:border-amber-500"
          >
            <option value="newest">最新建檔優先</option>
            <option value="price_desc">總價由高至低</option>
            <option value="price_asc">總價由低至高</option>
            <option value="area_desc">坪數由大至小</option>
          </select>
        </div>
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm bg-slate-900/60 rounded-3xl border border-slate-800">
          資料庫讀取中，請稍候...
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {searchQuery ? '沒有找到符合搜尋條件的案件' : '目前尚無案件'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery ? '請嘗試更換關鍵字或清除篩選條件' : '點擊下方按鈕立即新增第一筆房產案件至 Supabase'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                setEditingProperty(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
            >
              + 新增第一筆案件
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              onAnalyze={onAnalyze}
              onMarketing={onMarketing}
              onEdit={(p) => {
                setEditingProperty(p);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Property Modal for Add / Edit */}
      <PropertyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingProperty}
      />

      {/* Supabase SQL DDL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Supabase PostgreSQL 資料表結構 (DDL)</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400">
              <span>在 Supabase SQL Editor 執行此腳本即可建立 4 張資料表</span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors font-medium"
              >
                {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? '已複製！' : '複製 SQL'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-950/90 font-mono text-xs text-slate-300 space-y-4 leading-relaxed">
              <pre className="whitespace-pre-wrap">{`-- 1. users 表 (UUID, email, name, role 'admin'|'agent', created_at)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. properties 表 (UUID Primary Key, 售價、坪數、動機等完整欄位)
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  community TEXT,
  address TEXT NOT NULL,
  price NUMERIC NOT NULL,
  area NUMERIC NOT NULL,
  building_age NUMERIC DEFAULT 0,
  layout TEXT,
  floor TEXT,
  parking TEXT,
  description TEXT,
  owner_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ai_tools 表
CREATE TABLE IF NOT EXISTS ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT,
  model TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ai_runs 表 (UUID, input jsonb, output jsonb)
CREATE TABLE IF NOT EXISTS ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES ai_tools(id) ON DELETE SET NULL,
  input JSONB,
  output JSONB,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`}</pre>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/60">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
