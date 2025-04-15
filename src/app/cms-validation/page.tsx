'use client';
/**
 * CMS / Validation Control Panel Page
 *
 * Provides a live dashboard for validation steps and logs, powered by the global appEventBus.
 * Allows toggling API mode (mock/live) in local state, launching the app, and clearing logs.
 *
 * State:
 * - validationSteps: Tracks status/details for each validation prompt.
 * - logs: Stores recent log events (max 100).
 * - apiMode: Local state for API mode toggle (manual env change required for real effect).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { appEventBus, LogPayload, ValidationPayload } from '@/lib/eventBus';
import { logInfo, logError, logWarn, logValidation } from '@/lib/logger';
import { setEventInLocalStorage } from '@/lib/eventBus';
import '@/lib/firestoreFetchAll'; // Attach getAllFirestoreData to window for DataSyncPanel
import { VerificationButtons } from './VerificationButtons';
import { DataSyncPanel } from './DataSyncPanel';

/**
 * Tracks the status and details of each validation prompt.
 * Keyed by promptId (string).
 */
type ValidationStepsState = Record<string, { status: ValidationPayload['status']; details?: string }>;

const MAX_LOGS = 100;

const CmsValidationPage: React.FC = () => {
  /**
   * validationSteps: Stores the status of each validation prompt.
   * logs: Stores the latest log events for display.
   * apiMode: Local state for API mode toggle (mock/live).
   */
  const [validationSteps, setValidationSteps] = useState<ValidationStepsState>({});
  const [logs, setLogs] = useState<LogPayload[]>([]);
  const [apiMode, setApiMode] = useState<string>(process.env.NEXT_PUBLIC_API_MODE || 'mock');
  const [isDebugMode, setIsDebugMode] = useState(true); // Start with debug mode on
  const [lastEventTime, setLastEventTime] = useState<string>('None');
  const [eventBusStatus, setEventBusStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedCollectionData, setSelectedCollectionData] = useState<any[] | null>(null);
  
  // Keep a ref to logs for event handlers
  const logsRef = useRef<LogPayload[]>([]);
  
  // Update the ref when logs change
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  // Debug: log when component mounts and add test logs
  useEffect(() => {
    console.log('[CMS] CmsValidationPage mounted');
    
    // Signal that we're alive by logging to the event system
    logInfo('CMS Validation page loaded and listening for events', { timestamp: new Date().toISOString() });
    
    // Set the event bus as connected once we've mounted
    setEventBusStatus('connected');
    
    // Heartbeat interval (ms)
    const HEARTBEAT_INTERVAL = 60000; // 60 seconds

    const heartbeat = () => {
      logInfo('CMS Heartbeat: Event bus test', { source: 'CMS', type: 'heartbeat', ts: new Date().toISOString() });
    };
    const intervalId = setInterval(heartbeat, HEARTBEAT_INTERVAL);
    // Emit one immediately on mount
    heartbeat();
    return () => clearInterval(intervalId);
  }, []);

  // Generate test logs when requested
  const generateTestLogs = () => {
    // A unique ID for this test group
    const testId = Date.now().toString();
    
    console.log('[CMS] Generating test logs');
    
    // Try multiple approaches to log events to catch any issues
    
    // 1. Direct event bus emission
    appEventBus.emit('log_event', {
      level: 'INFO',
      message: `Test INFO log (direct emit) ${testId}`,
      timestamp: new Date().toISOString(),
      data: { source: 'cms_test_button', method: 'direct_emit', testId }
    });
    
    // 2. Logger functions
    logInfo(`Test INFO log (logger) ${testId}`, { source: 'cms_test_button', method: 'logger', testId });
    logWarn(`Test WARNING log (logger) ${testId}`, { source: 'cms_test_button', method: 'logger', testId });
    logError(`Test ERROR log (logger) ${testId}`, { source: 'cms_test_button', method: 'logger', testId });
    
    // 3. LocalStorage approach
    try {
      const localStoragePayload = {
        level: 'INFO',
        message: `Test INFO log (localStorage) ${testId}`,
        timestamp: new Date().toISOString(),
        data: { source: 'cms_test_button', method: 'localStorage', testId }
      };
      localStorage.setItem('cms_log_event', JSON.stringify(localStoragePayload) + ':' + Math.random());
      console.log('[CMS] Set localStorage for test event');
    } catch (e) {
      console.error('[CMS] Error with localStorage:', e);
    }
  };

  // Subscribe to log and validation events
  useEffect(() => {
    /**
     * Handles log events by prepending new logs and limiting array size.
     */
    const handleLog = (payload: LogPayload) => {
      console.log('[CMS] Received log_event:', payload); // DEBUG
      
      // Update the state in a way that won't have closure issues
      setLogs(prevLogs => {
        const newLogs = [payload, ...prevLogs.slice(0, MAX_LOGS - 1)];
        return newLogs;
      });
      
      setLastEventTime(new Date().toISOString());
      setEventBusStatus('connected');
    };
    
    /**
     * Handles validation events by updating the validationSteps state.
     */
    const handleValidation = (payload: ValidationPayload) => {
      console.log('[CMS] Received validation_event:', payload); // DEBUG
      
      setValidationSteps(prev => ({
        ...prev,
        [payload.promptId]: { status: payload.status, details: payload.details },
      }));
      
      setLastEventTime(new Date().toISOString());
      setEventBusStatus('connected');
    };

    console.log('[CMS] Setting up event listeners');
    
    // Subscribe to events
    appEventBus.on('log_event', handleLog);
    appEventBus.on('validation_event', handleValidation);
    
    // Test event emission immediately after subscribing
    setTimeout(() => {
      console.log('[CMS] Emitting test event after subscription');
      appEventBus.emit('log_event', {
        level: 'INFO',
        message: 'Event bus subscription test',
        timestamp: new Date().toISOString(),
        data: { type: 'subscription_test' }
      });
    }, 500);
    
    // Also set up storage event listener directly
    const handleStorageEvent = (event: StorageEvent) => {
      console.log('[CMS] Storage event received:', event.key);
      
      // Only handle our master key
      if (event.key === 'cms_log_master' && event.newValue) {
        try {
          // Get the data from the actual storage key
          const eventKey = event.newValue;
          const eventData = localStorage.getItem(eventKey);
          
          if (!eventData) {
            console.error(`[CMS] No data found for key: ${eventKey}`);
            return;
          }
          
          console.log(`[CMS] Processing event data: ${eventData.substring(0, 50)}${eventData.length > 50 ? '...' : ''}`);
          
          // Parse the event data
          const payload = JSON.parse(eventData);
          
          // Add to logs
          if (payload && typeof payload === 'object' && 
              'level' in payload && 'message' in payload && 
              'timestamp' in payload) {
            addLog(payload);
          }
        } catch (e) {
          console.error('[CMS] Error handling storage event:', e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    // Cleanup subscriptions on unmount
    return () => {
      console.log('[CMS] Cleaning up event listeners');
      appEventBus.off('log_event', handleLog);
      appEventBus.off('validation_event', handleValidation);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Debug: log logs state when it changes 
  useEffect(() => {
    console.log('[CMS] logs state updated:', logs);
  }, [logs]);

  /**
   * Handles API mode switch. Only updates local state and logs the action.
   * Real API mode change requires editing .env.local and reloading the page.
   */
  const handleModeSwitch = useCallback((mode: 'mock' | 'live') => {
    setApiMode(mode);
    
    // Use direct event bus emission for reliability
    appEventBus.emit('log_event', {
      level: 'INFO',
      message: `CMS: Switched API Mode state to -> ${mode}`,
      timestamp: new Date().toISOString(),
      data: { previousMode: apiMode, newMode: mode }
    });
  }, [apiMode]);
  
  // Function to manually force sync with localStorage
  const forceSyncWithLocalStorage = () => {
    console.log('[CMS] Force syncing with localStorage...');
    
    try {
      // Check all localStorage items for our log keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith('cms_log_')) {
          try {
            const value = localStorage.getItem(key);
            if (!value) continue;
            
            console.log(`[CMS] Found log entry: ${key}`);
            const payload = JSON.parse(value);
            
            if (payload && typeof payload === 'object' && 
                'level' in payload && 'message' in payload && 
                'timestamp' in payload) {
              addLog(payload);
            }
          } catch (e) {
            console.error(`[CMS] Error processing localStorage key ${key}:`, e);
          }
        }
      }
      
      // Add a "force sync" event
      const syncEvent: LogPayload = {
        level: 'INFO',
        message: 'Force sync with localStorage test',
        timestamp: new Date().toISOString(),
        data: { source: 'cms_page', triggered_by: 'force_sync_button' }
      };
      
      // Use the new method from eventBus
      setEventInLocalStorage(syncEvent);
      
      // Also emit directly to the event bus
      appEventBus.emit('log_event', syncEvent);
      
    } catch (e) {
      console.error('[CMS] Error during sync with localStorage:', e);
    }
  };

  // Add the addLog helper function
  const addLog = useCallback((payload: LogPayload) => {
    setLogs(prevLogs => {
      // Check if this log already exists to avoid duplicates
      if (prevLogs.some(log => 
        log.timestamp === payload.timestamp && 
        log.message === payload.message &&
        log.level === payload.level
      )) {
        return prevLogs;
      }
      return [payload, ...prevLogs.slice(0, MAX_LOGS - 1)];
    });
    setLastEventTime(new Date().toISOString());
    setEventBusStatus('connected');
  }, []);

  // Helper to fetch and set data for a collection (offline/online based on mode)
  async function handleShowCollectionData(collection: string) {
    if (apiMode === 'mock' || apiMode === 'offline') {
      try {
        const offlineRes = await fetch('/scripts/offlineMockData.json');
        const offlineJson = await offlineRes.json();
        if (offlineJson[collection]) {
          setSelectedCollection(collection);
          setSelectedCollectionData(offlineJson[collection]);
          return;
        } else {
          setSelectedCollection(collection);
          setSelectedCollectionData([]);
        }
      } catch {
        setSelectedCollection(collection);
        setSelectedCollectionData([]);
      }
    } else if (apiMode === 'live' || apiMode === 'online') {
      if (typeof window !== 'undefined' && typeof (window as any).getAllFirestoreData === 'function') {
        const online = await (window as any).getAllFirestoreData();
        if (online[collection]) {
          setSelectedCollection(collection);
          setSelectedCollectionData(online[collection]);
        } else {
          setSelectedCollection(collection);
          setSelectedCollectionData([]);
        }
      } else {
        setSelectedCollection(collection);
        setSelectedCollectionData([]);
      }
    }
  }

  // Expose logValidation globally for browser console use (dev/validation only)
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.logValidation = logValidation;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100 p-6">
      {/* Title Section */}
      <h1 className="text-2xl font-bold mb-4">CMS / Validation Control Panel</h1>

      {/* Debug Information Section */}
      <section className="mb-6 p-4 border border-blue-300 rounded bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Debugging</h2>
          <button
            className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            onClick={() => setIsDebugMode(!isDebugMode)}
          >
            {isDebugMode ? 'Hide Debug Info' : 'Show Debug Info'}
          </button>
        </div>
        
        {isDebugMode && (
          <div className="mt-2 text-sm">
            <p>
              <strong>Event Bus Status:</strong> 
              <span className={eventBusStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
                {eventBusStatus}
              </span>
            </p>
            <p><strong>Last Event Received:</strong> {lastEventTime !== 'None' ? lastEventTime : 'No events yet'}</p>
            <p><strong>Total Logs:</strong> {logs.length}</p>
            <p><strong>Total Validation Steps:</strong> {Object.keys(validationSteps).length}</p>
          </div>
        )}
        
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="px-3 py-1 bg-purple-500 hover:bg-purple-700 text-white rounded"
            onClick={generateTestLogs}
          >
            Generate Test Logs
          </button>
          <button
            className="px-3 py-1 bg-orange-500 hover:bg-orange-700 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
          <button
            className="px-3 py-1 bg-indigo-500 hover:bg-indigo-700 text-white rounded"
            onClick={forceSyncWithLocalStorage}
          >
            Force Sync
          </button>
          <button
            className="px-3 py-1 bg-red-500 hover:bg-red-700 text-white rounded"
            onClick={() => setLogs([])}
          >
            Clear Logs
          </button>
        </div>
      </section>

      {/* Data Structure Integrity Check Button */}
      <section className="mb-6">
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded shadow text-sm font-medium"
          onClick={async () => {
            try {
              const zodSchemas = await import('@/lib/zodSchemas');
              const schemaMap: Record<string, any> = {
                users: zodSchemas.UserProfileSchema,
                patients: zodSchemas.PatientProfileSchema,
                doctors: zodSchemas.DoctorProfileSchema,
                availability: zodSchemas.DoctorAvailabilitySlotSchema,
                verificationDocs: zodSchemas.VerificationDocumentSchema,
                appointments: zodSchemas.AppointmentSchema,
                notifications: zodSchemas.NotificationSchema,
              };
              const [offlineRes, onlineData] = await Promise.all([
                fetch('/scripts/offlineMockData.json').then(res => res.json()),
                (typeof window !== 'undefined' && typeof (window as any).getAllFirestoreData === 'function')
                  ? (window as any).getAllFirestoreData()
                  : Promise.resolve(null)
              ]);
              if (!onlineData) {
                alert('Online data fetch is not available in this environment.');
                return;
              }
              // Validate both offline and online data
              const results: string[] = [];
              for (const [key, schema] of Object.entries(schemaMap)) {
                // Validate offline
                if (offlineRes[key]) {
                  for (const [i, doc] of offlineRes[key].entries()) {
                    const result = schema.safeParse(doc);
                    if (!result.success) {
                      results.push(`[OFFLINE] ${key}[${i}]: ${JSON.stringify(result.error.issues)}`);
                    }
                  }
                }
                // Validate online
                if (onlineData[key]) {
                  for (const [i, doc] of onlineData[key].entries()) {
                    const result = schema.safeParse(doc);
                    if (!result.success) {
                      results.push(`[ONLINE] ${key}[${i}]: ${JSON.stringify(result.error.issues)}`);
                    }
                  }
                }
              }
              if (results.length === 0) {
                alert('All data structures are valid according to Zod schemas.');
              } else {
                alert(`Data structure validation errors found:\n${results.slice(0, 10).join('\n')}\n${results.length > 10 ? `...and ${results.length - 10} more` : ''}`);
              }
            } catch (e: any) {
              alert('Error during data structure integrity check: ' + (e.message || String(e)));
            }
          }}
        >
          Check Data Structure Integrity (Zod)
        </button>
      </section>

      {/* Fix User Data Integrity Button */}
      <section className="mb-6">
        <button
          className="px-4 py-2 bg-green-600 hover:bg-green-800 text-white rounded shadow text-sm font-medium"
          onClick={async () => {
            try {
              // Dynamically import Firebase client SDK
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebaseClient');
              if (!app) {
                alert('Firebase app is not initialized.');
                return;
              }
              const db = getFirestore(app);
              // Fetch all users
              const getAllFirestoreData = (window as any).getAllFirestoreData;
              if (typeof getAllFirestoreData !== 'function') {
                alert('Cannot fetch Firestore data in this environment.');
                return;
              }
              const data = await getAllFirestoreData();
              if (!data.users) {
                alert('No users found in Firestore.');
                return;
              }
              let fixedCount = 0;
              for (const user of data.users) {
                const updateObj: Record<string, any> = {};
                let needsUpdate = false;
                // id
                if (typeof user.id !== 'string') {
                  updateObj.id = user.id || user.__id || '';
                  needsUpdate = true;
                }
                // booleans
                ['isActive', 'emailVerified', 'phoneVerified'].forEach(field => {
                  if (typeof user[field] !== 'boolean') {
                    updateObj[field] = false;
                    needsUpdate = true;
                  }
                });
                // strings
                ['phone', 'firstName', 'lastName'].forEach(field => {
                  if (typeof user[field] !== 'string') {
                    updateObj[field] = '';
                    needsUpdate = true;
                  }
                });
                // userType casing
                if (typeof user.userType === 'string' && !['PATIENT', 'DOCTOR', 'ADMIN'].includes(user.userType)) {
                  const upper = user.userType.toUpperCase();
                  if (['PATIENT', 'DOCTOR', 'ADMIN'].includes(upper)) {
                    updateObj.userType = upper;
                    needsUpdate = true;
                  }
                }
                // Only update if needed
                if (needsUpdate && user.id) {
                  await updateDoc(doc(db, 'users', user.id), updateObj);
                  fixedCount++;
                }
              }
              alert(`User data integrity auto-fix complete. Fixed ${fixedCount} user(s).`);
            } catch (e: any) {
              alert('Error during user data integrity fix: ' + (e.message || String(e)));
            }
          }}
        >
          Fix User Data Integrity (Auto-Fix)
        </button>
      </section>

      {/* Fix All Data Integrity Button */}
      <section className="mb-6">
        <button
          className="px-4 py-2 bg-purple-600 hover:bg-purple-800 text-white rounded shadow text-sm font-medium"
          onClick={async () => {
            try {
              // Import Firebase SDK and Zod schemas
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebaseClient');
              if (!app) {
                alert('Firebase app is not initialized.');
                return;
              }
              const db = getFirestore(app);
              const zodSchemas = await import('@/lib/zodSchemas');
              const schemaMap: Record<string, any> = {
                users: zodSchemas.UserProfileSchema,
                patients: zodSchemas.PatientProfileSchema,
                doctors: zodSchemas.DoctorProfileSchema,
                availability: zodSchemas.DoctorAvailabilitySlotSchema,
                verificationDocs: zodSchemas.VerificationDocumentSchema,
                appointments: zodSchemas.AppointmentSchema,
                notifications: zodSchemas.NotificationSchema,
              };
              // Fetch all collections
              const getAllFirestoreData = (window as any).getAllFirestoreData;
              if (typeof getAllFirestoreData !== 'function') {
                alert('Cannot fetch Firestore data in this environment.');
                return;
              }
              const data = await getAllFirestoreData();
              let summary: string[] = [];
              for (const [col, schema] of Object.entries(schemaMap)) {
                if (!data[col]) continue;
                let fixedCount = 0;
                for (const docObj of data[col]) {
                  const updateObj: Record<string, any> = {};
                  let needsUpdate = false;
                  const docId = docObj.id || docObj.__id;
                  // For each required field in the schema, fix missing values
                  const shape = (schema as any)._def.shape();
                  for (const [field, def] of Object.entries(shape)) {
                    const value = docObj[field];
                    // String
                    if (def._def.typeName === 'ZodString' && typeof value !== 'string') {
                      updateObj[field] = '';
                      needsUpdate = true;
                    }
                    // Boolean
                    if (def._def.typeName === 'ZodBoolean' && typeof value !== 'boolean') {
                      updateObj[field] = false;
                      needsUpdate = true;
                    }
                    // Number
                    if (def._def.typeName === 'ZodNumber' && typeof value !== 'number') {
                      updateObj[field] = 0;
                      needsUpdate = true;
                    }
                    // Enum (auto-fix casing)
                    if (def._def.typeName === 'ZodEnum' && typeof value === 'string' && !def.options.includes(value)) {
                      const upper = value.toUpperCase();
                      if (def.options.includes(upper)) {
                        updateObj[field] = upper;
                        needsUpdate = true;
                      }
                    }
                  }
                  // id field
                  if ('id' in shape && typeof docObj.id !== 'string' && docId) {
                    updateObj.id = docId;
                    needsUpdate = true;
                  }
                  if (needsUpdate && docId) {
                    await updateDoc(doc(db, col, docId), updateObj);
                    fixedCount++;
                  }
                }
                summary.push(`${col}: fixed ${fixedCount}`);
              }
              alert(`Data integrity auto-fix complete.\n${summary.join('\n')}`);
            } catch (e: any) {
              alert('Error during data integrity fix: ' + (e.message || String(e)));
            }
          }}
        >
          Fix All Data Integrity (Auto-Fix)
        </button>
      </section>

      {/* Data Verification Buttons Section */}
      <VerificationButtons onShowCollectionData={handleShowCollectionData} />

      {/* Data Sync Panel Section */}
      <DataSyncPanel
        selectedCollection={selectedCollection}
        selectedCollectionData={selectedCollectionData}
        apiMode={apiMode}
      />

      {/* Mode Switcher Section */}
      <section className="mb-6">
        <div className="flex items-center gap-4">
          <span className="font-semibold">API Mode:</span>
          <span className={`px-2 py-1 rounded ${apiMode === 'live' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>{apiMode}</span>
          <button
            className="px-3 py-1 bg-blue-500 hover:bg-blue-700 text-white rounded"
            onClick={() => handleModeSwitch('mock')}
            disabled={apiMode === 'mock'}
          >
            Switch to Mock API
          </button>
          <button
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-700 text-white rounded"
            onClick={() => handleModeSwitch('live')}
            disabled={apiMode === 'live'}
          >
            Switch to Live API
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Switching API mode here only updates local state for UI/testing. To actually change API mode, edit <code>.env.local</code> and reload.</p>
      </section>

      {/* Launch App Button */}
      <section className="mb-6">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition mr-3"
          onClick={() => {
            // Log that we're navigating to the home page
            appEventBus.emit('log_event', {
              level: 'INFO',
              message: 'Navigation from CMS to Home page',
              timestamp: new Date().toISOString(),
              data: { from: 'CMS', to: 'Home' }
            });
          }}
        >
          Launch App Homepage
        </a>
        <button
          onClick={() => {
            appEventBus.emit('log_event', {
              level: 'INFO',
              message: 'Manual log test from CMS page',
              timestamp: new Date().toISOString(),
              data: { type: 'manual_test' }
            });
          }}
          className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Test Direct Log
        </button>
      </section>

      {/* Validation Steps Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Validation Steps</h2>
        {/* Maps each validation step (from validation events) to a row */}
        <ul className="space-y-2">
          {Object.entries(validationSteps).length === 0 && (
            <li className="text-gray-400 italic">No validation events yet.</li>
          )}
          {Object.entries(validationSteps).map(([promptId, { status, details }]) => (
            <li
              key={promptId}
              className={`p-3 rounded border ${status === 'success' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-red-500 bg-red-50 dark:bg-red-900/30'}`}
            >
              <span className="font-mono font-bold">Prompt {promptId}:</span>
              <span className={`ml-2 font-semibold ${status === 'success' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{status}</span>
              {details && <span className="ml-4 text-xs text-gray-600 dark:text-gray-400">{details}</span>}
            </li>
          ))}
        </ul>
        {/* Source: validation_event events from appEventBus */}
      </section>

      {/* Log Display Section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Logs ({logs.length})</h2>
          <button
            className="px-2 py-1 bg-gray-300 dark:bg-gray-700 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-600"
            onClick={() => setLogs([])}
          >
            Clear Logs
          </button>
        </div>
        {/* Source: log_event events from appEventBus */}
        <pre className="bg-gray-100 dark:bg-gray-800 rounded p-3 overflow-x-auto text-xs max-h-80 mb-8">
          {logs.length === 0 ? (
            <span className="text-gray-400 italic">No logs yet. Try clicking buttons on the home page or use the "Generate Test Logs" button above.</span>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="mb-2">
                <span className={`font-bold ${log.level === 'ERROR' ? 'text-red-600 dark:text-red-400' : log.level === 'WARN' ? 'text-yellow-600 dark:text-yellow-400' : log.level === 'DEBUG' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-100'}`}>{log.level}</span>
                <span className="ml-2">[{log.timestamp}]</span>
                <span className="ml-2">{log.message}</span>
                {log.data && <span className="ml-2 text-gray-500">{JSON.stringify(log.data)}</span>}
              </div>
            ))
          )}
        </pre>
      </section>
    </div>
  );
};

export default CmsValidationPage;
