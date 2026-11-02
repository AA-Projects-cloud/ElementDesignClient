import { Capacitor } from '@capacitor/core';

/**
 * Push notifications to phones (Android / iOS app), delivered even when the app is closed.
 * Uses OneSignal. Each signed-in person is registered under their account id, so the database
 * can address a notification to exactly one customer or to all admins.
 * Does nothing in the browser, or until VITE_ONESIGNAL_APP_ID is set.
 */
const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;

let sdk: any = null;
let started = false;

const load = async () => {
  if (!APP_ID || !Capacitor.isNativePlatform()) return null;
  if (!sdk) sdk = (await import('onesignal-cordova-plugin')).default;
  if (!started) {
    sdk.initialize(APP_ID);
    started = true;
  }
  return sdk;
};

export const pushService = {
  /** Call after sign-in: links this phone to the account and asks permission to show notifications. */
  async register(userId: string) {
    try {
      const os = await load();
      if (!os) return;
      os.login(userId);
      await os.Notifications.requestPermission(true);
    } catch (err) {
      console.warn('Push registration failed', err);
    }
  },

  /** Call on sign-out: this phone stops receiving that person's notifications. */
  async unregister() {
    try {
      const os = await load();
      os?.logout();
    } catch {
      /* ignore */
    }
  },
};
