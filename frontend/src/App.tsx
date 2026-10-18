import React, { useEffect } from 'react';
import { useUiStore } from './store/useUiStore';
import { useQueryClient } from '@tanstack/react-query';
import { localDb } from './services/mockDb';
import { useAuthStore } from './store/useAuthStore';
import { isSupabaseConfigured } from './services/supabaseClient';
import { subscribeRealtime } from './services/supabaseData';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ImpersonationBanner } from './components/ImpersonationBanner';
import { CommandPalette } from './components/CommandPalette';
import { Toasts } from './components/Toasts';

// Modals
import { UploadDrawingModal } from './components/UploadDrawingModal';
import { NewProjectModal } from './components/NewProjectModal';
import { AddClientModal } from './components/AddClientModal';
import { ResetPinModal } from './components/ResetPinModal';
import { ManageAccessModal } from './components/ManageAccessModal';
import { SendNotificationModal } from './components/SendNotificationModal';
import { VectorLightbox } from './components/VectorLightbox';
import { SiteLogDrawer } from './components/SiteLogDrawer';
import { ProcessingLogsModal } from './components/ProcessingLogsModal';

// Views
import { DashboardView } from './views/DashboardView';
import { CustomersView } from './views/CustomersView';
import { ProjectsView } from './views/ProjectsView';
import { DrawingsView } from './views/DrawingsView';
import { DocumentsSpecsView } from './views/DocumentsSpecsView';
import { WorkSiteUpdatesView } from './views/WorkSiteUpdatesView';
import { UploadStudioView } from './views/UploadStudioView';
import { SettingsView } from './views/SettingsView';
import { ClientPortalView } from './views/ClientPortalView';
import { AuthView } from './views/AuthView';

export const App: React.FC = () => {
  const { activeWorkspace: storedWorkspace, currentView } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const queryClient = useQueryClient();

  // Customers can never leave the client workspace, whatever the UI state says.
  const activeWorkspace = user?.role === 'client' ? 'client' : storedWorkspace;

  // Listen to realtime / localDb changes across tabs
  useEffect(() => {
    const unsubscribe = localDb.onUpdate(() => {
      queryClient.invalidateQueries();
    });
    return () => unsubscribe();
  }, [queryClient]);

  // Live updates from Supabase: uploads and changes appear without a refresh
  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    return subscribeRealtime(() => queryClient.invalidateQueries());
  }, [queryClient, user]);

  if (authLoading) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-surface-1)' }} />;
  }

  if (!user) {
    return <AuthView />;
  }

  const renderActiveView = () => {
    if (activeWorkspace === 'client') {
      return <ClientPortalView />;
    }

    switch (currentView) {
      case 'overview':
        return <DashboardView />;
      case 'customers':
        return <CustomersView />;
      case 'projects':
        return <ProjectsView />;
      case 'drawings':
        return <DrawingsView />;
      case 'documents':
        return <DocumentsSpecsView />;
      case 'work-site':
        return <WorkSiteUpdatesView />;
      case 'upload-studio':
        return <UploadStudioView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-shell">
      <ImpersonationBanner />
      <Header />

      <div className="app-body">
        {activeWorkspace === 'admin' && <Sidebar />}

        <main className="main-viewport">
          {renderActiveView()}
        </main>
      </div>

      {/* Modals & Overlays */}
      {user.role === 'admin' && (
        <>
          <UploadDrawingModal />
          <NewProjectModal />
          <AddClientModal />
          <ResetPinModal />
          <ManageAccessModal />
          <SendNotificationModal />
        </>
      )}
      <VectorLightbox />
      <SiteLogDrawer />
      {user.role === 'admin' && (
        <>
          <ProcessingLogsModal />
          <CommandPalette />
        </>
      )}
      <Toasts />
    </div>
  );
};
