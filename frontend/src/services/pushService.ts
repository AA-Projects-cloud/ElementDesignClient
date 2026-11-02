import { Capacitor } from '@capacitor/core';

/**
 * Push notifications, delivered even when the app / website is closed.
 *  - Installed Android / iOS app: native push (OneSignal Cordova plugin)
 *  - Website in a browser (Chrome on Android, desktop): web push (OneSignal web SDK)
 * Each signed-in person is registered under their account id, so the database can address a
 * notification to exactly one customer, or to all admins.
 * Does nothing until VITE_ONESIGNAL_APP_ID is set.
 */
const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;

let nativeSdk: any = null;
let nativeStarted = false;
let webSdk: any = null;
let webStarted: Promise<void> | null = null;

const loadNative = async () => {
  if (!nativeSdk) nativeSdk = (await import('onesignal-cordova-plugin')).default;
  if (!nativeStarted) {
    nativeSdk.initialize(APP_ID);
    nativeStarted = true;
  }
  return nativeSdk;
};

const loadWeb = async () => {
  if (!webSdk) webSdk = (await import('react-onesignal')).default;
  if (!webStarted) {
    webStarted = webSdk.init({
      appId: APP_ID,
      serviceWorkerPath: 'OneSignalSDKWorker.js',
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false },
    });
  }
  await webStarted;
  return webSdk;
};

export const pushService = {
  /** Call after sign-in: links this device to the account and asks permission to show notifications. */
  async register(userId: string) {
    if (!APP_ID) return;
    try {
      if (Capacitor.isNativePlatform()) {
        const os = await loadNative();
        os.login(userId);
        await os.Notifications.requestPermission(true);
        return;
      }
      if (typeof window === 'undefined' || !window.isSecureContext || !('Notification' in window)) return;
      const os = await loadWeb();
      await os.login(userId);
      // Browsers only allow the permission question after a tap
      if (Notification.permission === 'default') {
        window.addEventListener('pointerdown', () => void os.Notifications.requestPermission(), { once: true });
      }
    } catch (err) {
      console.warn('Push registration failed', err);
    }
  },

  /** Call on sign-out: this device stops receiving that person's notifications. */
  async unregister() {
    if (!APP_ID) return;
    try {
      if (Capacitor.isNativePlatform()) {
        (await loadNative()).logout();
      } else if (webSdk) {
        await webSdk.logout();
      }
    } catch {
      /* ignore */
    }
  },
};
