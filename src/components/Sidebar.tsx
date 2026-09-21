import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Sparkles,
  History,
  LogOut,
  Building,
  ChevronRight,
  X,
  Users,
  Store,
  Sliders,
  ShieldCheck,
  Briefcase,
  User as UserIcon,
  Globe,
  Share2,
} from 'lucide-react';
import { User } from '../models/user';

export type NavTab =
  | 'dashboard'
  | 'properties'
  | 'imports'
  | 'marketing-studio'
  | 'ai-studio'
  | 'ai-history'
  | 'users'
  | 'stores'
  | 'ai-tools';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User | null;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  const role = currentUser?.role || 'agent';

  // Build role-specific navigation list
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label:
        role === 'admin'
          ? '系統 Dashboard'
          : role === 'manager'
          ? '門店 Dashboard'
          : '個人 Dashboard',
      subLabel:
        role === 'admin'
          ? '全組織即時數據'
          : role === 'manager'
          ? '門店業務與案件'
          : '個人業績與案件',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'agent'],
    },
    {
      id: 'properties' as NavTab,
      label:
        role === 'admin'
          ? '所有案件'
          : role === 'manager'
          ? '門店案件'
          : '我的案件',
      subLabel:
        role === 'admin'
          ? '全國庫存總覽'
          : role === 'manager'
          ? '門店房源庫'
          : '個人負責案件',
      icon: Building2,
      roles: ['admin', 'manager', 'agent'],
    },
    {
      id: 'marketing-studio' as NavTab,
      label: 'AI 行銷工作室',
      subLabel: '五大社群影音行銷生成',
      icon: Share2,
      roles: ['admin', 'manager', 'agent'],
      badge: '最新模組',
    },
    {
      id: 'imports' as NavTab,
      label: '資料匯入',
      subLabel: '外部資料匯入中心',
      icon: Globe,
      roles: ['admin', 'manager', 'agent'],
      badge: '新功能',
    },
    {
      id: 'users' as NavTab,
      label: role === 'admin' ? '使用者管理' : '門店成員',
      subLabel: role === 'admin' ? '帳號權限與狀態' : '門店經紀人名單',
      icon: Users,
      roles: ['admin', 'manager'],
      badge: role === 'admin' ? '管理員' : '店長',
    },
    {
      id: 'stores' as NavTab,
      label: '門店管理',
      subLabel: '分行資訊與代碼',
      icon: Store,
      roles: ['admin'],
      badge: '管理員',
    },
    {
      id: 'ai-studio' as NavTab,
      label: 'AI 工作室',
      subLabel: '20年顧問剖析與文案',
      icon: Sparkles,
      roles: ['admin', 'manager', 'agent'],
      badge: '實戰智囊',
    },
    {
      id: 'ai-tools' as NavTab,
      label: 'AI 工具管理',
      subLabel: 'Prompt 與模型配置',
      icon: Sliders,
      roles: ['admin'],
      badge: '系統設定',
    },
    {
      id: 'ai-history' as NavTab,
      label:
        role === 'admin'
          ? '全組織 AI 紀錄'
          : role === 'manager'
          ? '門店 AI 紀錄'
          : 'AI 使用紀錄',
      subLabel: '歷史產出與洞察庫',
      icon: History,
      roles: ['admin', 'manager', 'agent'],
    },
  ].filter((item) => item.roles.includes(role));

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const getRoleBadge = () => {
    if (role === 'admin') {
      return {
        label: '系統管理員',
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        icon: ShieldCheck,
      };
    }
    if (role === 'manager') {
      return {
        label: '門店店長',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        icon: Building,
      };
    }
    return {
      label: '經紀人',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Briefcase,
    };
  };

  const badge = getRoleBadge();
  const RoleIcon = badge.icon;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Building className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                房仲 AI 工作平台
              </h1>
              <p className="text-xs text-slate-400 font-medium">不動產顧問實戰系統</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>系統功能選單</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.color} flex items-center gap-1`}>
              <RoleIcon className="w-3 h-3" />
              {badge.label}
            </span>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 font-medium border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold tracking-wide flex items-center gap-1.5 truncate">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{item.subLabel}</div>
                  </div>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          {currentUser ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{currentUser.name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="text-xs text-slate-400 truncate flex items-center gap-1">
                  <Store className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{currentUser.storeName || (role === 'admin' ? '總部營運中心' : '所屬門店')}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                  {currentUser.email}
                </div>
              </div>
              <button
                id="sidebar-logout-btn"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-rose-300 hover:bg-rose-950/30 transition-colors border border-slate-700/60 hover:border-rose-900/40 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                登出帳號 (清除 Session)
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-2">尚未登入</div>
          )}
        </div>
      </aside>
    </>
  );
};
