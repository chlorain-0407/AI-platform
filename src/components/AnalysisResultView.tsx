import React, { useState } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Users,
  Eye,
  TrendingUp,
  ListTodo,
  Copy,
  Check,
  Building2,
  Share2,
} from 'lucide-react';
import { PropertyAnalysisOutput } from '../models/aiRun';

interface AnalysisResultViewProps {
  analysis: PropertyAnalysisOutput;
  propertyTitle?: string;
  onCopyAll?: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  analysis,
  propertyTitle,
}) => {
  const [copied, setCopied] = useState(false);

  if (!analysis) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
        暫無分析報告內容或資料格式正在載入中...
      </div>
    );
  }

  const basic_summary = analysis.basic_summary || {
    unit_price_ping: '詳見內文',
    market_positioning: '標準住宅市場定位',
    summary_highlights: [],
  };
  const five_selling_points = Array.isArray(analysis.five_selling_points) ? analysis.five_selling_points : [];
  const resistance_points = Array.isArray(analysis.resistance_points) ? analysis.resistance_points : [];
  const resistance_solutions = Array.isArray(analysis.resistance_solutions) ? analysis.resistance_solutions : [];
  const target_audience = {
    buyer_profiles: Array.isArray(analysis.target_audience?.buyer_profiles) ? analysis.target_audience.buyer_profiles : [],
    lifestyle_appeal: analysis.target_audience?.lifestyle_appeal || '適合重視生活機能與便利交通的購屋客群',
  };
  const showing_keypoints = Array.isArray(analysis.showing_keypoints) ? analysis.showing_keypoints : [];
  const sales_strategy = {
    pricing_strategy: analysis.sales_strategy?.pricing_strategy || '依實價登錄合理定價',
    negotiation_tips: analysis.sales_strategy?.negotiation_tips || '強調稀有性與保值性',
    marketing_channels: Array.isArray(analysis.sales_strategy?.marketing_channels) ? analysis.sales_strategy.marketing_channels : [],
  };
  const next_action_steps = Array.isArray(analysis.next_action_steps) ? analysis.next_action_steps : [];

  const handleCopy = () => {
    const textToCopy = `【20年不動產顧問・案件深度剖析報告】
案件：${propertyTitle || '不動產案件'}

一、基本資料整理
・每坪單價：${basic_summary.unit_price_ping}
・市場定位：${basic_summary.market_positioning}
・重點摘記：
${basic_summary.summary_highlights.map((h) => `  - ${h}`).join('\n')}

二、五大核心賣點
${five_selling_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}

三、案件抗性分析
${resistance_points.map((r, i) => `${i + 1}. ${r}`).join('\n')}

四、抗性解決方式（實戰話術與解方）
${resistance_solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

五、目標客群定位
・客群輪廓：
${target_audience.buyer_profiles.map((b) => `  - ${b}`).join('\n')}
・生活型態訴求：${target_audience.lifestyle_appeal}

六、實戰帶看重點
${showing_keypoints.map((k, i) => `${i + 1}. ${k}`).join('\n')}

七、銷售策略與議價攻防
・定價策略：${sales_strategy.pricing_strategy}
・談判技巧：${sales_strategy.negotiation_tips}
・行銷通路：${sales_strategy.marketing_channels.join('、')}

八、下一步立即行動建議
${next_action_steps.map((a, i) => `${i + 1}. ${a}`).join('\n')}
`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                20年不動產顧問實戰觀點
              </span>
              <span className="text-xs text-slate-400">已完整儲存至 ai_runs</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
              {propertyTitle || '案件深度剖析報告'}
            </h2>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all shadow-xs"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">已複製完整報告</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-300" />
              <span>複製報告文字</span>
            </>
          )}
        </button>
      </div>

      {/* Grid of 8 Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. 基本資料整理 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                1. 基本資料整理與定位
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 mb-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">每坪換算單價</span>
              <span className="text-base font-extrabold text-amber-400">
                {basic_summary.unit_price_ping}
              </span>
            </div>

            <div className="mb-3">
              <div className="text-xs text-slate-400 font-medium mb-1">市場定位</div>
              <p className="text-xs sm:text-sm text-slate-200 bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                {basic_summary.market_positioning}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-slate-400 font-medium">重點歸納</div>
              {basic_summary.summary_highlights.map((h, i) => (
                <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. 五大賣點 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              2. 五大核心強效賣點
            </h3>
          </div>
          <div className="space-y-2.5">
            {five_selling_points.map((point, index) => (
              <div
                key={index}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs sm:text-sm text-slate-200"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 案件抗性 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              3. 案件真實抗性（買方猶豫點）
            </h3>
          </div>
          <div className="space-y-2.5">
            {resistance_points.map((res, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 flex items-start gap-2.5 text-xs sm:text-sm text-rose-200"
              >
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  !
                </span>
                <span className="leading-relaxed">{res}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. 抗性解決方式 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              4. 抗性解決方式（實戰破解話術）
            </h3>
          </div>
          <div className="space-y-2.5">
            {resistance_solutions.map((sol, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/30 flex items-start gap-2.5 text-xs sm:text-sm text-blue-100"
              >
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="leading-relaxed">{sol}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. 目標客群 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              5. 精準目標客群 (Target Buyers)
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-400 mb-1.5">買方畫像與族群</div>
              <div className="space-y-1.5">
                {target_audience.buyer_profiles.map((profile, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs sm:text-sm text-slate-200 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>{profile}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-1">生活型態心理訴求</div>
              <p className="text-xs sm:text-sm text-purple-200 bg-purple-950/20 p-2.5 rounded-xl border border-purple-900/30 leading-relaxed">
                {target_audience.lifestyle_appeal}
              </p>
            </div>
          </div>
        </div>

        {/* 6. 帶看重點 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              6. 帶看成交引導重點
            </h3>
          </div>
          <div className="space-y-2.5">
            {showing_keypoints.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs sm:text-sm text-slate-200"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. 銷售策略 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              7. 定價與談判攻防銷售策略
            </h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-semibold text-amber-400 mb-1">定價與底價防線</div>
              <p className="text-xs sm:text-sm text-slate-200">
                {sales_strategy.pricing_strategy}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-semibold text-blue-400 mb-1">議價談判心理攻防</div>
              <p className="text-xs sm:text-sm text-slate-200">
                {sales_strategy.negotiation_tips}
              </p>
            </div>

            <div>
              <div className="text-xs text-slate-400 mb-1.5">推薦行銷渠道</div>
              <div className="flex flex-wrap gap-1.5">
                {sales_strategy.marketing_channels.map((ch, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 8. 下一步行動建議 */}
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-5 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ListTodo className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              8. 經紀人下一步立即行動建議
            </h3>
          </div>
          <div className="space-y-2.5">
            {next_action_steps.map((step, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs sm:text-sm text-slate-100"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <span className="leading-relaxed font-medium">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
