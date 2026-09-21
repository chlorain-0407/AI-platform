import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Building,
  Mail,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Briefcase,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { User, Store, UserRole } from '../models/user';
import { userService, CreateUserData } from '../services/userService';
import { storeService } from '../services/storeService';

interface UsersManagementPageProps {
  currentUser: User | null;
}

interface RoleDefinition {
  code: UserRole;
  name: string;
  title: string;
  badgeClass: string;
  icon: React.ElementType;
  description: string;
  permissions: string[];
  recommendedStore: string;
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    code: 'admin',
    name: '系統管理員',
    title: '全系統最高管理權限',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: ShieldCheck,
    description: '具備全平台最高維運與管理權限，不受門店資料隔離限制。',
    permissions: [
      '管理全系統所有門店與帳號',
      '指派與調整同仁之角色權限與所屬門店',
      '隨時停用或重設任一帳號狀態',
      '跨門店檢視所有房屋案件與匯入記錄',
      '管理維護 AI 工具模型與系統提示詞',
    ],
    recommendedStore: '建議設定為「總部 / 全系統 (不設限單一門店)」',
  },
  {
    code: 'manager',
    name: '門店店長',
    title: '門店營運與團隊主管',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Briefcase,
    description: '管理指定門店營運，落實門店資料安全隔離與同仁業務督導。',
    permissions: [
      '檢視與管理該所屬門店所有經紀人名單',
      '查看該所屬門店全部經紀人建立的房產案件',
      '存取該門店所有 AI 深度剖析與文案歷史',
      '受門店隔離機制保護，無法存取其他分店資料',
    ],
    recommendedStore: '必須指派具體營業門店（例如：信義旗艦店）',
  },
  {
    code: 'agent',
    name: '房仲經紀人',
    title: '第一線實戰業務人員',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: UserCheck,
    description: '第一線房仲營業員，專注於個人案件開發、外部資料匯入與行銷文案。',
    permissions: [
      '建立、編輯與維護個人經紀之房地產案件',
      '使用外部資料匯入中心，從公開網址智慧轉錄物件',
      '使用 20 年顧問 AI 深度剖析案件優劣抗性與解方',
      '一鍵生成多渠道社群行銷文案（FB、LINE、IG、EDM）',
    ],
    recommendedStore: '建議指派所屬營業門店以利門店業績歸屬',
  },
];

