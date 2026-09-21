import React from 'react';
import { Menu, Plus, Sparkles, ShieldCheck } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onAddProperty: () => void;
  onQuickAi: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onAddProperty,
  onQuickAi,
}) => {
  const getTabInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: '總覽儀表板 (Dashboard)',
          description: '即時掌握在庫案件、坪價指標與 AI 顧問診斷概況',
        };
      case 'properties':
        return {
          title: '案件管理',
          description: '依身分嚴格隔離之案件庫（經紀人個人 / 店長門店 / 管理員全國）',
        };
      case 'marketing-studio':
        return {
          title: 'AI 行銷工作室',
          description: '自動讀取物件資料與 20 年顧問分析，生成 Facebook、LINE、短影音、口播與標題',
        };
      case 'imports':
        return {
          title: '外部資料匯入中心',
          description: '公開網站網址智慧讀取、SSRF 安全防護、AI 結構化萃取與人工確認預覽建檔',
        };
      case 'users':
        return {
          title: '使用者權限管理',
          description: '管理帳號身分、門店歸屬、啟用與停用狀態',
        };
      case 'stores':
        return {
          title: '門店分行管理',
          description: '維護品牌分店、獨立門店代碼與營運狀態',
        };
      case 'ai-tools':
        return {
          title: 'AI 工具與模型配置',
          description: '管理 20 年實戰顧問 System Prompt 與模型參數',
        };
      case 'ai-studio':
        return {
          title: 'AI 實戰工作室',
          description: '20年資深不動產顧問深度案件剖析 & 多通路行銷文案生成',
        };
      case 'ai-history':
        return {
          title: 'AI 使用紀錄庫',
          description: '已儲存之 ai_runs 顧問診斷報告與行銷文案存檔',
        };
      default:
        return {
          title: '房仲 AI 工作平台',
          description: '不動產顧問實戰系統',
        };
    }
  };

  const { title, description } = getTabInfo();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="開啟選單"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h2>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 font-medium">
              <ShieldCheck className="w-3 h-3" />
              RBAC 鑑權防護中
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">{description}</p>
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-2">
        <button
          id="header-quick-ai-btn"
          onClick={onQuickAi}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-all shadow-xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xs:inline">AI 案件分析</span>
          <span className="xs:hidden">AI 分析</span>
        </button>

        <button
          id="header-add-property-btn"
          onClick={onAddProperty}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>新增案件</span>
        </button>
      </div>
    </header>
  );
};
