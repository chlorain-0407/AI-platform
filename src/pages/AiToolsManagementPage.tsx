import React, { useEffect, useState } from 'react';
import { Sliders, CheckCircle2, XCircle, Cpu, FileText, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import { AiTool } from '../models/aiTool';
import { apiFetch } from '../services/apiClient';

const AVAILABLE_MODELS = [
  { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite (高穩定度 / 推薦)', desc: '輕量極速、抗尖峰過載、低延遲' },
  { value: 'gemini-flash-latest', label: 'Gemini Flash Latest (標準 Flash)', desc: '自動對應最新版通用 Flash' },
  { value: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (高算力旗艦)', desc: '大規格分析，尖峰時可能負載較高' },
];

export const AiToolsManagementPage: React.FC = () => {
  const [tools, setTools] = useState<AiTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadTools = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/ai/tools');
      const data = await res.json();
      setTools(data.tools || []);
    } catch (err: any) {
      setError(err.message || '載入 AI 工具失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  const handleToggleEnable = async (tool: AiTool) => {
    try {
      setUpdatingId(tool.id);
      const res = await apiFetch(`/api/ai/tools/${tool.id}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !tool.enabled }),
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.id === tool.id ? { ...t, enabled: !t.enabled } : t))
        );
        showSuccess(`已成功${!tool.enabled ? '啟用' : '停用'} ${tool.name}`);
      } else {
        const d = await res.json();
        alert(d.error || '更新失敗');
      }
    } catch (e: any) {
      alert(e.message || '更新失敗');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleModelChange = async (tool: AiTool, newModel: string) => {
    try {
      setUpdatingId(tool.id);
      const res = await apiFetch(`/api/ai/tools/${tool.id}`, {
        method: 'PUT',
        body: JSON.stringify({ model: newModel }),
      });
      if (res.ok) {
        setTools((prev) =>
          prev.map((t) => (t.id === tool.id ? { ...t, model: newModel } : t))
        );
        showSuccess(`已將 ${tool.name} 模型切換為 ${newModel}`);
      } else {
        const d = await res.json();
        alert(d.error || '模型更新失敗');
      }
    } catch (e: any) {
      alert(e.message || '模型更新失敗');
    } finally {
      setUpdatingId(null);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-amber-400" />
            <span>AI 工具與模型設定 (Admin Only)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            管理平台內建之 20年資深不動產顧問 AI 模型、系統 Prompt 與功能開關
          </p>
        </div>

        <button
          onClick={loadTools}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 self-start sm:self-auto flex items-center gap-2 text-xs font-semibold cursor-pointer"
          title="重新整理"
        >
          <RefreshCw className="w-4 h-4" />
          <span>重新整理</span>
        </button>
      </div>

      {/* Stability Notice Banner */}
      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-sm flex items-start sm:items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-900/50 text-emerald-400 border border-emerald-700/50 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-white flex items-center gap-2">
            <span>系統穩定度防護已生效</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              gemini-3.1-flash-lite
            </span>
          </div>
          <p className="text-xs text-emerald-300/80 mt-0.5">
            已將所有 AI 工具切換為較低負載的 <strong>Gemini 3.1 Flash-Lite</strong> 輕量模型，具備更高的並發可用性與超低延遲，並在後端內建自動故障降級機制，避免尖峰時段 503 過載。
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">載入 AI 工具設定中...</div>
      ) : (
        <div className="space-y-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>{tool.name}</span>
                      <span className="text-xs font-mono text-slate-400">({tool.code || tool.id})</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{tool.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Model Selector */}
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
                    <label className="text-xs text-slate-400 font-medium">指定模型:</label>
                    <select
                      value={tool.model || 'gemini-3.1-flash-lite'}
                      disabled={updatingId === tool.id}
                      onChange={(e) => handleModelChange(tool, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer disabled:opacity-50"
                    >
                      {AVAILABLE_MODELS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleToggleEnable(tool)}
                    disabled={updatingId === tool.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer disabled:opacity-50 ${
                      tool.enabled
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                    }`}
                  >
                    {tool.enabled ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>已啟用</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>已停用</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* System Prompt View */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>核心 System Instruction (顧問 Persona 設定)</span>
                </div>
                <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto pr-2">
                  {tool.system_prompt}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
