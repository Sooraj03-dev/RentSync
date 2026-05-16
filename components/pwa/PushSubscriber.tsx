'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscriber() {
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const subscribe = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'denied') {
          setDenied(true);
          return;
        }

        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          
          let subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) return;
            
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
            
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(subscription)
            });
          }
        }
      } catch (error) {
        console.error('Push subscription failed:', error);
      }
    };

    subscribe();
  }, []);

  if (denied) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-200 text-xs font-semibold shadow-md">
        Enable notifications in browser settings for rent reminders
      </div>
    );
  }

  return null;
}
