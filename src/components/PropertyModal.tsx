import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, DollarSign, Sparkles, AlertCircle } from 'lucide-react';
import { Property, PropertyFormData } from '../models/property';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  initialData?: Property | null;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    community: '',
    address: '',
    price: 3000,
    area: 45,
    building_age: 5,
    layout: '3房2廳2衛',
    floor: '8F / 15F',
    parking: 'B1 坡道平面車位',
    description: '',
    owner_reason: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        community: initialData.community || '',
        address: initialData.address || '',
        price: initialData.price || 0,
        area: initialData.area || 0,
        building_age: initialData.building_age || 0,
        layout: initialData.layout || '',
        floor: initialData.floor || '',
        parking: initialData.parking || '',
        description: initialData.description || '',
        owner_reason: initialData.owner_reason || '',
      });
    } else {
      setFormData({
        title: '',
        community: '',
        address: '',
        price: 3200,
        area: 45.5,
        building_age: 8,
        layout: '3房2廳2衛',
        floor: '10F / 14F',
        parking: 'B1 坡道平面車位',
        description: '高樓層景觀採光通風好，格局方正，客餐廳空間大，雙衛浴開窗。',
        owner_reason: '屋主因換大坪數需資金調度，心態平和誠售，價格符合行情可立即談斡旋。',
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const unitPrice =
    formData.area > 0 && formData.price > 0
      ? (formData.price / formData.area).toFixed(1)
      : '0.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('請輸入案件名稱');
      return;
    }
    if (!formData.address.trim()) {
      setError('請輸入詳細地址');
      return;
    }
    if (formData.price <= 0) {
      setError('請輸入有效總價');
      return;
    }
    if (formData.area <= 0) {
      setError('請輸入有效坪數');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || '儲存失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialData ? '編輯案件資料' : '新增不動產案件'}
              </h3>
              <p className="text-xs text-slate-400">
                建檔後可隨時使用 20 年顧問視角進行 AI 案件剖析與行銷文案生成
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Community */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                案件標題 / 行銷名稱 <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：大安森林公園景觀首排四房"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                社區名稱 (選填)
              </label>
              <input
                type="text"
                value={formData.community}
                onChange={(e) => setFormData({ ...formData, community: e.target.value })}
                placeholder="例如：首泰信義、橋峰、由鉅大恆"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              地址 <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="例如：台北市大安區信義路三段 147 號"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Price, Area, Unit Price & Building Age */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                售價 (萬) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white font-semibold focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                總坪數 (坪) <span className="text-amber-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                min={0.1}
                value={formData.area || ''}
                onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white font-semibold focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                預估單價 (自動算)
              </label>
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-sm text-amber-400 font-bold">
                {unitPrice} <span className="text-[11px] font-normal text-slate-400">萬/坪</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                屋齡 (年)
              </label>
              <input
                type="number"
                min={0}
                value={formData.building_age || ''}
                onChange={(e) => setFormData({ ...formData, building_age: Number(e.target.value) })}
                placeholder="0表示預售/新成"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Layout, Floor, Parking */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                格局 (室廳衛)
              </label>
              <input
                type="text"
                value={formData.layout}
                onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                placeholder="例如：3房2廳2衛"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                樓層
              </label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="例如：12F / 24F"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                車位規格
              </label>
              <input
                type="text"
                value={formData.parking}
                onChange={(e) => setFormData({ ...formData, parking: e.target.value })}
                placeholder="例如：B1 坡道平面車位"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              屋況現況與主要特色 (description)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="說明裝潢現況、公設景觀、管理品質、採光通風、知名建商等..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Owner Reason (CRITICAL FOR 20-YEAR REAL ESTATE CONSULTANT) */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-bold text-amber-300">
                屋主售屋動機 / 心態與議價彈性 (owner_reason)
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              這是 20 年不動產顧問進行「抗性破解、談判策略與下一步行動建議」的核心關鍵資訊！
            </p>
            <textarea
              rows={2}
              value={formData.owner_reason}
              onChange={(e) => setFormData({ ...formData, owner_reason: e.target.value })}
              placeholder="例如：屋主移民海外誠售、小換大資金缺口、台商資產調度、急售或心態堅定等..."
              className="w-full bg-slate-900 border border-amber-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
            >
              {loading ? (
                <span>儲存中...</span>
              ) : (
                <span>{initialData ? '更新案件' : '儲存案件'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
