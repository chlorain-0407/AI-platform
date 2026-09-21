import React, { useEffect, useState } from 'react';
import { Store, Plus, CheckCircle2, XCircle, RefreshCw, Hash, Calendar } from 'lucide-react';
import { Store as StoreModel } from '../models/user';
import { storeService, CreateStoreData } from '../services/storeService';

export const StoresManagementPage: React.FC = () => {
  const [stores, setStores] = useState<StoreModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState<CreateStoreData>({
    name: '',
    code: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadStores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storeService.getStores();
      setStores(data);
    } catch (err: any) {
      setError(err.message || '載入門店失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('請輸入門店名稱與唯一代碼');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await storeService.createStore(formData);
      setShowModal(false);
      setFormData({ name: '', code: '' });
      loadStores();
    } catch (err: any) {
      setFormError(err.message || '建立門店失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (st: StoreModel) => {
    try {
      await storeService.updateStore(st.id, { active: !st.active });
      setStores((prev) =>
        prev.map((s) => (s.id === st.id ? { ...s, active: !st.active } : s))
      );
    } catch (err: any) {
      alert(err.message || '更新門店狀態失敗');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Store className="w-6 h-6 text-amber-400" />
            <span>門店管理 (Stores)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            建立與管理品牌旗艦門店與各區分行，各門店案件與同仁資料受 RBAC 隔離保護
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStores}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            title="重新整理"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新增門店分行</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* Stores Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">載入門店資料中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((st) => (
            <div
              key={st.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {st.code}
                  </span>
                  {st.active ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> 營運中
                    </span>
                  ) : (
                    <span className="text-xs text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <XCircle className="w-3 h-3" /> 已停業
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white mb-1">{st.name}</h3>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>建立於 {new Date(st.createdAt).toLocaleDateString('zh-TW')}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
                  ID: {st.id}
                </span>
                <button
                  onClick={() => handleToggleActive(st)}
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  {st.active ? '設為停業' : '設為營運'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                <span>新增門店分行</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  門店名稱
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：台中七期旗艦店"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  門店代碼 (唯一英文數字)
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：TC001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {submitting ? '建立中...' : '確認新增門店'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