export const UsersManagementPage: React.FC<UsersManagementPageProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignUser, setAssignUser] = useState<User | null>(null);

  // Role & Store Assignment form state
  const [assignRole, setAssignRole] = useState<UserRole>('agent');
  const [assignStoreId, setAssignStoreId] = useState<string>('');
  const [savingAssign, setSavingAssign] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // New user form state
  const [createFormData, setCreateFormData] = useState<CreateUserData>({
    name: '',
    email: '',
    password: '',
    role: 'agent',
    storeId: '',
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [uList, sList] = await Promise.all([
        userService.getUsers(),
        storeService.getStores().catch(() => []),
      ]);
      setUsers(uList);
      setStores(sList);
    } catch (err: any) {
      setError(err.message || '載入使用者列表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => {
      setSuccessBanner(null);
    }, 4500);
  };

  // Open the role & store assignment modal for a specific user
  const handleOpenAssignModal = (user: User) => {
    setAssignUser(user);
    setAssignRole(user.role);
    setAssignStoreId(user.storeId || '');
    setAssignError(null);
  };

  // Save the role & store assignment
  const handleSaveRoleAndStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUser) return;

    // Safety check: if editing self, cannot demote away from admin if last admin
    if (
      assignUser.id === currentUser?.id &&
      assignUser.role === 'admin' &&
      assignRole !== 'admin'
    ) {
      const otherAdmins = users.filter(
        (u) => u.role === 'admin' && u.id !== assignUser.id && u.active !== false
      );
      if (otherAdmins.length === 0) {
        setAssignError('系統中必須保留至少一位啟用的系統管理員，無法將自己的角色降級。');
        return;
      }
    }

    try {
      setSavingAssign(true);
      setAssignError(null);

      const targetStoreId = assignStoreId.trim() === '' ? null : assignStoreId;

      const updated = await userService.updateUser(assignUser.id, {
        role: assignRole,
        storeId: targetStoreId,
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === assignUser.id) {
            return {
              ...u,
              role: updated.role,
              storeId: updated.storeId,
              storeName: updated.storeName,
            };
          }
          return u;
        })
      );

      const roleObj = ROLE_DEFINITIONS.find((r) => r.code === assignRole);
      const assignedStoreName =
        stores.find((s) => s.id === targetStoreId)?.name ||
        (assignRole === 'admin' ? '總部 (全系統存取)' : '未指定門店');

      showNotification(
        `已成功將同仁「${assignUser.name}」指派為【${roleObj?.name || assignRole}】，所屬門店設為【${assignedStoreName}】！`
      );

      setAssignUser(null);
    } catch (err: any) {
      setAssignError(err.message || '變更角色與門店失敗');
    } finally {
      setSavingAssign(false);
    }
  };

  // Toggle user active status
  const handleToggleActive = async (user: User) => {
    const nextState = !user.active;
    const confirmMsg = nextState
      ? `確定要啟用同仁「${user.name}」的帳號嗎？`
      : `確定要停用同仁「${user.name}」的帳號嗎？\n停用後該同仁將立即無法登入系統。`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await userService.updateUser(user.id, { active: nextState });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: nextState } : u))
      );
      showNotification(
        `同仁「${user.name}」帳號已成功${nextState ? '重新啟用' : '停用'}。`
      );
    } catch (err: any) {
      alert(err.message || '更新狀態失敗');
    }
  };

  // Create new user submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name.trim() || !createFormData.email.trim() || !createFormData.password.trim()) {
      setCreateFormError('請完整填寫同仁姓名、登入信箱與密碼');
      return;
    }

    try {
      setSubmittingCreate(true);
      setCreateFormError(null);

      const storeIdPayload = createFormData.storeId ? createFormData.storeId : null;

      await userService.createUser({
        ...createFormData,
        storeId: storeIdPayload,
      });

      setShowCreateModal(false);
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        role: 'agent',
        storeId: '',
      });

      showNotification(`新同仁帳號「${createFormData.name}」建立成功！`);
      loadData();
    } catch (err: any) {
      setCreateFormError(err.message || '建立使用者失敗');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Format store display name
  const getStoreDisplayName = (storeId?: string, storeName?: string, role?: UserRole) => {
    if (storeName && storeName !== '未分配門店') return storeName;
    if (storeId) {
      const s = stores.find((st) => st.id === storeId);
      if (s) return s.code ? `${s.name} (${s.code})` : s.name;
    }
    if (role === 'admin') return '總部 (全系統存取)';
    return '未指定門店';
  };

  // Filter users based on query, role, and store
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    let matchesStore = true;
    if (storeFilter === 'all') {
      matchesStore = true;
    } else if (storeFilter === 'headquarters') {
      matchesStore = !u.storeId;
    } else {
      matchesStore = u.storeId === storeFilter;
    }

    return matchesSearch && matchesRole && matchesStore;
  });

  // Statistics
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const managerCount = users.filter((u) => u.role === 'manager').length;
  const agentCount = users.filter((u) => u.role === 'agent').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide">
                {isAdmin ? '系統成員角色權限與所屬門店管理' : '門店同仁與帳號名單'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {isAdmin
                  ? '系統管理員專屬：指定指派成員角色權限（管理員 / 店長 / 經紀人）與調動所屬門店'
                  : '檢視您所屬門店同仁名單（門店資料隔離防護生效中）'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60 flex items-center gap-1.5 text-xs font-semibold"
            title="重新整理資料"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">重新整理</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setCreateFormData({
                  name: '',
                  email: '',
                  password: '',
                  role: 'agent',
                  storeId: stores[0]?.id || '',
                });
                setCreateFormError(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>建立新同仁帳號</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm flex items-center justify-between shadow-lg shadow-emerald-950/40 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-1 rounded-md bg-emerald-900/40"
          >
            關閉
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 font-medium">系統總成員數</div>
          <div className="text-2xl font-black text-white mt-1">{users.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">跨部門全體帳號</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-rose-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>系統管理員</span>
          </div>
          <div className="text-2xl font-black text-rose-300 mt-1">{adminCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">具備全系統指派權限</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-amber-400 font-medium flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>門店店長</span>
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">{managerCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">門店營運與團隊管理</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>房仲經紀人</span>
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1">{agentCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">第一線物件開發與行銷</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜尋同仁姓名或登入電子信箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                roleFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              全部角色
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                roleFilter === 'admin'
                  ? 'bg-rose-500/20 text-rose-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              管理員
            </button>
            <button
              onClick={() => setRoleFilter('manager')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                roleFilter === 'manager'
                  ? 'bg-amber-500/20 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              店長
            </button>
            <button
              onClick={() => setRoleFilter('agent')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                roleFilter === 'agent'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              經紀人
            </button>
          </div>

          {/* Store Filter */}
          {isAdmin && (
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">所有門店篩選</option>
              <option value="headquarters">總部 / 未分配門店</option>
              {stores.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.code ? `(${st.code})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>同仁名冊列表</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30 font-mono">
              顯示 {filteredUsers.length} / {users.length} 位
            </span>
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            {isAdmin
              ? '點擊「指派角色與門店」即可即時調整同仁的職位與調撥門店歸屬'
              : '僅顯示您所屬門店之業務夥伴'}
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            <span>載入成員名冊中，請稍候...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-300">查無符合條件的同仁資料</p>
            <p className="text-xs text-slate-400 mt-1">請嘗試清除搜尋關鍵字或調整門店/角色篩選</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-xs font-semibold">
                  <th className="py-3.5 px-4 sm:px-6">同仁姓名 / 信箱</th>
                  <th className="py-3.5 px-4">指定角色權限</th>
                  <th className="py-3.5 px-4">所屬門店 (數據隔離)</th>
                  <th className="py-3.5 px-4">帳號狀態</th>
                  <th className="py-3.5 px-4">加入日期</th>
                  {isAdmin && <th className="py-3.5 px-4 text-right">權限指派與維運</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => {
                  const roleObj =
                    ROLE_DEFINITIONS.find((r) => r.code === u.role) || ROLE_DEFINITIONS[2];
                  const RoleIcon = roleObj.icon;
                  const isActive = u.active !== false;
                  const isCurrent = u.id === currentUser?.id;
                  const storeDisplayName = getStoreDisplayName(u.storeId, u.storeName, u.role);

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* Name and Email */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {u.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  目前登入
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleObj.badgeClass}`}
                        >
                          <RoleIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{roleObj.name}</span>
                        </span>
                      </td>

                      {/* Store */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-200">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span
                            className={`font-medium ${
                              !u.storeId && u.role === 'admin'
                                ? 'text-amber-400 font-semibold'
                                : !u.storeId
                                ? 'text-slate-400 italic'
                                : 'text-slate-200'
                            }`}
                          >
                            {storeDisplayName}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>正常啟用</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-medium">
                            <XCircle className="w-3 h-3" />
                            <span>已停用</span>
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('zh-TW') : '-'}
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Assign Role & Store Button */}
                            <button
                              onClick={() => handleOpenAssignModal(u)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-xs"
                              title="指派角色權限與所屬門店"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>指派權限 / 門店</span>
                            </button>

                            {/* Enable/Disable Button */}
                            <button
                              onClick={() => handleToggleActive(u)}
                              disabled={isCurrent}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                                isCurrent
                                  ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-400 border-slate-700'
                                  : isActive
                                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'
                                  : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                              }`}
                            >
                              {isActive ? '停用' : '啟用'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: 指派角色權限與所屬門店 (Assign Role & Store Modal) */}
      {/* ============================================================ */}
      {assignUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    指派同仁角色權限與所屬門店
                  </h2>
                  <p className="text-xs text-slate-400">
                    同仁：<span className="text-white font-semibold">{assignUser.name}</span> ({assignUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <form onSubmit={handleSaveRoleAndStore} className="flex-1 overflow-y-auto p-6 space-y-6">
              {assignError && (
                <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{assignError}</span>
                </div>
              )}

              {/* 1. 選擇角色權限 */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  步驟一：選擇角色權限 (Role & Permissions)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ROLE_DEFINITIONS.map((r) => {
                    const Icon = r.icon;
                    const isSelected = assignRole === r.code;

                    return (
                      <div
                        key={r.code}
                        onClick={() => setAssignRole(r.code)}
                        className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className={`p-2 rounded-xl ${
                                isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            {isSelected && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                                已選取
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-sm text-white mb-0.5">{r.name}</div>
                          <div className="text-[11px] text-amber-400/90 font-medium mb-2">
                            {r.title}
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed mb-3">
                            {r.description}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-800/80">
                          <div className="text-[10px] text-slate-400 font-semibold mb-1">
                            具備權限要點：
                          </div>
                          <ul className="space-y-1">
                            {r.permissions.slice(0, 2).map((perm, idx) => (
                              <li
                                key={idx}
                                className="text-[10px] text-slate-300 flex items-start gap-1"
                              >
                                <span className="text-amber-400 shrink-0">✓</span>
                                <span className="line-clamp-1">{perm}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. 指派所屬門店 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    步驟二：指派所屬門店 (Store Affiliation)
                  </label>
                  <span className="text-xs text-slate-400">
                    {assignRole === 'admin'
                      ? '系統管理員不受單一門店限制，可設為總部'
                      : '門店店長與經紀人建議明確歸屬分店'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      選擇指派門店
                    </label>
                    <select
                      value={assignStoreId}
                      onChange={(e) => setAssignStoreId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-amber-500 transition-colors"
                    >
                      <option value="">總部 / 全系統 (不設限單一營業門店)</option>
                      {stores.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} {st.code ? `[代碼: ${st.code}]` : ''}
                        </option>
                      ))}
                    </select>

                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        {assignRole === 'manager'
                          ? '門店店長權限將受此門店約束，僅能檢視該門店經紀人案件與數據。'
                          : assignRole === 'agent'
                          ? '經紀人建立之房產案件將自動歸屬至此門店，並納入門店業務報表。'
                          : '系統管理員具備跨門店總覽特權，設為總部可無障礙穿透各分店。'}
                      </span>
                    </p>
                  </div>

                  {/* Quick Store Selection Chips */}
                  <div>
                    <div className="text-xs text-slate-400 mb-1.5">快捷點選已註冊門店：</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setAssignStoreId('')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          assignStoreId === ''
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        總部 (全系統存取)
                      </button>
                      {stores.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setAssignStoreId(st.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            assignStoreId === st.id
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {st.name} {st.code ? `(${st.code})` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssignUser(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={savingAssign}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {savingAssign ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>正在套用指派...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>確認指派並儲存變更</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: 建立新同仁帳號 (Create User Modal) */}
      {/* ============================================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <span>建立新同仁帳號</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {createFormError && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{createFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  同仁真實姓名 <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：陳國華"
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, name: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  登入電子信箱 (系統唯一帳號) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="agent.chen@realestate.com.tw"
                  value={createFormData.email}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, email: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  登入初始密碼 (將自動以 Bcrypt 安全加密儲存) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="請設定至少6位數初始密碼"
                  value={createFormData.password}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, password: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    指定初始角色權限
                  </label>
                  <select
                    value={createFormData.role}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        role: e.target.value as UserRole,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="agent">房仲經紀人 (agent)</option>
                    <option value="manager">門店店長 (manager)</option>
                    <option value="admin">系統管理員 (admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    指定所屬門店
                  </label>
                  <select
                    value={createFormData.storeId || ''}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, storeId: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="">總部 (全系統存取)</option>
                    {stores.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.code ? `(${st.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {submittingCreate ? '建立中...' : '確認建立帳號'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
