'use client';

import { useEffect } from 'react';
import { initDataPersistence, cleanupDataPersistence } from '@/lib/mockDataPersistence';
import { API_MODE } from '@/config/appConfig';

/**
 * ClientInit component is responsible for initializing client-side services
 * and performing cleanup when the component unmounts.
 * It also ensures localStorage.apiMode is always synced to .env in development.
 */
export default function ClientInit() {
  useEffect(() => {
    // Always sync localStorage.apiMode to .env value in development
    if (process.env.NODE_ENV !== 'production') {
      localStorage.setItem('apiMode', API_MODE);
      console.log('[ClientInit] Synced localStorage.apiMode to .env:', API_MODE);
    }
    // Initialize data persistence for cross-window/tab synchronization
    try {
      initDataPersistence();
      console.log('[ClientInit] Data persistence initialized');
    } catch (error) {
      console.error('[ClientInit] Error initializing data persistence:', error);
    }

    // Cleanup when component unmounts
    return () => {
      try {
        cleanupDataPersistence();
        console.log('[ClientInit] Data persistence cleaned up');
      } catch (error) {
        console.error('[ClientInit] Error cleaning up data persistence:', error);
      }
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}