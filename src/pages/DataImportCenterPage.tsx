import React, { useState, useEffect } from 'react';
import {
  Globe,
  FileSpreadsheet,
  FileText,
  Sheet,
  Database,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Clock,
  Building,
  Image as ImageIcon,
  Check,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { importService } from '../services/importService';
import { ImportRecord, ExtractedPropertyData } from '../models/import';
import { User } from '../models/user';

interface DataImportCenterPageProps {
  currentUser: User | null;
  onNavigateToProperties?: (propertyId?: string) => void;
}

type ImportSourceTab = 'website' | 'csv' | 'excel' | 'google_sheet' | 'api';
type ProcessStep = 'idle' | 'fetching' | 'analyzing' | 'preview' | 'completed' | 'error';

export const DataImportCenterPage: React.FC<DataImportCenterPageProps> = ({
  currentUser,
  onNavigateToProperties,
}) => {
  const [activeSourceTab, setActiveSourceTab] = useState<ImportSourceTab>('website');

  // Input & Processing State
  const [targetUrl, setTargetUrl] = useState('');
  const [processStep, setProcessStep] = useState<ProcessStep>('idle');
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Preview Form Data
  const [formData, setFormData] = useState<ExtractedPropertyData | null>(null);
  const [confidence, setConfidence] = useState<{ [key: string]: number }>({});
  const [needsVerification, setNeedsVerification] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Duplicate Check
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateProperty, setDuplicateProperty] = useState<any>(null);
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState(false);

  // Submission State
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [createdPropertyResult, setCreatedPropertyResult] = useState<any>(null);

  // History State
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const list = await importService.getImports();
      setImportHistory(list);
    } catch (e) {
      console.warn('Load import history error:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentUser?.id]);

  // Handle URL scraping initiation
  const handleStartImport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetUrl.trim() || processStep === 'fetching' || processStep === 'analyzing') return;

    setErrorMessage(null);
    setErrorCode(null);
    setCreatedPropertyResult(null);
    setIsDuplicate(false);
    setDuplicateProperty(null);
    setIgnoreDuplicateWarning(false);

    try {
      // Step 1: Fetching & SSRF verification
      setProcessStep('fetching');

      // Add a slight visual progression to communicate SSRF verification and website fetching
      const timer = setTimeout(() => {
        setProcessStep('analyzing');
      }, 1200);

      const result = await importService.importWebsite(targetUrl.trim());
      clearTimeout(timer);

      setCurrentImportId(result.importId);
      if (result.extractedData) {
        setFormData(result.extractedData);
        setConfidence(result.extractedData.confidence || {});
        setNeedsVerification(result.extractedData.needsVerification || []);
        setSelectedImages(result.extractedData.images || []);
      }

      if (result.isDuplicate) {
        setIsDuplicate(true);
        setDuplicateProperty(result.duplicateProperty);
      }

      setProcessStep('preview');
      loadHistory();
    } catch (err: any) {
      setProcessStep('error');
      setErrorMessage(err.message || '讀取或分析網站失敗');
      setErrorCode(err.errorCode || 'FETCH_FAILED');
      loadHistory();
    }
  };

  // Handle field change in preview form
  const handleFieldChange = (field: keyof ExtractedPropertyData, value: any) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Toggle image selection
  const toggleImage = (url: string) => {
    if (selectedImages.includes(url)) {
      setSelectedImages(selectedImages.filter((u) => u !== url));
    } else {
      setSelectedImages([...selectedImages, url]);
    }
  };

  // Confirm and create property
  const handleConfirmCreate = async () => {
    if (!currentImportId || !formData) return;

    if (!formData.title?.trim() || !formData.address?.trim() || !formData.price || !formData.area) {
      alert('請確認必填欄位（案件名稱、地址、總價與坪數）皆已正確填寫！');
      return;
    }

    try {
      setIsSubmittingConfirm(true);
      const submissionData = {
        ...formData,
        images: selectedImages,
      };

      const result = await importService.confirmImport(currentImportId, submissionData);
      setCreatedPropertyResult(result.property);
      setProcessStep('completed');
      loadHistory();
    } catch (err: any) {
      alert(`案件建立失敗：${err.message}`);
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  // Reset form to start a new import
  const handleReset = () => {
    setTargetUrl('');
    setProcessStep('idle');
    setFormData(null);
    setCurrentImportId(null);
    setErrorMessage(null);
    setErrorCode(null);
    setIsDuplicate(false);
    setDuplicateProperty(null);
    setCreatedPropertyResult(null);
  };

  // Resume preview from history
  const handleResumePreview = (record: ImportRecord) => {
    if (record.extractedData) {
      setCurrentImportId(record.id);
      setTargetUrl(record.sourceUrl);
      setFormData(record.extractedData);
      setConfidence(record.extractedData.confidence || {});
      setNeedsVerification(record.extractedData.needsVerification || []);
      setSelectedImages(record.extractedData.images || []);
      setProcessStep('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Check if a field needs verification
  const isFieldNeedsVerification = (field: string) => {
    if (needsVerification.includes(field)) return true;
    if (confidence[field] !== undefined && confidence[field] < 70) return true;
    return false;
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Introduction */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden border border-slate-700/60">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium mb-3">
            <Globe className="w-3.5 h-3.5" />
            <span>全自動外部資料採集管線 (Phase 1)</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2">
            外部資料匯入中心
          </h1>
          <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
            輸入公開房地產售屋網址，系統於後端透過安全防護沙盒 (SSRF Protection)
            進行網頁擷取、HTML 資料清理，並由 Gemini 進行台灣房產 Schema
            結構化萃取。資料需經人工預覽確認後方可正式建檔寫入案件庫。
          </p>
        </div>
      </div>

      {/* Source Tab Selector (Future Extensible Architecture) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveSourceTab('website')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeSourceTab === 'website'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>公開網站網址匯入</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-white/20 text-white font-mono">
            現行支援
          </span>
        </button>

        <button
          type="button"
          disabled
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed opacity-75"
          title="架構預留中，未來第二階段開放"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          <span>CSV 檔案匯入</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-mono">
            未來擴充
          </span>
        </button>

        <button
          type="button"
          disabled
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed opacity-75"
          title="架構預留中，未來開放"
        >
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Excel 試算表</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-mono">
            未來擴充
          </span>
        </button>

        <button
          type="button"
          disabled
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed opacity-75"
          title="架構預留中，未來開放"
        >
          <Sheet className="w-4 h-4 text-slate-400" />
          <span>Google Sheets 連動</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-mono">
            未來擴充
          </span>
        </button>

        <button
          type="button"
          disabled
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed opacity-75"
          title="架構預留中，未來開放"
        >
          <Database className="w-4 h-4 text-slate-400" />
          <span>JSON API 介接</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-mono">
            未來擴充
          </span>
        </button>
      </div>

      {/* Main Import Work Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* URL Input Form */}
        <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="max-w-4xl">
            <h2 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <span>輸入公開售屋網站網址</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              支援台灣各大公開房地產平台之案件詳情頁 (如 591、永慶、信義、樂屋網或房仲自建公開網站)。禁止輸入
              localhost、內部 IP 或是需要登入權限之私有後台。
            </p>

            <form onSubmit={handleStartImport} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  disabled={processStep === 'fetching' || processStep === 'analyzing'}
                  placeholder="https://sale.591.com.tw/home/house/detail/2/..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={!targetUrl.trim() || processStep === 'fetching' || processStep === 'analyzing'}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {processStep === 'fetching' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>讀取網站中...</span>
                  </>
                ) : processStep === 'analyzing' ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                    <span>AI 萃取結構中...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>讀取網站</span>
                  </>
                )}
              </button>
            </form>

            {/* Live Progress Bar indicator */}
            {(processStep === 'fetching' || processStep === 'analyzing') && (
              <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold">
                    {processStep === 'fetching'
                      ? '【第 1 階段】正在連線並抓取公開 HTML 原始碼 (SSRF 安全驗證中)...'
                      : '【第 2 階段】正在清理無關標籤並由 Gemini 進行房產結構化資料抽取...'}
                  </p>
                  <p className="text-indigo-700 mt-0.5">
                    請稍候，後端正在過濾廣告、導覽列與解析 JSON-LD，保護內部網路安全。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error State Banner */}
        {processStep === 'error' && (
          <div className="p-6 lg:p-8 bg-rose-50/70 border-b border-rose-100 text-rose-900">
            <div className="flex items-start gap-3 max-w-3xl">
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-rose-900 text-sm">網站讀取或資料萃取失敗</h3>
                  {errorCode && (
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-rose-200/80 text-rose-800 rounded font-semibold">
                      {errorCode}
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">{errorMessage}</p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleStartImport()}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>重試一次</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 text-xs font-medium transition-all"
                  >
                    輸入其他網址
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success / Completed Banner */}
        {processStep === 'completed' && createdPropertyResult && (
          <div className="p-8 bg-emerald-50 border-b border-emerald-100 text-emerald-900">
            <div className="max-w-3xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center flex-shrink-0 text-emerald-600">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-emerald-950">案件已成功匯入並建立完成！</h3>
                <p className="text-sm text-emerald-800">
                  案件「<span className="font-semibold text-emerald-950">{createdPropertyResult.title}</span>」已正式存入 MongoDB properties 集合，並自動關聯至您的經紀人身分與所屬門店。
                </p>
                <div className="pt-3 flex flex-wrap gap-3">
                  {onNavigateToProperties && (
                    <button
                      type="button"
                      onClick={() => onNavigateToProperties(createdPropertyResult.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Building className="w-4 h-4" />
                      <span>前往案件管理查看此案件</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-medium transition-all"
                  >
                    繼續匯入下一個案件
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview State Form */}
        {processStep === 'preview' && formData && (
          <div className="p-6 lg:p-8 space-y-8">
            {/* Header of Preview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium">
                    匯入預覽確認
                  </span>
                  <span className="text-xs text-slate-500">來源網站：{formData.sourceSite || '公開網頁'}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  請核對並確認擷取之案件資料
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  標示「<span className="text-amber-600 font-semibold">請確認</span>」之欄位為 AI 信心度較低或由推論產出，請務必手動審核後再送出建檔。
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmittingConfirm}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-all disabled:opacity-50"
                >
                  放棄並重來
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  disabled={isSubmittingConfirm || (isDuplicate && !ignoreDuplicateWarning)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingConfirm ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在建立案件...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>確認並建立案件</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Duplicate Warning Alert */}
            {isDuplicate && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">此網址可能已匯入過！</h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      系統在庫已存在相同來源網址之案件「
                      <span className="font-semibold text-amber-950">
                        {duplicateProperty?.title || '既有案件'}
                      </span>
                      」。您可以選擇取消，或勾選「仍然建立」繼續匯入。
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-amber-900 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ignoreDuplicateWarning}
                      onChange={(e) => setIgnoreDuplicateWarning(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 border-amber-300 w-4 h-4"
                    />
                    <span>確認無誤，仍然建立</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-medium"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 案件名稱 */}
              <div className="lg:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    案件名稱 <span className="text-rose-500">*</span>
                  </label>
                  {isFieldNeedsVerification('title') && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      請確認
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 社區名稱 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">社區 / 建案名稱</label>
                  {isFieldNeedsVerification('community') && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      請確認
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.community || ''}
                  onChange={(e) => handleFieldChange('community', e.target.value)}
                  placeholder="如：仁愛帝寶、美河市"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 地址 */}
              <div className="lg:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    完整地址 / 路段 <span className="text-rose-500">*</span>
                  </label>
                  {isFieldNeedsVerification('address') && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      請確認
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={formData.address || ''}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 總價 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    總價 (萬元) <span className="text-rose-500">*</span>
                  </label>
                  {isFieldNeedsVerification('price') && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      請確認
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price ?? ''}
                    onChange={(e) =>
                      handleFieldChange('price', e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full px-3.5 py-2 pr-12 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono font-semibold"
                  />
                  <span className="absolute right-3.5 top-2 text-xs text-slate-400">萬元</span>
                </div>
              </div>

              {/* 權狀總坪數 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    權狀坪數 (坪) <span className="text-rose-500">*</span>
                  </label>
                  {isFieldNeedsVerification('area') && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      請確認
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.area ?? ''}
                    onChange={(e) =>
                      handleFieldChange('area', e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full px-3.5 py-2 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono font-semibold"
                  />
                  <span className="absolute right-3.5 top-2 text-xs text-slate-400">坪</span>
                </div>
              </div>

              {/* 主建物坪數 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">主建物坪數</label>
                  {isFieldNeedsVerification('mainArea') && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      請確認
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mainArea ?? ''}
                    onChange={(e) =>
                      handleFieldChange('mainArea', e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="室內實坪"
                    className="w-full px-3.5 py-2 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                  <span className="absolute right-3.5 top-2 text-xs text-slate-400">坪</span>
                </div>
              </div>

              {/* 屋齡 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">屋齡 (年)</label>
                  {isFieldNeedsVerification('buildingAge') && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      請確認
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.buildingAge ?? ''}
                    onChange={(e) =>
                      handleFieldChange('buildingAge', e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="0 為預售屋"
                    className="w-full px-3.5 py-2 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                  <span className="absolute right-3.5 top-2 text-xs text-slate-400">年</span>
                </div>
              </div>

              {/* 格局 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">格局規劃</label>
                  {isFieldNeedsVerification('layout') && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      請確認
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.layout || ''}
                  onChange={(e) => handleFieldChange('layout', e.target.value)}
                  placeholder="如：3房2廳2衛"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 樓層 / 總樓層 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">所在樓層 / 總樓高</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.floor || ''}
                    onChange={(e) => handleFieldChange('floor', e.target.value)}
                    placeholder="如：8樓"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={formData.totalFloors || ''}
                    onChange={(e) => handleFieldChange('totalFloors', e.target.value)}
                    placeholder="如：15樓"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 車位 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">車位配置</label>
                  {isFieldNeedsVerification('parking') && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      請確認
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.parking || ''}
                  onChange={(e) => handleFieldChange('parking', e.target.value)}
                  placeholder="如：坡道平面車位、無"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 物件類型 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">物件類型</label>
                <input
                  type="text"
                  value={formData.propertyType || ''}
                  onChange={(e) => handleFieldChange('propertyType', e.target.value)}
                  placeholder="如：電梯大樓、電梯華廈、公寓、透天"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* 管理費 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">管理費 (元/月)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.managementFee ?? ''}
                    onChange={(e) =>
                      handleFieldChange(
                        'managementFee',
                        e.target.value ? parseInt(e.target.value, 10) : null
                      )
                    }
                    placeholder="如：3200"
                    className="w-full px-3.5 py-2 pr-12 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                  <span className="absolute right-3.5 top-2 text-xs text-slate-400">元/月</span>
                </div>
              </div>

              {/* 說明 */}
              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">物件特色與詳細說明</label>
                <textarea
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="案件詳細描述、商圈特色、裝潢狀況等..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Candidate Images Section */}
            {formData.images && formData.images.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <span>擷取到之案件圖片 (已選取 {selectedImages.length} 張)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      第一階段系統僅儲存外部圖片原始連結，不耗費本機空間。點擊可切換勾選欲保留之圖片。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {formData.images.map((imgUrl, idx) => {
                    const isSelected = selectedImages.includes(imgUrl);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleImage(imgUrl)}
                        className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-video bg-slate-100 ${
                          isSelected
                            ? 'border-indigo-600 shadow-sm'
                            : 'border-transparent opacity-50 hover:opacity-80'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`擷取圖片 ${idx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // hide broken images
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div
                          className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                            isSelected ? 'bg-indigo-600' : 'bg-slate-700/60'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmittingConfirm}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={isSubmittingConfirm || (isDuplicate && !ignoreDuplicateWarning)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingConfirm ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>正在建檔中...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>確認無誤，建立正式案件</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import History Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>
                匯入歷史紀錄{' '}
                {currentUser?.role === 'admin'
                  ? '(全系統)'
                  : currentUser?.role === 'manager'
                  ? '(門店庫存)'
                  : '(個人任務)'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              依照身分嚴格隔離之外部匯入紀錄，重新整理後依然持久保存於 MongoDB。
            </p>
          </div>

          <button
            type="button"
            onClick={loadHistory}
            disabled={loadingHistory}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            <span>重新整理</span>
          </button>
        </div>

        {loadingHistory && importHistory.length === 0 ? (
          <div className="py-12 flex justify-center items-center text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>載入匯入紀錄中...</span>
          </div>
        ) : importHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Globe className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>尚無任何外部資料匯入紀錄</p>
            <p className="text-xs text-slate-400 mt-1">在上方輸入公開網站網址即可開始第一次匯入</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                  <th className="py-3 px-4">來源類型 / 網址</th>
                  <th className="py-3 px-4">萃取案件名稱</th>
                  <th className="py-3 px-4">價格 / 坪數</th>
                  <th className="py-3 px-4">狀態</th>
                  <th className="py-3 px-4">匯入時間</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importHistory.map((item) => {
                  const statusMap: Record<
                    string,
                    { label: string; bg: string; text: string; icon: any }
                  > = {
                    completed: {
                      label: '已完成建檔',
                      bg: 'bg-emerald-50 border-emerald-200',
                      text: 'text-emerald-700',
                      icon: CheckCircle2,
                    },
                    preview: {
                      label: '預覽確認中',
                      bg: 'bg-amber-50 border-amber-200',
                      text: 'text-amber-700',
                      icon: Clock,
                    },
                    processing: {
                      label: '處理中',
                      bg: 'bg-indigo-50 border-indigo-200',
                      text: 'text-indigo-700',
                      icon: Loader2,
                    },
                    failed: {
                      label: '匯入失敗',
                      bg: 'bg-rose-50 border-rose-200',
                      text: 'text-rose-700',
                      icon: XCircle,
                    },
                  };

                  const s = statusMap[item.status] || {
                    label: item.status,
                    bg: 'bg-slate-50',
                    text: 'text-slate-600',
                    icon: Info,
                  };
                  const StatusIcon = s.icon;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] uppercase">
                            {item.type}
                          </span>
                          <span className="font-medium text-slate-700 truncate block">
                            {item.sourceSite || '外部網站'}
                          </span>
                        </div>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-slate-400 hover:text-indigo-600 truncate block mt-0.5 max-w-[240px]"
                        >
                          {item.sourceUrl}
                        </a>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 max-w-[200px] truncate">
                          {item.extractedData?.title ||
                            item.rawMetadata?.title ||
                            '（尚未解析名稱）'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {item.extractedData?.address || ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.extractedData?.price ? (
                          <div className="font-mono font-semibold text-slate-900">
                            {item.extractedData.price} 萬
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                        {item.extractedData?.area ? (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {item.extractedData.area} 坪
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${s.bg} ${s.text}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{s.label}</span>
                        </span>
                        {item.errorCode && (
                          <div className="text-[10px] text-rose-500 font-mono mt-0.5">
                            {item.errorCode}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleString('zh-TW', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {item.status === 'preview' ? (
                          <button
                            type="button"
                            onClick={() => handleResumePreview(item)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs transition-all"
                          >
                            繼續預覽確認
                          </button>
                        ) : item.status === 'completed' && item.propertyId && onNavigateToProperties ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToProperties(item.propertyId!)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-all inline-flex items-center gap-1"
                          >
                            <span>查看案件</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
