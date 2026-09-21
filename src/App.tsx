import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer, ToastMessage } from './components/Toast';
import { PropertyModal } from './components/PropertyModal';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { StoresManagementPage } from './pages/StoresManagementPage';
import { AiToolsManagementPage } from './pages/AiToolsManagementPage';
import { AiStudioPage } from './pages/AiStudioPage';
import { AiHistoryPage } from './pages/AiHistoryPage';
import { DataImportCenterPage } from './pages/DataImportCenterPage';
import { MarketingStudioPage } from './pages/MarketingStudioPage';
import { authService } from './services/authService';
import { propertyService } from './services/propertyService';
import { User } from './models/user';
import { Property, PropertyFormData } from './models/property';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Property modal state
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Deep-linking parameters to AI Studio & Marketing Studio
  const [aiStudioTargetPropertyId, setAiStudioTargetPropertyId] = useState<string | undefined>();
  const [aiStudioTargetToolCode, setAiStudioTargetToolCode] = useState<string | undefined>();
  const [marketingTargetPropertyId, setMarketingTargetPropertyId] = useState<string | undefined>();

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    // Initial session check
    authService.checkSession().finally(() => {
      setIsAuthInitializing(false);
    });

    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Enforce role-based access guard on current tab
  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.role;

    if (role === 'agent' && (currentTab === 'users' || currentTab === 'stores' || currentTab === 'ai-tools')) {
      setCurrentTab('dashboard');
    } else if (role === 'manager' && (currentTab === 'stores' || currentTab === 'ai-tools')) {
      setCurrentTab('dashboard');
    }
  }, [currentUser, currentTab]);

  const handleLogout = async () => {
    await authService.logout();
    addToast('您已安全登出工作平台 (Session 已清除)', 'info');
  };

  const handleSaveProperty = async (formData: PropertyFormData) => {
    try {
      if (editingProperty) {
        await propertyService.updateProperty(editingProperty.id, formData);
        addToast('案件更新成功！', 'success');
      } else {
        const created = await propertyService.createProperty(formData);
        addToast(`案件「${created.title}」已成功建檔！`, 'success');
      }
      setEditingProperty(null);
      setIsPropertyModalOpen(false);
    } catch (err: any) {
      addToast(err.message || '儲存失敗', 'error');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (window.confirm('確定要刪除這筆案件嗎？')) {
      try {
        await propertyService.deleteProperty(id);
        addToast('案件已刪除', 'info');
      } catch (err: any) {
        addToast(err.message || '刪除失敗', 'error');
      }
    }
  };

  const handleStartAnalysis = (property: Property) => {
    setAiStudioTargetPropertyId(property.id);
    setAiStudioTargetToolCode('property_analysis');
    setCurrentTab('ai-studio');
  };

  const handleStartMarketing = (property: Property) => {
    setMarketingTargetPropertyId(property.id);
    setCurrentTab('marketing-studio');
  };

  // Auth initializing screen
  if (isAuthInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">驗證系統安全憑證中...</p>
      </div>
    );
  }

  // If not logged in, render the protected login page
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          addToast('登入成功，歡迎回到房仲 AI 工作平台！', 'success');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Responsive Left Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onAddProperty={() => {
            setEditingProperty(null);
            setIsPropertyModalOpen(true);
          }}
          onQuickAi={() => {
            setAiStudioTargetPropertyId(undefined);
            setAiStudioTargetToolCode('property_analysis');
            setCurrentTab('ai-studio');
          }}
        />

        <main className="flex-1 pb-16">
          {currentTab === 'dashboard' && (
            <DashboardPage
              currentUser={currentUser}
              onNavigateToProperties={() => setCurrentTab('properties')}
              onNavigateToAiStudio={(propId, toolCode) => {
                setAiStudioTargetPropertyId(propId);
                setAiStudioTargetToolCode(toolCode || 'property_analysis');
                setCurrentTab('ai-studio');
              }}
              onNavigateToMarketingStudio={(propId) => {
                setMarketingTargetPropertyId(propId);
                setCurrentTab('marketing-studio');
              }}
              onNavigateToAiHistory={() => setCurrentTab('ai-history')}
              onAddProperty={() => {
                setEditingProperty(null);
                setIsPropertyModalOpen(true);
              }}
              onEditProperty={(prop) => {
                setEditingProperty(prop);
                setIsPropertyModalOpen(true);
              }}
              onDeleteProperty={handleDeleteProperty}
            />
          )}

          {currentTab === 'marketing-studio' && (
            <MarketingStudioPage
              currentUser={currentUser}
              initialPropertyId={marketingTargetPropertyId}
              onShowToast={addToast}
              onNavigateToProperties={() => setCurrentTab('properties')}
            />
          )}

          {currentTab === 'properties' && (
            <PropertiesPage
              onAnalyze={handleStartAnalysis}
              onMarketing={handleStartMarketing}
              onShowToast={addToast}
            />
          )}

          {currentTab === 'imports' && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
              <DataImportCenterPage
                currentUser={currentUser}
                onNavigateToProperties={(propertyId) => {
                  setCurrentTab('properties');
                }}
              />
            </div>
          )}

          {currentTab === 'users' && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
              <UsersManagementPage currentUser={currentUser} />
            </div>
          )}

          {currentTab === 'stores' && currentUser.role === 'admin' && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
              <StoresManagementPage />
            </div>
          )}

          {currentTab === 'ai-tools' && currentUser.role === 'admin' && (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
              <AiToolsManagementPage />
            </div>
          )}

          {currentTab === 'ai-studio' && (
            <AiStudioPage
              initialPropertyId={aiStudioTargetPropertyId}
              initialToolCode={aiStudioTargetToolCode}
              onShowToast={addToast}
              onViewHistory={() => setCurrentTab('ai-history')}
            />
          )}

          {currentTab === 'ai-history' && (
            <AiHistoryPage
              onShowToast={addToast}
              onNavigateToStudio={() => {
                setAiStudioTargetPropertyId(undefined);
                setAiStudioTargetToolCode('property_analysis');
                setCurrentTab('ai-studio');
              }}
            />
          )}
        </main>
      </div>

      {/* Global Property Add/Edit Modal */}
      <PropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onSubmit={handleSaveProperty}
        initialData={editingProperty}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
