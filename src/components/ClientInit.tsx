'use client';

import { useEffect, useState } from 'react';
import { initDataPersistence, cleanupDataPersistence } from '@/lib/mockDataPersistence';
import { API_MODE, setApiMode } from '@/config/appConfig';
import { initializeFirebaseClient } from '@/lib/firebaseClient';
import { usePathname } from 'next/navigation';

/**
 * ClientInit component is responsible for initializing client-side services
 * and performing cleanup when the component unmounts.
 * It also ensures localStorage.apiMode is properly set for the current route.
 */
export default function ClientInit() {
  const pathname = usePathname();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      try {
        console.log('[ClientInit] Starting application initialization...');
        
        // Special handling for /find route - always use live mode
        const isSpecialRoute = pathname && pathname.includes('/find');
        if (isSpecialRoute) {
          console.log('[ClientInit] /find route detected - forcing live mode');
          localStorage.setItem('apiMode', 'live');
        } 
        // Otherwise in development, sync localStorage.apiMode to .env value
        else if (process.env.NODE_ENV !== 'production') {
          localStorage.setItem('apiMode', API_MODE);
          console.log('[ClientInit] Synced localStorage.apiMode to .env:', API_MODE);
        }
        
        // Get current API mode after potential updates
        const currentApiMode = localStorage.getItem('apiMode') || API_MODE;
        
        // For /find route, ensure we pre-initialize Firebase regardless of mode
        if (isSpecialRoute || currentApiMode === 'live') {
          console.log('[ClientInit] Pre-initializing Firebase...');
          // Force initialization with 'live' mode
          const { app, auth, db, analytics } = initializeFirebaseClient('live');
          console.log('[ClientInit] Firebase initialization result:', { 
            appInitialized: !!app, 
            authInitialized: !!auth, 
            dbInitialized: !!db,
            analyticsInitialized: !!analytics
          });
        }
        
        // Initialize data persistence
        console.log('[ClientInit] Initializing data persistence...');
        initDataPersistence();
        console.log('[ClientInit] Data persistence initialized');
        
        setInitialized(true);
        console.log('[ClientInit] Application initialization complete');
      } catch (error) {
        console.error('[ClientInit] Error during initialization:', error);
      }
    };
    
    init();
    
    // Cleanup when component unmounts
    return () => {
      try {
        cleanupDataPersistence();
        console.log('[ClientInit] Data persistence cleaned up');
      } catch (error) {
        console.error('[ClientInit] Error cleaning up data persistence:', error);
      }
    };
  }, [pathname]);

  // This component doesn't render anything visible
  return null;
}