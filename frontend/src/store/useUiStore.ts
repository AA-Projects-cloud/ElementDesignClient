import { create } from 'zustand';
import type { MediaType } from '../services/fileStorageService';

export interface LightboxMedia {
  path: string;
  mediaType: MediaType;
  fileName?: string;
  prevPath?: string;
  prevMediaType?: MediaType;
  prevRevNo?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
  undoAction?: () => void;
}

interface UiState {
  activeWorkspace: 'admin' | 'client';
  currentView: 'overview' | 'customers' | 'projects' | 'drawings' | 'documents' | 'work-site' | 'upload-studio' | 'settings';
  selectedClientId: string;
  isImpersonating: boolean;
  toasts: ToastItem[];

  // Modal States
  uploadModalOpen: boolean;
  newProjectModalOpen: boolean;
  addClientModalOpen: boolean;
  processingLogsModalOpen: boolean;
  commandPaletteOpen: boolean;
  lightboxState: {
    isOpen: boolean;
    sheetCode: string;
    title: string;
    revNo: string;
    isRedlineDiff: boolean;
    media?: LightboxMedia;
  };
  siteLogDrawerState: {
    isOpen: boolean;
    logId: string | null;
  };
  resetPinModalState: {
    isOpen: boolean;
    pin: string | null;
    clientName: string | null;
  };
  manageAccessModalState: {
    isOpen: boolean;
    clientId: string | null;
  };
  sendNotificationModalState: {
    isOpen: boolean;
    clientId: string | null;
  };

  // Actions
  setActiveWorkspace: (ws: 'admin' | 'client') => void;
  setCurrentView: (view: UiState['currentView']) => void;
  setSelectedClientId: (id: string) => void;
  startImpersonation: (clientId: string) => void;
  stopImpersonation: () => void;
  
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openNewProjectModal: () => void;
  closeNewProjectModal: () => void;
  openAddClientModal: () => void;
  closeAddClientModal: () => void;
  openProcessingLogsModal: () => void;
  closeProcessingLogsModal: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  openLightbox: (sheetCode: string, title: string, revNo: string, isRedline?: boolean, media?: LightboxMedia) => void;
  closeLightbox: () => void;
  toggleRedlineInLightbox: () => void;

  openSiteLogDrawer: (logId: string) => void;
  closeSiteLogDrawer: () => void;

  openResetPinModal: (pin: string, clientName: string) => void;
  closeResetPinModal: () => void;

  openManageAccessModal: (clientId: string) => void;
  closeManageAccessModal: () => void;

  openSendNotificationModal: (clientId: string) => void;
  closeSendNotificationModal: () => void;

  addToast: (message: string, type?: 'info' | 'success' | 'error', undoAction?: () => void) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  activeWorkspace: 'admin',
  currentView: 'overview',
  selectedClientId: '',
  isImpersonating: false,
  toasts: [],

  uploadModalOpen: false,
  newProjectModalOpen: false,
  addClientModalOpen: false,
  processingLogsModalOpen: false,
  commandPaletteOpen: false,

  lightboxState: {
    isOpen: false,
    sheetCode: '',
    title: '',
    revNo: '',
    isRedlineDiff: false,
  },

  siteLogDrawerState: {
    isOpen: false,
    logId: null,
  },

  resetPinModalState: {
    isOpen: false,
    pin: null,
    clientName: null,
  },

  manageAccessModalState: {
    isOpen: false,
    clientId: null,
  },

  sendNotificationModalState: {
    isOpen: false,
    clientId: null,
  },

  setActiveWorkspace: (ws) => set({ activeWorkspace: ws }),
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedClientId: (id) => set({ selectedClientId: id }),

  startImpersonation: (clientId) =>
    set({
      selectedClientId: clientId,
      activeWorkspace: 'client',
      isImpersonating: true,
    }),

  stopImpersonation: () =>
    set({
      activeWorkspace: 'admin',
      isImpersonating: false,
      currentView: 'customers',
    }),

  openUploadModal: () => set({ uploadModalOpen: true }),
  closeUploadModal: () => set({ uploadModalOpen: false }),

  openNewProjectModal: () => set({ newProjectModalOpen: true }),
  closeNewProjectModal: () => set({ newProjectModalOpen: false }),

  openAddClientModal: () => set({ addClientModalOpen: true }),
  closeAddClientModal: () => set({ addClientModalOpen: false }),

  openProcessingLogsModal: () => set({ processingLogsModalOpen: true }),
  closeProcessingLogsModal: () => set({ processingLogsModalOpen: false }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  openLightbox: (sheetCode, title, revNo, isRedline = false, media) =>
    set({
      lightboxState: {
        isOpen: true,
        sheetCode,
        title,
        revNo,
        isRedlineDiff: isRedline,
        media,
      },
    }),

  closeLightbox: () =>
    set((state) => ({
      lightboxState: { ...state.lightboxState, isOpen: false },
    })),

  toggleRedlineInLightbox: () =>
    set((state) => ({
      lightboxState: {
        ...state.lightboxState,
        isRedlineDiff: !state.lightboxState.isRedlineDiff,
      },
    })),

  openSiteLogDrawer: (logId) =>
    set({
      siteLogDrawerState: { isOpen: true, logId },
    }),

  closeSiteLogDrawer: () =>
    set({
      siteLogDrawerState: { isOpen: false, logId: null },
    }),

  openResetPinModal: (pin, clientName) =>
    set({
      resetPinModalState: { isOpen: true, pin, clientName },
    }),

  closeResetPinModal: () =>
    set({
      resetPinModalState: { isOpen: false, pin: null, clientName: null },
    }),

  openManageAccessModal: (clientId) =>
    set({
      manageAccessModalState: { isOpen: true, clientId },
    }),

  closeManageAccessModal: () =>
    set({
      manageAccessModalState: { isOpen: false, clientId: null },
    }),

  openSendNotificationModal: (clientId) =>
    set({
      sendNotificationModalState: { isOpen: true, clientId },
    }),

  closeSendNotificationModal: () =>
    set({
      sendNotificationModalState: { isOpen: false, clientId: null },
    }),

  addToast: (message, type = 'info', undoAction) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, message, type, undoAction };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    setTimeout(() => {
      get().removeToast(id);
    }, undoAction ? 6000 : 3500);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
