'use client';

import { useEffect } from 'react';
import { initDataPersistence, cleanupDataPersistence } from '@/lib/mockDataPersistence';

/**
 * ClientInit component is responsible for initializing client-side services
 * and performing cleanup when the component unmounts.
 */
export default function ClientInit() {
  useEffect(() => {
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