import React, { useState } from 'react';
import { Building, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, User, Briefcase, Key } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const TEST_ACCOUNTS = [
  {
    role: 'admin' as const,
    roleLabel: '全系統管理員',
    name: '王總監',
    store: '總部營運中心 (全視角)',
    email: 'admin@realestate.com.tw',
    password: 'password123',
    badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    icon: ShieldCheck,
  },
  {
    role: 'manager' as const,
    roleLabel: '大安旗艦店店長',
    name: '陳信宏',
    store: '台北大安旗艦店 (門店視角)',
    email: 'manager.daan@realestate.com.tw',
    password: 'password123',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    icon: Building,
  },
  {
    role: 'agent' as const,
    roleLabel: '大安店業務 A',
    name: '王晨峰',
    store: '台北大安旗艦店 (個人視角)',
    email: 'agent.wang@realestate.com.tw',
    password: 'password123',
    badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    icon: Briefcase,
  },
  {
    role: 'agent' as const,
    roleLabel: '新板店業務 B',
    name: '林芷妤',
    store: '新北新板特區店 (個人視角)',
    email: 'agent.lin@realestate.com.tw',
    password: 'password123',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    icon: User,
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@realestate.com.tw');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('請輸入電子信箱與密碼');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await authService.login({ email: email.trim(), password });
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || '登入失敗，請確認帳號密碼');
    } finally {
      setLoading(false);
    }
  };

  const selectAccount = async (acc: typeof TEST_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    try {
      setLoading(true);
      setError(null);
      await authService.login({ email: acc.email, password: acc.password });
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-slate-950">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 mb-3">
            <Building className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            房仲 AI 工作平台
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 font-medium">
            不動產顧問實戰智囊 · 嚴格角色權限隔離 (RBAC)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">使用者登入</h2>
              <p className="text-xs text-slate-400">使用 HttpOnly 安全 Cookie 認證，無 Token 外洩風險</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>後端即時鑑權</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-xs text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                電子信箱 (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@realestate.com.tw"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                密碼 (Password)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>登入驗證中...</span>
              ) : (
                <>
                  <span>安全登入進入系統</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                一鍵切換 4 組測試帳號 (密碼預設 password123)
              </span>
              <span className="text-[11px] text-slate-400">點擊直接登入</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TEST_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => selectAccount(acc)}
                    className="p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400" />
                        {acc.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${acc.badgeColor}`}>
                        {acc.roleLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{acc.store}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{acc.email}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Feature Checklist */}
        <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            Bcrypt 密碼雜湊
          </span>
          <span>·</span>
          <span>HttpOnly Cookie</span>
          <span>·</span>
          <span>防水平/垂直越權</span>
          <span>·</span>
          <span>門店/個人資料完全隔離</span>
        </div>
      </div>
    </div>
  );
};
