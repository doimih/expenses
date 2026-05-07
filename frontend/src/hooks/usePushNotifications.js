import { useEffect, useRef } from 'react';
import api from '../services/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(enabled = false) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (subscribedRef.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function subscribe() {
      try {
        const reg = await navigator.serviceWorker.ready;

        // Get VAPID public key
        const { data } = await api.get('/push/vapid-public-key');
        const publicKey = data.publicKey;
        if (!publicKey) return;

        // Check existing subscription
        let subscription = await reg.pushManager.getSubscription();

        if (!subscription) {
          // Request permission only if not already granted
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        const subJson = subscription.toJSON();
        await api.post('/push/subscribe', {
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        });

        subscribedRef.current = true;
      } catch (err) {
        console.debug('Push subscribe skipped:', err.message);
      }
    }

    subscribe();
  }, []);
}
