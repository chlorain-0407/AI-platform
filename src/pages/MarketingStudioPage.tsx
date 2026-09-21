import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Share2,
  MessageSquare,
  Film,
  Mic,
  Tag,
  CheckCircle2,
  Copy,
  RotateCw,
  Edit3,
  Save,
  History,
  X,
  ChevronRight,
  Search,
  Building2,
  BrainCircuit,
  Sliders,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  Check,
  Eye,
  Send,
} from 'lucide-react';
import { Property } from '../models/property';
import {
  MarketingContent,
  MarketingContentType,
  MarketingStatus,
  MARKETING_CONTENT_TYPE_META,
  FacebookContent,
  LineContent,
  Video30Content,
  Video60Content,
  ListingTitleContent,
} from '../models/marketing';
import { propertyService } from '../services/propertyService';
import { marketingService } from '../services/marketingService';
import { User } from '../models/user';
import { formatCurrency, calculateUnitPrice, formatDate } from '../lib/utils';

interface MarketingStudioPageProps {
  currentUser?: User | null;
  initialPropertyId?: string;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToProperties?: () => void;
}

const PRESET_GOALS = [
  { id: '快速曝光', label: '快速曝光', desc: '強調新上架首發、吸睛吸流量、引爆熱度' },
  { id: '家庭換屋', label: '家庭換屋', desc: '強調室內大空間、家庭成長、溫馨採光' },
  { id: '首購族', label: '首購族', desc: '強調低總價成家、高坪效、捷運便利' },
  { id: '價格訴求', label: '價格訴求', desc: '強調行情讓利、誠意出價、超高性價比' },
  { id: '生活機能', label: '生活機能', desc: '強調成熟商圈、學區綠意、下樓即享便利' },
  { id: '稀有性', label: '稀有性', desc: '強調視野景觀首排、戶數單純、極少釋出' },
  { id: '投資型', label: '投資型', desc: '強調租金穩定收益、保值抗通膨、地段潛力' },
  { id: '自訂', label: '自訂目標', desc: '輸入自訂行銷目標與切角' },
];

const PRESET_AUDIENCES = [
  { id: '首購族', label: '首購族', desc: '年輕成家、小資買方、重視總價與負擔能力' },
  { id: '換屋家庭', label: '換屋家庭', desc: '家有成員擴充、需要 3~4 房大空間與電梯' },
  { id: '小家庭', label: '小家庭', desc: '育有幼童學童、重視安全社區與學區公園' },
  { id: '科技業族群', label: '科技業族群', desc: '高收入理性買方、重視通勤時效與智能居家' },
  { id: '退休族', label: '退休族', desc: '重視無障礙、醫療資源、寧靜綠意與生活機能' },
  { id: '投資客', label: '投資客', desc: '重視投報率、未來重劃增值、好租好轉手' },
  { id: '自訂', label: '自訂客群', desc: '精準描繪特定客群輪廓' },
];

