import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Building2,
  ChevronDown,
  Loader2,
  FileText,
  MapPin,
  CheckCircle2,
  History,
  Share2,
} from 'lucide-react';
import { Property } from '../models/property';
import { PropertyAnalysisOutput, MarketingCopyOutput, AiRun } from '../models/aiRun';
import { propertyService } from '../services/propertyService';
import { aiAnalysisService } from '../services/aiAnalysisService';
import { formatCurrency, calculateUnitPrice } from '../lib/utils';
import { AnalysisResultView } from '../components/AnalysisResultView';
import { MarketingCopyView } from '../components/MarketingCopyView';

interface AiStudioPageProps {
  initialPropertyId?: string;
  initialToolCode?: string;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onViewHistory: () => void;
}

export const AiStudioPage: React.FC<AiStudioPageProps> = ({
  initialPropertyId,
  initialToolCode = 'property_analysis',
  onShowToast,
  onViewHistory,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId || '');
  const [selectedTool, setSelectedTool] = useState<string>(initialToolCode);
  const [marketingTone, setMarketingTone] = useState<string>('專業誠懇吸睛');

  const [loading, setLoading] = useState(false);
  const [currentRun, setCurrentRun] = useState<AiRun | null>(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const list = await propertyService.getProperties();
        setProperties(list);
        if (!selectedPropertyId && list.length > 0) {
          setSelectedPropertyId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadProperties();
  }, []);

  useEffect(() => {
    if (initialPropertyId) {
      setSelectedPropertyId(initialPropertyId);
    }
  }, [initialPropertyId]);

  useEffect(() => {
    if (initialToolCode) {
      setSelectedTool(initialToolCode);
    }
  }, [initialToolCode]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];

  const handleRunAi = async () => {
    if (!selectedProperty) {
      onShowToast('請先選擇欲分析的案件', 'error');
      return;
    }

    try {
      setLoading(true);
      setCurrentRun(null);

      if (selectedTool === 'property_analysis') {
        const run = await aiAnalysisService.runPropertyAnalysis(selectedProperty);
        setCurrentRun(run);
        onShowToast('20年顧問案件深度剖析完成，結果已存入 ai_runs！', 'success');
      } else {
        const run = await aiAnalysisService.runMarketingCopy(selectedProperty, marketingTone);
        setCurrentRun(run);
        onShowToast('行銷文案生成完成，結果已存入 ai_runs！', 'success');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'AI 運算失敗，請稍後再試', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold border border-amber-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI 實戰工作室 · 顧問級別洞察</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            不動產顧問 AI 深度診斷與行銷中心
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            後端安全串接 Gemini API，嚴格守護 API Key，自動持久化儲存至 ai_runs 資料表
          </p>
        </div>

        <button
          onClick={onViewHistory}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <History className="w-4 h-4 text-slate-400" />
          <span>查看歷史診斷紀錄</span>
        </button>
      </div>

      {/* Control Card: Property Selector & Tool Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Step 1: Select Property */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  1
                </span>
                選擇要分析的在售案件
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                庫存共 {properties.length} 筆
              </span>
            </label>

            {properties.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                目前尚無案件，請先在「我的案件」建立房源。
              </div>
            ) : (
              <div className="relative">
                <select
                  id="ai-property-select"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-medium focus:outline-hidden focus:border-amber-500 appearance-none pr-10"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ｜ {formatCurrency(p.price)} ｜ {p.area}坪 ｜ {p.layout}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Step 2: Choose AI Tool */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                2
              </span>
              選擇 AI 顧問模組
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="tool-select-analysis"
                onClick={() => setSelectedTool('property_analysis')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTool === 'property_analysis'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <BrainCircuit
                    className={`w-4 h-4 ${
                      selectedTool === 'property_analysis' ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-bold">AI 案件深度剖析</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  20年顧問8大維度：五大賣點、抗性破解、銷售策略
                </p>
              </button>

              <button
                type="button"
                id="tool-select-marketing"
                onClick={() => setSelectedTool('marketing_copy')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTool === 'marketing_copy'
                    ? 'bg-blue-500/15 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText
                    className={`w-4 h-4 ${
                      selectedTool === 'marketing_copy' ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-bold">AI 行銷文案專家</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  FB貼文、LINE快訊、IG打卡、VIP買方EDM一網打盡
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Property Preview Banner */}
        {selectedProperty && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{selectedProperty.title}</span>
                {selectedProperty.community && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {selectedProperty.community}
                  </span>
                )}
              </div>
              <div className="text-slate-400 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedProperty.address}
                </span>
                <span>• 格局：{selectedProperty.layout}</span>
                <span>• 車位：{selectedProperty.parking}</span>
              </div>
              {selectedProperty.owner_reason && (
                <div className="text-amber-300/90 text-[11px]">
                  <span className="font-semibold text-amber-400">屋主心態：</span>
                  {selectedProperty.owner_reason}
                </div>
              )}
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-lg font-black text-amber-400">
                {formatCurrency(selectedProperty.price)}
              </div>
              <div className="text-slate-400 text-[11px]">
                {calculateUnitPrice(selectedProperty.price, selectedProperty.area)} · {selectedProperty.area} 坪
              </div>
            </div>
          </div>
        )}

        {/* Run Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>AI 分析結果將自動寫入 ai_runs 資料表並提供一鍵複製</span>
          </div>

          <button
            id="run-ai-btn"
            onClick={handleRunAi}
            disabled={loading || !selectedProperty}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>
                  {selectedTool === 'property_analysis'
                    ? '20年不動產顧問深度診斷中...'
                    : '行銷文案生成中...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {selectedTool === 'property_analysis'
                    ? '點擊開始「AI 案件分析」'
                    : '點擊生成「AI 行銷文案」'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading Animation Card */}
      {loading && (
        <div className="bg-slate-900/60 border border-amber-500/30 rounded-3xl p-8 text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              正在運用 20 年實戰經驗進行全方位診斷...
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              正在分析【五大賣點】、【抗性與話術破解】、【目標客群輪廓】、【實戰帶看引導】與【銷售策略】
            </p>
          </div>
        </div>
      )}

      {/* Analysis Results Display */}
      {currentRun && currentRun.tool_code === 'property_analysis' && (
        <div className="animate-in fade-in duration-300">
          <AnalysisResultView
            analysis={(currentRun.output_result || currentRun.output) as PropertyAnalysisOutput}
            propertyTitle={currentRun.property_title}
          />
        </div>
      )}

      {/* Marketing Copy Results Display */}
      {currentRun && currentRun.tool_code === 'marketing_copy' && (
        <div className="animate-in fade-in duration-300">
          <MarketingCopyView
            marketing={(currentRun.output_result || currentRun.output) as MarketingCopyOutput}
            propertyTitle={currentRun.property_title}
          />
        </div>
      )}
    </div>
  );
};
