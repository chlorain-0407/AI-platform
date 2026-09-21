import React, { useState } from 'react';
import { Copy, Check, MessageSquare, Send, Instagram, Mail, Hash, Sparkles } from 'lucide-react';
import { MarketingCopyOutput } from '../models/aiRun';

interface MarketingCopyViewProps {
  marketing: MarketingCopyOutput;
  propertyTitle?: string;
}

export const MarketingCopyView: React.FC<MarketingCopyViewProps> = ({
  marketing,
  propertyTitle,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!marketing) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
        暫無行銷文案內容或資料格式正在載入中...
      </div>
    );
  }

  const headline = marketing.headline || propertyTitle || '優質好房熱銷中';
  const facebook_post = marketing.facebook_post || '歡迎預約鑑賞，親臨現場感受空間之美。';
  const line_push = marketing.line_push || '好案推薦！歡迎隨時聯絡洽詢細節。';
  const instagram_xiaohongshu = marketing.instagram_xiaohongshu || '絕美空間，精緻品味生活。';
  const buyer_edm = marketing.buyer_edm || '親愛的買方您好，為您精選合適案件，歡迎聯絡安排看屋。';
  const hashtags = Array.isArray(marketing.hashtags) ? marketing.hashtags : ['精選房源', '成家首選'];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Headline */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-500/15 via-slate-900 to-slate-900 border border-blue-500/30">
        <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>核心吸睛大標題</span>
        </div>
        <div className="text-base sm:text-lg font-bold text-white leading-relaxed">
          {headline}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Facebook 貼文 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Facebook 社群深度貼文</h3>
              </div>
              <button
                onClick={() => copyToClipboard(facebook_post, 'fb')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                {copiedKey === 'fb' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已複製</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>複製貼文</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-mono">
              {facebook_post}
            </div>
          </div>
        </div>

        {/* LINE 推播短訊 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">LINE 官方帳號 / 一對一推播</h3>
              </div>
              <button
                onClick={() => copyToClipboard(line_push, 'line')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                {copiedKey === 'line' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已複製</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>複製短訊</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-mono">
              {line_push}
            </div>
          </div>
        </div>

        {/* Instagram / 小紅書 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <Instagram className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">IG / 小紅書 視覺打卡文案</h3>
              </div>
              <button
                onClick={() => copyToClipboard(instagram_xiaohongshu, 'ig')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                {copiedKey === 'ig' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已複製</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>複製文案</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-mono">
              {instagram_xiaohongshu}
            </div>
          </div>
        </div>

        {/* VIP 買方精選 EDM */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">VIP 買方專屬賞屋信件 (EDM)</h3>
              </div>
              <button
                onClick={() => copyToClipboard(buyer_edm, 'edm')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                {copiedKey === 'edm' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">已複製</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>複製信件</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-mono">
              {buyer_edm}
            </div>
          </div>
        </div>
      </div>

      {/* Hashtags */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-300">熱門社群標籤：</span>
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((tag, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-medium">
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => copyToClipboard(hashtags.join(' '), 'tags')}
          className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          {copiedKey === 'tags' ? '已複製標籤' : '複製全數標籤'}
        </button>
      </div>
    </div>
  );
};