export const MarketingStudioPage: React.FC<MarketingStudioPageProps> = ({
  currentUser,
  initialPropertyId,
  onShowToast,
  onNavigateToProperties,
}) => {
  // Properties state
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId || '');
  const [propertySearch, setPropertySearch] = useState('');

  // 5 Steps state
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedGoal, setSelectedGoal] = useState<string>('快速曝光');
  const [customGoal, setCustomGoal] = useState<string>('');
  const [selectedAudience, setSelectedAudience] = useState<string>('換屋家庭');
  const [customAudience, setCustomAudience] = useState<string>('');
  const [selectedContentType, setSelectedContentType] = useState<MarketingContentType>('facebook_post');
  const [additionalInstruction, setAdditionalInstruction] = useState<string>('');

  // Generation & Output state
  const [generating, setGenerating] = useState(false);
  const [currentContent, setCurrentContent] = useState<MarketingContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Version History Modal state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<MarketingContent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Selected property object
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  // Load properties on mount
  useEffect(() => {
    loadProperties();
  }, []);

  // Handle deep link property selection
  useEffect(() => {
    if (initialPropertyId) {
      setSelectedPropertyId(initialPropertyId);
      loadExistingContentForProperty(initialPropertyId, selectedContentType);
    }
  }, [initialPropertyId]);

  const loadProperties = async () => {
    setLoadingProperties(true);
    try {
      const list = await propertyService.getProperties();
      setProperties(list);
      if (!selectedPropertyId && list.length > 0) {
        setSelectedPropertyId(list[0].id);
        loadExistingContentForProperty(list[0].id, selectedContentType);
      }
    } catch (e: any) {
      onShowToast(e.message || '載入案件失敗', 'error');
    } finally {
      setLoadingProperties(false);
    }
  };

  const loadExistingContentForProperty = async (propertyId: string, contentType: MarketingContentType) => {
    try {
      const history = await marketingService.getHistory(propertyId, contentType);
      if (history && history.length > 0) {
        // Load latest version by default
        setCurrentContent(history[0]);
        setEditBuffer(history[0].content);
      } else {
        setCurrentContent(null);
        setEditBuffer(null);
      }
    } catch (e) {
      // Ignore initial load notice
    }
  };

  // When user switches property or content type, check if existing content exists
  const handleSelectProperty = (propId: string) => {
    setSelectedPropertyId(propId);
    loadExistingContentForProperty(propId, selectedContentType);
  };

  const handleSelectContentType = (type: MarketingContentType) => {
    setSelectedContentType(type);
    if (selectedPropertyId) {
      loadExistingContentForProperty(selectedPropertyId, type);
    }
  };

  const getEffectiveGoal = () => {
    if (selectedGoal === '自訂') {
      return customGoal.trim() || '高性價比成家';
    }
    return selectedGoal;
  };

  const getEffectiveAudience = () => {
    if (selectedAudience === '自訂') {
      return customAudience.trim() || '主流自住買方';
    }
    return selectedAudience;
  };

  // Generate marketing content (Calls backend POST /api/marketing/generate)
  const handleGenerate = async () => {
    if (!selectedPropertyId) {
      onShowToast('請先選擇要推廣的案件！', 'error');
      setActiveStep(1);
      return;
    }

    setGenerating(true);
    setIsEditing(false);

    try {
      const res = await marketingService.generateContent({
        propertyId: selectedPropertyId,
        contentType: selectedContentType,
        marketingGoal: getEffectiveGoal(),
        targetAudience: getEffectiveAudience(),
        additionalInstruction: additionalInstruction.trim(),
      });

      setCurrentContent(res.content);
      setEditBuffer(res.content.content);
      setActiveStep(5);

      if (res.latestAnalysisLoaded) {
        onShowToast(`【版本 v${res.version}】生成成功！已無縫融合 20 年顧問深度剖析精華`, 'success');
      } else {
        onShowToast(`【版本 v${res.version}】生成成功！已依據物件資料完成規格化推導`, 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || '生成失敗，請稍後重試', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Save edits to MongoDB
  const handleSaveEdits = async () => {
    if (!currentContent) return;
    setIsSaving(true);
    try {
      await marketingService.updateContent(currentContent.id, {
        content: editBuffer,
        status: currentContent.status,
      });
      setCurrentContent({
        ...currentContent,
        content: editBuffer,
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
      onShowToast('文案內容已更新儲存！', 'success');
    } catch (err: any) {
      onShowToast(err.message || '儲存失敗', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Update status (draft -> approved -> archived)
  const handleUpdateStatus = async (newStatus: MarketingStatus) => {
    if (!currentContent) return;
    try {
      await marketingService.updateContent(currentContent.id, {
        status: newStatus,
      });
      setCurrentContent({
        ...currentContent,
        status: newStatus,
      });
      onShowToast(`文案狀態已更新為：${newStatus === 'approved' ? '已核准' : newStatus === 'archived' ? '已歸檔' : '草稿'}`, 'info');
    } catch (err: any) {
      onShowToast(err.message || '狀態變更失敗', 'error');
    }
  };

  // Open history modal
  const handleOpenHistory = async () => {
    if (!selectedPropertyId) return;
    setIsHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const list = await marketingService.getHistory(selectedPropertyId, selectedContentType);
      setHistoryList(list);
    } catch (err: any) {
      onShowToast(err.message || '無法載入歷史版本', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Switch to a historical version
  const handleSelectHistoryVersion = (versionItem: MarketingContent) => {
    setCurrentContent(versionItem);
    setEditBuffer(versionItem.content);
    setIsEditing(false);
    setIsHistoryOpen(false);
    setActiveStep(5);
    onShowToast(`已切換至版本 v${versionItem.version}（${formatDate(versionItem.createdAt)}）`, 'info');
  };

  // Copy formatted text to clipboard
  const handleCopyFormattedText = () => {
    if (!currentContent) return;
    const content = editBuffer || currentContent.content;
    let textToCopy = '';

    if (currentContent.contentType === 'facebook_post') {
      const fb = content as FacebookContent;
      textToCopy = `${fb.headline}\n\n${fb.body}\n\n${fb.cta}\n\n${(fb.hashtags || []).join(' ')}`;
    } else if (currentContent.contentType === 'line_message') {
      const line = content as LineContent;
      textToCopy = `${line.opening}\n\n${line.message}\n\n${line.cta}`;
    } else if (currentContent.contentType === 'video_30s') {
      const v30 = content as Video30Content;
      const segmentsText = (v30.segments || [])
        .map((s, i) => `【分鏡 ${i + 1} (${s.duration}秒)】\n畫面：${s.visual}\n口播：${s.voiceover}`)
        .join('\n\n');
      textToCopy = `【黃金3秒Hook】\n${v30.hook}\n\n${segmentsText}\n\n【行動呼籲CTA】\n${v30.cta}`;
    } else if (currentContent.contentType === 'video_60s') {
      const v60 = content as Video60Content;
      textToCopy = `【吸睛開場 Hook】\n${v60.hook}\n\n【60秒口播講稿】\n${v60.script}\n\n【行動呼籲 CTA】\n${v60.cta}`;
    } else if (currentContent.contentType === 'listing_title') {
      const lt = content as ListingTitleContent;
      textToCopy = (lt.titles || [])
        .map((t) => `【${t.type}】${t.title}`)
        .join('\n\n');
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      onShowToast('✅ 已複製格式化文案至剪貼簿！可直接貼至社群發布', 'success');
    }
  };

  // Filter properties
  const filteredProperties = properties.filter((p) => {
    const q = propertySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      (p.community && p.community.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 行銷工作室 · 案件自動整合引擎</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              五大社群與影音通路行銷內容生成
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              自動讀取既有案件資料與最近一次 20 年顧問深度剖析，依據您的目標與客群定位，精準產出自然有溫度的 Facebook 貼文、LINE 快訊、30秒短影音腳本、60秒口播稿與 5 款黃金標題。
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            {currentContent && (
              <button
                onClick={handleOpenHistory}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span>歷史版本 (v{currentContent.version})</span>
              </button>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || !selectedPropertyId}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                generating || !selectedPropertyId
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-amber-500 hover:from-indigo-400 hover:to-amber-400 text-slate-950 shadow-indigo-500/20'
              }`}
            >
              <RotateCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'AI 正在提煉文案中...' : '立即啟動生成'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5-Step Visual Stepper Bar */}
      <div className="grid grid-cols-5 gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
        {[
          { step: 1, label: 'STEP 1', name: '選擇案件' },
          { step: 2, label: 'STEP 2', name: '行銷目標' },
          { step: 3, label: 'STEP 3', name: '目標客群' },
          { step: 4, label: 'STEP 4', name: '內容類型' },
          { step: 5, label: 'STEP 5', name: '產出展示台' },
        ].map((s) => {
          const isCurrent = activeStep === s.step;
          const isDone = activeStep > s.step;
          return (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-center transition-all ${
                isCurrent
                  ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                  : isDone
                  ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      isCurrent
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.step}
                  </span>
                )}
                <span className="text-[10px] font-mono tracking-wider font-semibold">
                  {s.label}
                </span>
              </div>
              <span className="text-xs font-bold mt-0.5 truncate w-full px-1">
                {s.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Panels (Steps 1 to 4) */}
        <div className="lg:col-span-5 space-y-6">
          {/* STEP 1: Property Selector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                  1
                </span>
                <h2 className="text-sm font-bold text-white">選擇物件案件</h2>
              </div>
              <span className="text-[11px] text-slate-400">已直接載入既有案件</span>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                placeholder="搜尋案件名稱、社區或地址..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Property list */}
            {loadingProperties ? (
              <div className="text-center py-6 text-xs text-slate-400">載入案件中...</div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">查無相符案件</div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredProperties.map((p) => {
                  const isSelected = p.id === selectedPropertyId;
                  const unitP = calculateUnitPrice(p.price, p.area);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProperty(p.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs truncate max-w-[200px]">
                          {p.title}
                        </span>
                        <span className="text-xs font-bold text-amber-400">
                          {formatCurrency(p.price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                        <span>
                          {p.layout} · {p.area} 坪
                        </span>
                        <span>單價 {unitP} 萬/坪</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Property Snapshot Preview */}
            {selectedProperty && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">案件快照資料</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                    免重複輸入
                  </span>
                </div>
                <div className="text-slate-200 font-semibold">{selectedProperty.title}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>社區：{selectedProperty.community || '獨立產權'}</div>
                  <div>格局：{selectedProperty.layout}</div>
                  <div>總價：{selectedProperty.price} 萬</div>
                  <div>車位：{selectedProperty.parking}</div>
                  <div className="col-span-2 truncate">地址：{selectedProperty.address}</div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Marketing Goal Selector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                  2
                </span>
                <h2 className="text-sm font-bold text-white">選擇行銷目標</h2>
              </div>
              <span className="text-[11px] text-indigo-400 font-semibold">{selectedGoal}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PRESET_GOALS.map((goal) => {
                const isSelected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`p-2.5 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{goal.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{goal.desc}</div>
                  </button>
                );
              })}
            </div>

            {selectedGoal === '自訂' && (
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="例如：急售讓利、明星學區成家、大安捷運首席..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>

          {/* STEP 3: Target Audience Selector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                  3
                </span>
                <h2 className="text-sm font-bold text-white">選擇目標客群</h2>
              </div>
              <span className="text-[11px] text-indigo-400 font-semibold">{selectedAudience}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PRESET_AUDIENCES.map((aud) => {
                const isSelected = selectedAudience === aud.id;
                return (
                  <button
                    key={aud.id}
                    onClick={() => setSelectedAudience(aud.id)}
                    className={`p-2.5 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{aud.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{aud.desc}</div>
                  </button>
                );
              })}
            </div>

            {selectedAudience === '自訂' && (
              <input
                type="text"
                value={customAudience}
                onChange={(e) => setCustomAudience(e.target.value)}
                placeholder="例如：內科高階主管、台大附幼家長、尋求退休無障礙好宅..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>

          {/* STEP 4: Content Type & Additional Instructions Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                  4
                </span>
                <h2 className="text-sm font-bold text-white">選擇內容類型</h2>
              </div>
              <span className="text-[11px] text-amber-400 font-semibold">
                {MARKETING_CONTENT_TYPE_META[selectedContentType].label}
              </span>
            </div>

            <div className="space-y-2">
              {(Object.keys(MARKETING_CONTENT_TYPE_META) as MarketingContentType[]).map((type) => {
                const meta = MARKETING_CONTENT_TYPE_META[type];
                const isSelected = selectedContentType === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleSelectContentType(type)}
                    className={`w-full p-3 rounded-xl text-left transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? 'bg-indigo-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {type === 'facebook_post' && <Share2 className="w-4 h-4" />}
                        {type === 'line_message' && <MessageSquare className="w-4 h-4" />}
                        {type === 'video_30s' && <Film className="w-4 h-4" />}
                        {type === 'video_60s' && <Mic className="w-4 h-4" />}
                        {type === 'listing_title' && <Tag className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-2">
                          <span>{meta.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                            {meta.tag}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{meta.description}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Additional Instruction Input (Optional) */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-slate-400">
                經紀人補充指示 (選填)
              </label>
              <textarea
                value={additionalInstruction}
                onChange={(e) => setAdditionalInstruction(e.target.value)}
                placeholder="例如：屋主附贈全室大金變頻冷氣、特別強調三面採光、開價含裝潢可直接入住等..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 custom-scrollbar resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: STEP 5 Output Canvas / Studio Result Display */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 min-h-[600px] flex flex-col justify-between">
            {/* Output Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                  5
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{MARKETING_CONTENT_TYPE_META[selectedContentType].label} 產出展示台</span>
                    {currentContent && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/30">
                        版本 v{currentContent.version}
                      </span>
                    )}
                  </h3>
                  {currentContent && (
                    <span className="text-[10px] text-slate-400">
                      由 {currentContent.userName || '經紀人'} 產出 · {formatDate(currentContent.createdAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              {currentContent && (
                <div className="flex items-center gap-2">
                  {/* Status toggle pill */}
                  <select
                    value={currentContent.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as MarketingStatus)}
                    className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none font-medium"
                  >
                    <option value="draft">草稿 (draft)</option>
                    <option value="approved">已核准 (approved)</option>
                    <option value="archived">已歸檔 (archived)</option>
                  </select>

                  {/* Copy button */}
                  <button
                    onClick={handleCopyFormattedText}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                    title="一鍵複製格式化純文字"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>複製</span>
                  </button>

                  {/* Edit/Save toggle */}
                  {isEditing ? (
                    <button
                      onClick={handleSaveEdits}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? '儲存中...' : '儲存修改'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>編輯</span>
                    </button>
                  )}

                  {/* Regenerate new version */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
                    title="重新生成將產生新版本 (version + 1)，不覆蓋原本內容"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                    <span>重新生成 (v+1)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Canvas Body */}
            <div className="flex-1 py-2">
              {generating ? (
                <div className="flex flex-col items-center justify-center h-96 space-y-4 text-center">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-sm font-bold text-white">正在調用 MongoDB AI 工具生成</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      結合案件規格、最新 20 年顧問分析、目標「{getEffectiveGoal()}」與客群「{getEffectiveAudience()}」...
                    </p>
                  </div>
                </div>
              ) : !currentContent ? (
                <div className="flex flex-col items-center justify-center h-96 space-y-4 text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h4 className="text-base font-bold text-white">尚未生成此類型的行銷內容</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      左側已為您預填案件資料。確認行銷目標與客群後，點擊「立即啟動生成」，AI 將自動提煉高轉換文案。
                    </p>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedPropertyId}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    立即啟動生成
                  </button>
                </div>
              ) : (
                /* Formatted Preview Cards per Content Type */
                <div className="space-y-4">
                  {/* FACEBOOK POST PREVIEW */}
                  {currentContent.contentType === 'facebook_post' && (
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-sm">
                          房
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>精選優質房產 · 專任經紀人</span>
                            <span className="text-[10px] text-blue-400">✓ 認證</span>
                          </div>
                          <div className="text-[10px] text-slate-400">剛剛 · 🌐 公開分享</div>
                        </div>
                      </div>

                      {/* Headline */}
                      {isEditing ? (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">貼文標題 (Headline)</label>
                          <input
                            type="text"
                            value={editBuffer?.headline || ''}
                            onChange={(e) => setEditBuffer({ ...editBuffer, headline: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      ) : (
                        <h4 className="text-sm font-extrabold text-white leading-snug">
                          {currentContent.content?.headline}
                        </h4>
                      )}

                      {/* Body */}
                      {isEditing ? (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">內文段落 (Body)</label>
                          <textarea
                            rows={8}
                            value={editBuffer?.body || ''}
                            onChange={(e) => setEditBuffer({ ...editBuffer, body: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 custom-scrollbar"
                          />
                        </div>
                      ) : (
                        <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                          {currentContent.content?.body}
                        </div>
                      )}

                      {/* CTA */}
                      {isEditing ? (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">行動呼籲 (CTA)</label>
                          <input
                            type="text"
                            value={editBuffer?.cta || ''}
                            onChange={(e) => setEditBuffer({ ...editBuffer, cta: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300"
                          />
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
                          {currentContent.content?.cta}
                        </div>
                      )}

                      {/* Hashtags */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {(currentContent.content?.hashtags || []).map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 text-[11px] font-medium border border-blue-500/20"
                          >
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LINE MESSAGE PREVIEW */}
                  {currentContent.contentType === 'line_message' && (
                    <div className="max-w-md mx-auto bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                      <div className="bg-emerald-600 px-4 py-2.5 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span className="font-bold text-xs">LINE 官方訊息預覽</span>
                        </div>
                        <span className="text-[10px] bg-emerald-700/60 px-2 py-0.5 rounded-full">即時私訊</span>
                      </div>

                      <div className="p-4 space-y-3">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">破題問候 (Opening)</label>
                              <textarea
                                rows={2}
                                value={editBuffer?.opening || ''}
                                onChange={(e) => setEditBuffer({ ...editBuffer, opening: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">核心訊息 (Message)</label>
                              <textarea
                                rows={6}
                                value={editBuffer?.message || ''}
                                onChange={(e) => setEditBuffer({ ...editBuffer, message: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400">行動引導 (CTA)</label>
                              <textarea
                                rows={2}
                                value={editBuffer?.cta || ''}
                                onChange={(e) => setEditBuffer({ ...editBuffer, cta: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 text-xs text-slate-200">
                            <div className="font-bold text-emerald-400 text-xs">{currentContent.content?.opening}</div>
                            <div className="whitespace-pre-line leading-relaxed text-slate-200">
                              {currentContent.content?.message}
                            </div>
                            <div className="pt-2 border-t border-slate-800 text-amber-300 font-semibold">
                              {currentContent.content?.cta}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 30S VIDEO SCRIPT PREVIEW */}
                  {currentContent.contentType === 'video_30s' && (
                    <div className="space-y-4">
                      {/* Golden Hook */}
                      <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-1">
                        <div className="flex items-center gap-2 text-purple-300 text-xs font-bold">
                          <Film className="w-4 h-4" />
                          <span>前 3 秒黃金吸睛 Hook (前置懸念)</span>
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editBuffer?.hook || ''}
                            onChange={(e) => setEditBuffer({ ...editBuffer, hook: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                        ) : (
                          <p className="text-sm font-extrabold text-white">{currentContent.content?.hook}</p>
                        )}
                      </div>

                      {/* 3 Segments */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {((currentContent.content?.segments as any[]) || []).map((seg, idx) => (
                          <div key={idx} className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 font-mono text-[10px] font-bold">
                                {seg.duration} 秒
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">分鏡 0{idx + 1}</span>
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold text-slate-400 mb-0.5">🎥 畫面指示</div>
                              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2 rounded-lg">
                                {seg.visual}
                              </p>
                            </div>
                            <div>
                              <div className="text-[10px] font-semibold text-slate-400 mb-0.5">🎙️ 口播配音</div>
                              <p className="text-xs text-amber-200 leading-relaxed bg-slate-900/80 p-2 rounded-lg font-medium">
                                "{seg.voiceover}"
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Video CTA */}
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">影片結尾引導 (CTA)：</span>
                        <span className="font-bold text-amber-400">{currentContent.content?.cta}</span>
                      </div>
                    </div>
                  )}

                  {/* 60S ORAL SCRIPT PREVIEW */}
                  {currentContent.contentType === 'video_60s' && (
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
                      {/* Teleprompter Mode Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold text-white">60 秒經紀人鏡頭前提詞講稿</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          預估語速：約 180~220 字 / 60 秒
                        </span>
                      </div>

                      {/* Hook */}
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="text-[10px] font-bold text-amber-400 mb-1">【開場 5 秒提問或破題】</div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editBuffer?.hook || ''}
                            onChange={(e) => setEditBuffer({ ...editBuffer, hook: e.target.value })}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                        ) : (
                          <p className="text-xs sm:text-sm font-bold text-white">{currentContent.content?.hook}</p>
                        )}
                      </div>

                      {/* Full script */}
                      {isEditing ? (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400">口播主講稿 (Script)</label>
                          <textarea
                            rows={8}
                            value={editBuffer?.script || ''}
                            onChange={(e) => setEditBuffer({ ...editBuffer, script: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                          />
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans font-medium">
                          {currentContent.content?.script}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-semibold">
                        👉 結尾收攏：{currentContent.content?.cta}
                      </div>
                    </div>
                  )}

                  {/* 5 LISTING TITLES PREVIEW */}
                  {currentContent.contentType === 'listing_title' && (
                    <div className="space-y-3">
                      <div className="text-xs text-slate-400 mb-2">
                        一次產出 5 種不同買方切角的吸引力標題，點擊右側按鈕即可單獨複製：
                      </div>

                      {((currentContent.content?.titles as any[]) || []).map((t, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                                t.type === '價格型'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : t.type === '生活型'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : t.type === '家庭型'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : t.type === '稀有型'
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {t.type}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                              {t.title}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(t.title);
                              onShowToast(`已複製【${t.type}】標題！`, 'success');
                            }}
                            className="shrink-0 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                            title="複製此標題"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Info Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                <span>文案產出不覆蓋舊版本 · 系統自動遞增 version 並記於 ai_runs</span>
              </span>
              <button
                onClick={() => setActiveStep(1)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>更換案件 / 參數</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Version History Drawer / Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">歷史版本管理 (Version History)</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {loadingHistory ? (
                <div className="text-center py-12 text-slate-400 text-sm">載入歷史版本中...</div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">此案件尚無其他歷史版本</div>
              ) : (
                historyList.map((item) => {
                  const isCurrent = currentContent?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-indigo-950/40 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                            版本 v{item.version}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.status === 'archived'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {item.status === 'approved' ? '已核准' : item.status === 'archived' ? '已歸檔' : '草稿'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1 mb-3">
                        <div>
                          <span className="text-slate-400">行銷目標：</span>
                          {item.marketingGoal} · <span className="text-slate-400">客群：</span>
                          {item.targetAudience}
                        </div>
                        {item.userName && (
                          <div className="text-[11px] text-slate-400">建立人：{item.userName}</div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        {isCurrent ? (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> 目前正在檢視
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSelectHistoryVersion(item)}
                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                          >
                            切換至此版本
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
