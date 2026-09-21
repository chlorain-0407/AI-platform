import React, { useState, useEffect } from 'react';
import {
  Building2,
  DollarSign,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  ArrowUpRight,
  Plus,
  Clock,
  ChevronRight,
  Database,
} from 'lucide-react';
import { Property } from '../models/property';
import { AiRun } from '../models/aiRun';
import { propertyService } from '../services/propertyService';
import { aiRunService } from '../services/aiRunService';
import { formatCurrency, calculateUnitPrice, formatDate } from '../lib/utils';
import { PropertyCard } from '../components/PropertyCard';
import { User } from '../models/user';

interface DashboardPageProps {
  currentUser?: User | null;
  onNavigateToProperties: () => void;
  onNavigateToAiStudio: (propertyId?: string, toolCode?: string) => void;
  onNavigateToMarketingStudio?: (propertyId: string) => void;
  onNavigateToAiHistory: () => void;
  onAddProperty: () => void;
  onEditProperty: (property: Property) => void;
  onDeleteProperty: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  onNavigateToProperties,
  onNavigateToAiStudio,
  onNavigateToMarketingStudio,
  onNavigateToAiHistory,
  onAddProperty,
  onEditProperty,
  onDeleteProperty,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [aiRuns, setAiRuns] = useState<AiRun[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [propsList, runsList] = await Promise.all([
        propertyService.getProperties(),
        aiRunService.getHistory(),
      ]);
      setProperties(propsList);
      setAiRuns(runsList);
    } catch (e: any) {
      console.warn('Dashboard data loading notice:', e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser?.id]);

  const totalCount = properties.length;
  const totalValue = properties.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
  const avgUnitPrice =
    totalCount > 0
      ? (
          properties.reduce((acc, p) => acc + (p.price / (p.area || 1)), 0) / totalCount
        ).toFixed(1)
      : '0.0';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome & AI Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>20年實戰經驗 · 不動產顧問 AI 引擎</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              掌握案件精準賣點與抗性破解，快速促成買賣成交
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              點擊任一在庫案件即可啟動「AI 案件深度剖析」或「AI 行銷文案專家」，即刻生成五大賣點、抗性拆解與實戰帶看引導策略。
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={() => onNavigateToAiStudio()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              <BrainCircuit className="w-4 h-4 stroke-[2.5]" />
              <span>啟動 AI 案件分析</span>
            </button>

            <button
              onClick={onAddProperty}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors border border-slate-700"
            >
              <Plus className="w-4 h-4" />
              <span>新增在庫案件</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>在庫案件總數</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">含大安、新板、台中等重點區</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>在庫總銷金額</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">目前委託在售案值總計</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>案件平均單價</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {avgUnitPrice} <span className="text-sm font-normal text-slate-400">萬/坪</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">依總坪數加權均價計算</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>AI 分析累積筆數</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">
              {aiRuns.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">儲存於 ai_runs 紀錄庫</div>
          </div>
        </div>
      </div>

      {/* Main Content Split: Featured Properties & Recent AI Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Properties */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">熱門在售案件快速入口</h2>
            </div>
            <button
              onClick={onNavigateToProperties}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>查看全部 ({totalCount})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-slate-900 rounded-2xl border border-slate-800">
              資料載入中...
            </div>
          ) : properties.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-300">目前尚無案件，請立即新增第一筆案件！</p>
              <button
                onClick={onAddProperty}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                + 新增案件
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {properties.slice(0, 4).map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  onAnalyze={(p) => onNavigateToAiStudio(p.id, 'property_analysis')}
                  onMarketing={(p) =>
                    onNavigateToMarketingStudio
                      ? onNavigateToMarketingStudio(p.id)
                      : onNavigateToAiStudio(p.id, 'marketing_copy')
                  }
                  onEdit={onEditProperty}
                  onDelete={onDeleteProperty}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent AI Runs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">最新 AI 顧問產出紀錄</h2>
            </div>
            <button
              onClick={onNavigateToAiHistory}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              <span>全數紀錄</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            {aiRuns.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                尚未進行任何 AI 分析，可點擊左側案件立即體驗！
              </div>
            ) : (
              aiRuns.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  onClick={onNavigateToAiHistory}
                  className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        run.tool_code === 'property_analysis'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {run.tool_name}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDate(run.created_at)}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                    {run.property_title || '未命名案件'}
                  </h4>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span>點擊查看完整分析</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Architecture info card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>模組化架構確認</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              本平台嚴格遵守架構規範：
              <br />
              <span className="text-slate-300 font-mono text-[11px]">
                UI → Service → Repository → Database Provider
              </span>
              <br />
              前端不直接接觸資料庫，隨時可抽換為 Firebase 或任意 PostgreSQL。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
