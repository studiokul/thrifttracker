'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister()))
        );
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — app still works, just no offline
    });
  }, []);

  return null;
}
