// Native (Capacitor) integration. Every export is a safe no-op on the web build,
// so the same bundle runs identically in the browser and inside the iOS/Android shell.
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabaseClient';

export const isNative = () => Capacitor.isNativePlatform();

/** Splash + status bar polish. Called once at app startup. */
export async function initNativeUI() {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light }); // dark icons on light app bg
  } catch (e) { /* status bar not critical */ }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (e) { /* splash auto-hides via config duration */ }
}

/**
 * Register for push notifications and persist the device token against the
 * current (anonymous) user so the backend can target this device.
 */
export async function registerPushNotifications(userId) {
  if (!isNative() || !userId) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') return; // user declined — fine, no push

    await PushNotifications.addListener('registration', async (token) => {
      try {
        await supabase.from('device_tokens').upsert(
          {
            user_id: userId,
            token: token.value,
            platform: Capacitor.getPlatform(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'token' }
        );
      } catch (e) {
        console.error('Failed to save push token:', e);
      }
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    await PushNotifications.register();
  } catch (e) {
    console.error('Push setup failed:', e);
  }
}

/** Native share sheet with a web fallback. */
export async function shareContent({ title, text, url }) {
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, url });
      return true;
    } catch (e) { /* fall through to web */ }
  }
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return true; } catch (e) { /* cancelled */ }
  }
  return false;
}
