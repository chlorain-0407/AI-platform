import React, { useState, useEffect } from 'react';
import {
  History,
  BrainCircuit,
  FileText,
  Trash2,
  Eye,
  Calendar,
  Building2,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react';
import { AiRun, PropertyAnalysisOutput, MarketingCopyOutput } from '../models/aiRun';
import { aiRunService } from '../services/aiRunService';
import { formatDate } from '../lib/utils';
import { AnalysisResultView } from '../components/AnalysisResultView';
import { MarketingCopyView } from '../components/MarketingCopyView';

interface AiHistoryPageProps {
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToStudio: () => void;
}

export const AiHistoryPage: React.FC<AiHistoryPageProps> = ({
  onShowToast,
  onNavigateToStudio,
}) => {
  const [runs, setRuns] = useState<AiRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTool, setFilterTool] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRun, setSelectedRun] = useState<AiRun | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const list = await aiRunService.getHistory();
      setRuns(list);
    } catch (err: any) {
      onShowToast(err.message || '載入紀錄失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除這筆 AI 使用紀錄嗎？')) {
      try {
        await aiRunService.deleteRun(id);
        if (selectedRun?.id === id) {
          setSelectedRun(null);
        }
        onShowToast('紀錄已刪除', 'info');
        await loadHistory();
      } catch (err: any) {
        onShowToast(err.message || '刪除失敗', 'error');
      }
    }
  };

  const filteredRuns = runs.filter((run) => {
    if (filterTool !== 'all' && run.tool_code !== filterTool) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        run.property_title?.toLowerCase().includes(q) ||
        run.tool_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" />
            AI 使用紀錄資料庫 (ai_runs)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            所有 20 年顧問深度分析與行銷文案皆持久化儲存於此，供經紀人隨時調閱與複用
          </p>
        </div>

        <button
          onClick={onNavigateToStudio}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/20"
        >
          <BrainCircuit className="w-4 h-4 stroke-[2.5]" />
          <span>進行新案件剖析</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋案件標題或工具..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterTool('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterTool === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            全部 ({runs.length})
          </button>
          <button
            onClick={() => setFilterTool('property_analysis')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterTool === 'property_analysis'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            案件深度剖析
          </button>
          <button
            onClick={() => setFilterTool('marketing_copy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterTool === 'marketing_copy'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            行銷文案專家
          </button>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm bg-slate-900/60 rounded-3xl border border-slate-800">
          紀錄載入中...
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <History className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-white">尚無符合條件的 AI 執行紀錄</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            在「AI 工作室」或「我的案件」點擊「AI 案件分析」，生成結果將自動保留於此。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRuns.map((run) => (
            <div
              key={run.id}
              onClick={() => setSelectedRun(run)}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between group shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      run.tool_code === 'property_analysis'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {run.tool_name}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(run.created_at)}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 mb-2">
                  {run.property_title || '未命名案件'}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {run.tool_code === 'property_analysis'
                    ? ((run.output_result || run.output) as PropertyAnalysisOutput)?.basic_summary?.market_positioning ||
                      '20年顧問實戰全方位剖析'
                    : ((run.output_result || run.output) as MarketingCopyOutput)?.headline || '多渠道行銷文案'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:underline">
                  <Eye className="w-3.5 h-3.5" />
                  <span>展開完整分析報告</span>
                </span>

                <button
                  onClick={(e) => handleDelete(run.id, e)}
                  title="刪除紀錄"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for viewing detailed analysis or marketing copy */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  {selectedRun.tool_code === 'property_analysis' ? (
                    <BrainCircuit className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedRun.property_title || '案件詳細分析'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedRun.tool_name} · 執行時間：{formatDate(selectedRun.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {selectedRun.tool_code === 'property_analysis' ? (
                <AnalysisResultView
                  analysis={(selectedRun.output_result || selectedRun.output) as PropertyAnalysisOutput}
                  propertyTitle={selectedRun.property_title}
                />
              ) : (
                <MarketingCopyView
                  marketing={(selectedRun.output_result || selectedRun.output) as MarketingCopyOutput}
                  propertyTitle={selectedRun.property_title}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
