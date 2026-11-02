import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useUiStore } from '../store/useUiStore';
import { useAuthStore } from '../store/useAuthStore';
import { runBackHandlers } from '../services/backStack';

/**
 * Makes the phone's back button / back swipe work inside the app:
 *   1. closes the top pop-up, 2. closes an open menu / form step, 3. goes back to the previous screen,
 * and only when there is nothing left to go back to does the app close (or the browser go back).
 */
export const useBackNavigation = () => {
  const viewStack = useRef<string[]>([]);
  const popping = useRef(false);

  // Remember the screens the person has visited
  useEffect(() => {
    let prev = useUiStore.getState().currentView;
    return useUiStore.subscribe((s) => {
      if (s.currentView !== prev) {
        if (!popping.current) viewStack.current.push(prev);
        prev = s.currentView;
      }
    });
  }, []);

  useEffect(() => {
    /** Returns true when the back press was used inside the app. */
    const handleBack = (): boolean => {
      // 1. an open pop-up (they all close when their dark backdrop is tapped)
      const overlays = document.querySelectorAll<HTMLElement>('.modal-overlay.active');
      if (overlays.length) {
        overlays[overlays.length - 1].click();
        return true;
      }
      // 2. menus and form steps that registered themselves
      if (runBackHandlers()) return true;

      const user = useAuthStore.getState().user;
      if (!user) return false;
      const ui = useUiStore.getState();

      // 3. screen navigation
      if (ui.isImpersonating) {
        ui.stopImpersonation();
        return true;
      }
      if (user.role === 'admin') {
        if (ui.activeWorkspace === 'client') {
          ui.setActiveWorkspace('admin');
          return true;
        }
        const previous = viewStack.current.pop();
        popping.current = true;
        try {
          if (previous) {
            ui.setCurrentView(previous as typeof ui.currentView);
            return true;
          }
          if (ui.currentView !== 'overview') {
            ui.setCurrentView('overview');
            return true;
          }
        } finally {
          popping.current = false;
        }
      }
      return false;
    };

    // Installed app (Android): the hardware back button and the back gesture
    if (Capacitor.isNativePlatform()) {
      let remove: (() => void) | undefined;
      void CapacitorApp.addListener('backButton', () => {
        if (!handleBack()) void CapacitorApp.exitApp();
      }).then((h) => {
        remove = () => void h.remove();
      });
      return () => remove?.();
    }

    // Website on a phone / computer: keep one spare history entry so "back" stays inside the app
    window.history.pushState({ elementDesign: true }, '');
    const onPop = () => {
      if (handleBack()) {
        window.history.pushState({ elementDesign: true }, '');
      } else {
        window.history.back(); // nothing left in the app: leave as the browser normally would
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
};
