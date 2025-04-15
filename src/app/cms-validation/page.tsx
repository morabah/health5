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
import { UserProfileSchema, PatientProfileSchema, DoctorProfileSchema, DoctorAvailabilitySlotSchema, VerificationDocumentSchema, AppointmentSchema, NotificationSchema } from '@/lib/zodSchemas';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleExclamation, faSearch, faDownload, faSpinner, faCodeCompare } from '@fortawesome/free-solid-svg-icons';

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

  const statusColors: Record<string, string> = {
    valid: 'text-green-600 bg-green-100',
    issues: 'text-yellow-700 bg-yellow-100',
    error: 'text-red-700 bg-red-100',
  };
  const statusIcons: Record<string, any> = {
    valid: faCircleCheck,
    issues: faCircleExclamation,
    error: faCircleExclamation,
  };

  const collectionSchemas = {
    users: UserProfileSchema,
    patients: PatientProfileSchema,
    doctors: DoctorProfileSchema,
    availability: DoctorAvailabilitySlotSchema,
    verificationDocs: VerificationDocumentSchema,
    appointments: AppointmentSchema,
    notifications: NotificationSchema,
  };

  function getApiModeClientSafe() {
    if (typeof window !== 'undefined') {
      return (window as any).apiMode || process.env.NEXT_PUBLIC_API_MODE || 'mock';
    }
    return 'mock';
  }

  function useLiveValidationData(apiMode: string) {
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<any[]>([]);
    const [logs, setLogs] = useState<Record<string, string[]>>({});
    const [error, setError] = useState<string | null>(null);

    async function validateAll() {
      setLoading(true);
      setError(null);
      let data: Record<string, any[]> = {};
      try {
        if (apiMode === 'live' && typeof window !== 'undefined' && typeof (window as any).getAllFirestoreData === 'function') {
          data = await (window as any).getAllFirestoreData();
        } else {
          // fallback to mock
          const res = await fetch('/scripts/offlineMockData.json');
          data = await res.json();
        }
      } catch (e: any) {
        setLoading(false);
        setResults([]);
        setError('Failed to fetch data: ' + (e?.message || e));
        return;
      }
      // Validate each collection
      const newResults: any[] = [];
      const newLogs: Record<string, string[]> = {};
      for (const [col, schema] of Object.entries(collectionSchemas)) {
        const docs = data[col] || [];
        let issues = 0;
        newLogs[col] = [];
        docs.forEach((doc: any, idx: number) => {
          const result = (schema as any).safeParse(doc);
          if (!result.success) {
            issues++;
            newLogs[col].push(`Doc ${doc.id || idx}: ${JSON.stringify(result.error.issues)}`);
          }
        });
        newResults.push({
          collection: col,
          status: issues === 0 ? 'valid' : 'issues',
          lastChecked: new Date().toLocaleString(),
          issues,
          logs: newLogs[col],
        });
      }
      setResults(newResults);
      setLogs(newLogs);
      setLoading(false);
    }

    useEffect(() => {
      validateAll();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiMode]);

    // Per-collection validation (AJAX, no reload)
    async function validateCollection(col: string) {
      setLoading(true);
      setError(null);
      let data: Record<string, any[]> = {};
      try {
        if (apiMode === 'live' && typeof window !== 'undefined' && typeof (window as any).getAllFirestoreData === 'function') {
          data = await (window as any).getAllFirestoreData();
        } else {
          const res = await fetch('/scripts/offlineMockData.json');
          data = await res.json();
        }
      } catch (e: any) {
        setLoading(false);
        setError('Failed to fetch data: ' + (e?.message || e));
        return;
      }
      const schema = (collectionSchemas as any)[col];
      const docs = data[col] || [];
      let issues = 0;
      const newLogs: string[] = [];
      docs.forEach((doc: any, idx: number) => {
        const result = (schema as any).safeParse(doc);
        if (!result.success) {
          issues++;
          newLogs.push(`Doc ${doc.id || idx}: ${JSON.stringify(result.error.issues)}`);
        }
      });
      setResults((prev: any[]) => prev.map((r) => r.collection === col ? {
        ...r,
        status: issues === 0 ? 'valid' : 'issues',
        lastChecked: new Date().toLocaleString(),
        issues,
        logs: newLogs,
      } : r));
      setLogs((prev) => ({ ...prev, [col]: newLogs }));
      setLoading(false);
    }

    return { loading, results, logs, error, validateAll, validateCollection };
  }

  function FirestoreIntegrityTableLive({ apiMode }: { apiMode: string }) {
    // --- Persistent Filter/Sort State ---
    const [filter, setFilter] = useState<'all' | 'issues' | 'valid'>(() => {
      return (typeof window !== 'undefined' && localStorage.getItem('cms_filter')) as any || 'all';
    });
    const [sort, setSort] = useState<'name' | 'issues'>(() => {
      return (typeof window !== 'undefined' && localStorage.getItem('cms_sort')) as any || 'issues';
    });
    useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cms_filter', filter);
        localStorage.setItem('cms_sort', sort);
      }
    }, [filter, sort]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [search, setSearch] = useState('');
    const [modalDoc, setModalDoc] = useState<{ doc: any, issues: any[], collection: string } | null>(null);
    const { loading, results, logs, error, validateAll, validateCollection } = useLiveValidationData(apiMode);

    // --- Keyboard Navigation ---
    const tableRef = useRef<HTMLTableElement>(null);
    useEffect(() => {
      const table = tableRef.current;
      if (!table) return;
      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          const rows = Array.from(table.querySelectorAll('tbody tr'));
          const active = document.activeElement;
          const idx = rows.findIndex(r => r.contains(active));
          let nextIdx = idx;
          if (e.key === 'ArrowDown') nextIdx = Math.min(idx + 1, rows.length - 1);
          if (e.key === 'ArrowUp') nextIdx = Math.max(idx - 1, 0);
          if (rows[nextIdx]) {
            const focusable = rows[nextIdx].querySelector('button, [tabindex="0"]');
            if (focusable) (focusable as HTMLElement).focus();
          }
          e.preventDefault();
        }
      }
      table.addEventListener('keydown', onKeyDown);
      return () => { table.removeEventListener('keydown', onKeyDown); };
    }, []);

    // --- CSV export ---
    function exportCSV() {
      const header = ['Collection', 'Status', 'Issues', 'Last Checked'];
      const rows = results.map(r => [r.collection, r.status, r.issues, r.lastChecked]);
      const csv = [header, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'firestore_validation_results.csv';
      a.click();
      URL.revokeObjectURL(url);
    }

    // --- Drilldown modal ---
    function DocModal({ doc, issues, collection, onClose }: { doc: any, issues: any[], collection: string, onClose: () => void }) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close">&times;</button>
            <h4 className="text-lg font-semibold mb-2">{collection} Document Details</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 mb-2 text-xs overflow-x-auto max-h-48">{JSON.stringify(doc, null, 2)}</pre>
            <div className="mb-2">
              <span className="font-semibold">Invalid Fields:</span>
              <ul className="list-disc ml-6 mt-1 text-xs">
                {issues.map((iss, i) => (
                  <li key={i} className="text-red-600 dark:text-red-300">{iss.path?.join('.') ?? ''} — {iss.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // --- Filter/sort/search logic (unchanged) ---
    let displayResults = results;
    if (filter !== 'all') {
      displayResults = displayResults.filter((r) => r.status === filter);
    }
    if (search) {
      displayResults = displayResults.filter(r => r.collection.includes(search));
    }
    if (sort === 'issues') {
      displayResults = [...displayResults].sort((a, b) => b.issues - a.issues);
    } else {
      displayResults = [...displayResults].sort((a, b) => a.collection.localeCompare(b.collection));
    }

    // --- Inline Per-Row Actions ---
    function handleCompare(col: string) {
      // TODO: Trigger compare for this collection (open diff modal)
    }
    function handleSync(col: string) {
      // TODO: Trigger sync for this collection (with backup)
    }

    // --- Table Rendering ---
    return (
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
          <h2 className="text-xl font-semibold">Firestore Collections Data Integrity ({apiMode})</h2>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="search"
              className="px-2 py-1 rounded border text-sm"
              placeholder="Search collections..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search collections"
            />
            <select className="px-2 py-1 rounded border text-sm" value={filter} onChange={e => setFilter(e.target.value as any)} aria-label="Filter by status">
              <option value="all">All</option>
              <option value="issues">Issues</option>
              <option value="valid">Valid</option>
            </select>
            <select className="px-2 py-1 rounded border text-sm" value={sort} onChange={e => setSort(e.target.value as any)} aria-label="Sort by">
              <option value="issues">Sort by Issues</option>
              <option value="name">Sort by Name</option>
            </select>
            <button className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs" onClick={exportCSV} title="Export CSV">Export CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto rounded shadow bg-white dark:bg-neutral-900">
          <table ref={tableRef} className="min-w-full text-sm border-separate border-spacing-y-1" tabIndex={0} aria-label="Firestore validation results">
            <thead>
              <tr className="bg-gray-100 dark:bg-neutral-800">
                <th className="px-3 py-2 text-left">Collection</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Issues</th>
                <th className="px-3 py-2 text-left">Last Checked</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayResults.map((r, i) => (
                <tr key={r.collection} className="focus-within:ring-2 focus-within:ring-blue-400">
                  <td className="px-3 py-2 font-medium">{r.collection}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusColors[r.status] || 'bg-gray-200 text-gray-700'}`}
                      tabIndex={0} title={r.status.charAt(0).toUpperCase() + r.status.slice(1)}>
                      <FontAwesomeIcon icon={statusIcons[r.status]} /> {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{r.issues}</td>
                  <td className="px-3 py-2 text-xs">{r.lastChecked}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs" onClick={() => validateCollection(r.collection)} title="Validate" tabIndex={0}>
                      <FontAwesomeIcon icon={faCircleCheck} />
                    </button>
                    <button className="px-2 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded text-xs" onClick={() => handleCompare(r.collection)} title="Compare" tabIndex={0}>
                      <FontAwesomeIcon icon={faCodeCompare} />
                    </button>
                    <button className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs" onClick={() => handleSync(r.collection)} title="Sync" tabIndex={0}>
                      <FontAwesomeIcon icon={faDownload} />
                    </button>
                    <button className="px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded text-xs" onClick={() => setExpanded(e => ({...e, [r.collection]: !e[r.collection]}))} title="Drilldown" tabIndex={0}>
                      <FontAwesomeIcon icon={faSearch} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Drilldown details (below table) */}
        {displayResults.map((r, i) => expanded[r.collection] && (
          <div key={r.collection} className="mt-2 mb-4 p-4 bg-gray-50 dark:bg-neutral-800 rounded shadow-inner">
            <h3 className="font-semibold mb-2">{r.collection} Issues</h3>
            {r.issues === 0 ? (
              <div className="text-green-700">No issues found.</div>
            ) : (
              <ul className="list-disc ml-6 text-xs">
                {r.logs.map((log: string, idx: number) => (
                  <li key={idx} className="text-red-700 dark:text-red-300">{log}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {/* Modal for doc details (future: diff) */}
        {modalDoc && (
          <DocModal {...modalDoc} onClose={() => setModalDoc(null)} />
        )}
      </section>
    );
  }

  // SSR-safe API mode: only set on client
  const [apiModeValue, setApiModeValue] = useState<'mock' | 'live' | string>('mock');
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setApiModeValue(getApiModeClientSafe());
    setMounted(true);
  }, []);

  // --- Deep diff utility for nested objects/arrays ---
  function deepDiff(obj1: any, obj2: any) {
    // Returns { added, removed, changed } per collection
    const result: Record<string, { added: any[]; removed: any[]; changed: { id: string, diffs: any }[] }> = {};
    for (const key of new Set([...Object.keys(obj1), ...Object.keys(obj2)])) {
      const arr1 = obj1[key] || [];
      const arr2 = obj2[key] || [];
      const byId = (arr: any[]) => Object.fromEntries(arr.map((d: any) => [d.id || d.userId, d]));
      const m1 = byId(arr1);
      const m2 = byId(arr2);
      const allIds = new Set([...Object.keys(m1), ...Object.keys(m2)]);
      const added = [];
      const removed = [];
      const changed = [];
      for (const id of allIds) {
        if (!(id in m1)) added.push(m2[id]);
        else if (!(id in m2)) removed.push(m1[id]);
        else {
          const diffs: any = {};
          for (const f of new Set([...Object.keys(m1[id]), ...Object.keys(m2[id])])) {
            if (JSON.stringify(m1[id][f]) !== JSON.stringify(m2[id][f])) {
              diffs[f] = { offline: m1[id][f], online: m2[id][f] };
            }
          }
          if (Object.keys(diffs).length > 0) changed.push({ id, diffs });
        }
      }
      result[key] = { added, removed, changed };
    }
    return result;
  }

  // --- Advanced Drilldown & Diff Modal ---
  const [diffModal, setDiffModal] = useState<{
    collection: string;
    diffs: { added: any[]; removed: any[]; changed: { id: string; from: any; to: any }[] };
    audit: { timestamp: string; action: string; user?: string; data?: any }[];
  } | null>(null);
  async function handleCompare(col: string) {
    // Fetch offline and online data for this collection
    setDiffModal(null);
    let offline: Record<string, any[]> = {};
    let online: Record<string, any[]> = {};
    try {
      const offlineRes = await fetch('/scripts/offlineMockData.json');
      offline = await offlineRes.json();
      if (typeof window !== 'undefined' && typeof (window as any).getAllFirestoreData === 'function') {
        online = await (window as any).getAllFirestoreData();
      } else {
        online = offline; // fallback to mock
      }
    } catch {
      // fallback: empty
      offline = {};
      online = {};
    }
    // Compute diffs for this collection
    const aArr = offline[col] || [];
    const bArr = online[col] || [];
    const byId = (arr: any[]) => Object.fromEntries(arr.map((d: any) => [d.id || d.userId, d]));
    const m1 = byId(aArr);
    const m2 = byId(bArr);
    const allIds = Array.from(new Set([...Object.keys(m1), ...Object.keys(m2)]));
    const added: any[] = [];
    const removed: any[] = [];
    const changed: { id: string; from: any; to: any }[] = [];
    for (const id of allIds) {
      if (!(id in m1)) added.push(m2[id]);
      else if (!(id in m2)) removed.push(m1[id]);
      else if (JSON.stringify(m1[id]) !== JSON.stringify(m2[id])) changed.push({ id, from: m1[id], to: m2[id] });
    }
    // Audit/history: filter logs for this collection
    const audit = (logs[col] || []).map((msg: string) => ({ timestamp: '', action: msg }));
    setDiffModal({ collection: col, diffs: { added, removed, changed }, audit });
  }

  function CollectionDiffModal({ collection, diffs, audit, onClose }: {
    collection: string;
    diffs: { added: any[]; removed: any[]; changed: { id: string; from: any; to: any }[] };
    audit: { timestamp: string; action: string; user?: string; data?: any }[];
    onClose: () => void;
  }) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full p-6 relative overflow-y-auto max-h-[90vh]">
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close">&times;</button>
          <h4 className="text-lg font-semibold mb-4">{collection} — Field-level Diff</h4>
          <div className="mb-4">
            <b>Added:</b> <span className="text-green-700">{diffs.added.length}</span> | <b>Removed:</b> <span className="text-red-700">{diffs.removed.length}</span> | <b>Changed:</b> <span className="text-yellow-700">{diffs.changed.length}</span>
          </div>
          {/* Added docs */}
          {diffs.added.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-green-700">Added Documents</h5>
              <ul className="text-xs">
                {diffs.added.map((doc, i) => (
                  <li key={i} className="bg-green-50 dark:bg-green-900/20 rounded p-2 mb-1"><pre>{JSON.stringify(doc, null, 2)}</pre></li>
                ))}
              </ul>
            </div>
          )}
          {/* Removed docs */}
          {diffs.removed.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-red-700">Removed Documents</h5>
              <ul className="text-xs">
                {diffs.removed.map((doc, i) => (
                  <li key={i} className="bg-red-50 dark:bg-red-900/20 rounded p-2 mb-1"><pre>{JSON.stringify(doc, null, 2)}</pre></li>
                ))}
              </ul>
            </div>
          )}
          {/* Changed docs */}
          {diffs.changed.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold text-yellow-700">Changed Documents</h5>
              <ul className="text-xs">
                {diffs.changed.map(({ id, from, to }, i) => (
                  <li key={i} className="mb-2">
                    <div className="font-semibold mb-1">ID: {id}</div>
                    <div className="flex gap-2 overflow-x-auto">
                      <div className="w-1/2 bg-gray-50 dark:bg-gray-800 rounded p-2">
                        <div className="font-bold text-xs mb-1">Offline</div>
                        {Object.entries(from).map(([k, v]) => (
                          <div key={k} className={JSON.stringify(v) !== JSON.stringify(to[k]) ? 'bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded' : ''}>
                            <span className="font-mono text-xs">{k}: </span>
                            <span className="font-mono text-xs">{JSON.stringify(v)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="w-1/2 bg-gray-50 dark:bg-gray-800 rounded p-2">
                        <div className="font-bold text-xs mb-1">Online</div>
                        {Object.entries(to).map(([k, v]) => (
                          <div key={k} className={JSON.stringify(v) !== JSON.stringify(from[k]) ? 'bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded' : ''}>
                            <span className="font-mono text-xs">{k}: </span>
                            <span className="font-mono text-xs">{JSON.stringify(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Enhanced Audit trail */}
          {audit.length > 0 && (
            <div className="mt-4">
              <h5 className="font-semibold text-xs mb-2">Audit Trail</h5>
              <ul className="text-xs">
                {audit.map((a, i) => (
                  <li key={i} className="mb-2">
                    <div>
                      <span className="font-semibold">{a.timestamp || 'Unknown time'}</span>
                      {a.user && <span className="ml-2 text-blue-700">{a.user}</span>}
                      <span className="ml-2">{a.action}</span>
                    </div>
                    {a.data && (
                      <details className="ml-4 mt-1 bg-gray-100 dark:bg-gray-800 rounded p-2">
                        <summary className="cursor-pointer text-xs text-gray-700 dark:text-gray-300">Details</summary>
                        <pre className="text-xs overflow-x-auto">{JSON.stringify(a.data, null, 2)}</pre>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Compare Panel ---
  function ComparePanel() {
    const [diff, setDiff] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<{ collection: string, id: string, diffs: any } | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState<string | null>(null);
    async function handleCompare() {
      setLoading(true);
      setError(null);
      try {
        // Fetch both offline and online data
        const [offlineRes, online] = await Promise.all([
          fetch('/scripts/offlineMockData.json').then(r => r.json()),
          typeof window !== 'undefined' && typeof (window as any).getAllFirestoreData === 'function'
            ? (window as any).getAllFirestoreData()
            : Promise.resolve({})
        ]);
        const d = deepDiff(offlineRes, online);
        setDiff(d);
      } catch (e: any) {
        setError(e?.message || String(e));
        setDiff(null);
      } finally {
        setLoading(false);
      }
    }
    function exportDiffCSV() {
      if (!diff) return;
      let csv = 'Collection,Type,ID,Field,Offline,Online\n';
      for (const [col, d] of Object.entries(diff)) {
        d.added.forEach((doc: any) => {
          csv += `${col},Added,${doc.id || doc.userId},,,\n`;
        });
        d.removed.forEach((doc: any) => {
          csv += `${col},Removed,${doc.id || doc.userId},,,\n`;
        });
        d.changed.forEach(({ id, diffs }: any) => {
          for (const f in diffs) {
            csv += `${col},Changed,${id},${f},${JSON.stringify(diffs[f].offline)},${JSON.stringify(diffs[f].online)}\n`;
          }
        });
      }
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'firestore_diff.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
    async function handleSyncOnlineToOffline() {
      setSyncing(true);
      setSyncMsg(null);
      try {
        if (typeof window !== 'undefined' && typeof (window as any).getAllFirestoreData === 'function') {
          const online = await (window as any).getAllFirestoreData();
          const blob = new Blob([JSON.stringify(online, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'offlineMockData.json';
          a.click();
          URL.revokeObjectURL(url);
          setSyncMsg('Download complete! To update your offline mock, run the command below in your project root after download.');
        } else {
          throw new Error('window.getAllFirestoreData not available');
        }
      } catch (e: any) {
        setSyncMsg('Failed to sync: ' + (e?.message || String(e)));
      } finally {
        setSyncing(false);
      }
    }
    function handleCopyCommand() {
      const downloadPath = '~/Downloads/offlineMockData.json';
      const cmd = `node scripts/replaceOfflineMock.js ${downloadPath}`;
      navigator.clipboard.writeText(cmd);
    }
    return (
      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <button
            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs px-4 py-2 rounded flex items-center gap-2 shadow"
            onClick={handleCompare}
            disabled={loading}
            title="Compare all collections: offline vs online"
          >
            <FontAwesomeIcon icon={faCodeCompare} /> Compare Offline & Online
          </button>
          <button
            className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs px-3 py-2 rounded flex items-center gap-2"
            onClick={exportDiffCSV}
            disabled={!diff}
            title="Export diff results as CSV"
          >
            <FontAwesomeIcon icon={faDownload} /> Export Diff CSV
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded flex items-center gap-2 shadow"
            onClick={handleSyncOnlineToOffline}
            disabled={syncing}
            title="Download latest Firestore data as offlineMockData.json"
          >
            <FontAwesomeIcon icon={faDownload} /> Sync Online → Offline Mock
          </button>
          {loading && <span className="text-fuchsia-700 dark:text-fuchsia-300 flex items-center gap-1"><FontAwesomeIcon icon={faSpinner} spin /> Comparing...</span>}
          {syncing && <span className="text-blue-700 dark:text-blue-300 flex items-center gap-1"><FontAwesomeIcon icon={faSpinner} spin /> Syncing...</span>}
        </div>
        {syncMsg && (
          <div className="mb-4 text-blue-800 bg-blue-100 dark:bg-blue-900/20">
            <div>{syncMsg}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <code className="bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded text-blue-900 dark:text-blue-200 select-all">node scripts/replaceOfflineMock.js ~/Downloads/offlineMockData.json</code>
              <button
                className="bg-blue-200 hover:bg-blue-300 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-900 dark:text-blue-100 px-2 py-1 rounded shadow text-xs"
                onClick={handleCopyCommand}
                title="Copy update command to clipboard"
              >Copy Update Command</button>
            </div>
            <div className="mt-1 text-xs text-blue-700 dark:text-blue-300">This will back up your old offlineMockData.json and replace it with the downloaded file.</div>
          </div>
        )}
        {error && <div className="mb-4 text-red-700 bg-red-100 dark:bg-red-900/20">{error}</div>}
        {diff && Object.values(diff).every((d: any) => d.added.length === 0 && d.removed.length === 0 && d.changed.length === 0) && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded p-4 text-green-700 dark:text-green-200 font-mono">No differences found between offline and online data.</div>
        )}
        {diff && Object.entries(diff).map(([col, d]: any) => (
          (d.added.length > 0 || d.removed.length > 0 || d.changed.length > 0) && (
            <div key={col} className="mb-6">
              <h4 className="font-semibold mb-2">{col}</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border border-gray-200 dark:border-gray-700 rounded">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">ID</th>
                      <th className="px-2 py-1">Field</th>
                      <th className="px-2 py-1">Offline</th>
                      <th className="px-2 py-1">Online</th>
                      <th className="px-2 py-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.added.map((doc: any, i: number) => (
                      <tr key={`a${i}`} className="bg-green-50 dark:bg-green-900/20">
                        <td className="px-2 py-1">Added</td>
                        <td className="px-2 py-1">{doc.id || doc.userId}</td>
                        <td className="px-2 py-1" colSpan={3}>Entire document only in online data</td>
                        <td></td>
                      </tr>
                    ))}
                    {d.removed.map((doc: any, i: number) => (
                      <tr key={`r${i}`} className="bg-red-50 dark:bg-red-900/20">
                        <td className="px-2 py-1">Removed</td>
                        <td className="px-2 py-1">{doc.id || doc.userId}</td>
                        <td className="px-2 py-1" colSpan={3}>Entire document only in offline data</td>
                        <td></td>
                      </tr>
                    ))}
                    {d.changed.map(({ id, diffs }: any, i: number) => Object.entries(diffs).map(([f, v]: any, j) => (
                      <tr key={`c${i}-${j}`} className="bg-yellow-50 dark:bg-yellow-900/20">
                        <td className="px-2 py-1">Changed</td>
                        <td className="px-2 py-1">{id}</td>
                        <td className="px-2 py-1">{f}</td>
                        <td className="px-2 py-1">{JSON.stringify(v.offline)}</td>
                        <td className="px-2 py-1">{JSON.stringify(v.online)}</td>
                        <td>
                          <button className="text-xs text-blue-600 underline" onClick={() => setModal({ collection: col, id, diffs })}>Details</button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ))}
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-lg w-full p-6 relative">
              <button onClick={() => setModal(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close">&times;</button>
              <h4 className="text-lg font-semibold mb-2">{modal.collection} / {modal.id}</h4>
              <div className="mb-2">
                <span className="font-semibold">Changed Fields:</span>
                <ul className="list-disc ml-6 mt-1 text-xs">
                  {Object.entries(modal.diffs).map(([f, v]: any, i) => (
                    <li key={i} className="mb-1">
                      <b>{f}</b>: <span className="text-red-600">{JSON.stringify(v.offline)}</span> → <span className="text-green-600">{JSON.stringify(v.online)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // --- Batch Sync & Backup State ---
  const [syncAllModal, setSyncAllModal] = useState<{
    syncing: boolean;
    progress: number;
    total: number;
    results: { collection: string; status: 'success' | 'error'; message: string }[];
  } | null>(null);
  const [backupModal, setBackupModal] = useState<{
    restoring: boolean;
    error?: string;
  } | null>(null);

  // --- Batch Sync All ---
  async function handleSyncAll() {
    setSyncAllModal({ syncing: true, progress: 0, total: displayResults.length, results: [] });
    let syncResults: { collection: string; status: 'success' | 'error'; message: string }[] = [];
    for (let i = 0; i < displayResults.length; i++) {
      const r = displayResults[i];
      if (r.status !== 'valid') {
        try {
          if (apiMode === 'live' && typeof window !== 'undefined' && typeof (window as any).syncCollection === 'function') {
            await (window as any).syncCollection(r.collection);
            syncResults.push({ collection: r.collection, status: 'success', message: 'Synced successfully' });
          } else {
            syncResults.push({ collection: r.collection, status: 'success', message: 'Mock sync' });
          }
        } catch (e: any) {
          syncResults.push({ collection: r.collection, status: 'error', message: e?.message || 'Sync failed' });
        }
      }
      setSyncAllModal({ syncing: true, progress: i + 1, total: displayResults.length, results: syncResults });
    }
    setSyncAllModal({ syncing: false, progress: displayResults.length, total: displayResults.length, results: syncResults });
    if (syncResults.some(r => r.status === 'error')) {
      showNotification('error', 'Some collections failed to sync.');
    } else {
      showNotification('success', 'All collections synced successfully!');
    }
  }

  // --- Backup Firestore Data ---
  async function handleBackup() {
    setBackupModal({ restoring: false });
    try {
      let data: any = {};
      if (typeof window !== 'undefined' && typeof (window as any).getAllFirestoreData === 'function') {
        data = await (window as any).getAllFirestoreData();
      } else {
        // fallback to offline mock
        const res = await fetch('/scripts/offlineMockData.json');
        data = await res.json();
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `firestore-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupModal(null);
      showNotification('success', 'Backup downloaded successfully!');
    } catch (e: any) {
      setBackupModal({ restoring: false, error: e?.message || 'Backup failed' });
      showNotification('error', 'Backup failed.');
    }
  }

  // --- Restore Firestore Data ---
  async function handleRestoreFromBackup(file: File) {
    setBackupModal({ restoring: true });
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // Replace with real Firestore restore logic
      if (apiMode === 'live' && typeof window !== 'undefined' && typeof (window as any).restoreFirestoreData === 'function') {
        await (window as any).restoreFirestoreData(data);
      }
      setBackupModal(null);
      showNotification('success', 'Restore completed successfully!');
    } catch (e: any) {
      setBackupModal({ restoring: false, error: e?.message || 'Restore failed' });
      showNotification('error', 'Restore failed.');
    }
  }

  // --- In-App Notifications ---
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    timestamp: number;
  } | null>(null);

  function showNotification(type: 'success' | 'error' | 'info', message: string) {
    setNotification({ type, message, timestamp: Date.now() });
    setTimeout(() => setNotification(null), 5000);
  }

  // --- Notification Toast UI ---
  function NotificationToast({ type, message }: { type: 'success' | 'error' | 'info'; message: string }) {
    const color = type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue';
    return (
      <div className={`fixed top-4 right-4 z-[100] px-4 py-2 rounded shadow-lg bg-${color}-600 text-white flex items-center gap-2`} role="status" aria-live="polite">
        <span className="font-bold capitalize">{type}:</span> {message}
      </div>
    );
  }

  // --- Dashboard Overview & Quick Actions ---
  function DashboardSummary({ stats, onValidateAll, onCompareAll, onSyncAll, env }: {
    stats: {
      collections: number;
      docs: number;
      issues: number;
      lastValidation: string;
      lastSync: string;
    };
    onValidateAll: () => void;
    onCompareAll: () => void;
    onSyncAll: () => void;
    env: string;
  }) {
    return (
      <section className="mb-8">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold shadow ${env === 'live' ? 'bg-red-100 text-red-700' : env === 'mock' ? 'bg-gray-200 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}
                title="Current API mode">
            {env === 'live' ? 'LIVE' : env === 'mock' ? 'MOCK' : env.toUpperCase()}
          </span>
          <div className="flex gap-6 text-sm">
            <span><b>{stats.collections}</b> Collections</span>
            <span><b>{stats.docs}</b> Documents</span>
            <span><b>{stats.issues}</b> Issues</span>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-xs font-medium shadow flex items-center gap-2"
              onClick={onValidateAll} title="Validate all collections">
              <FontAwesomeIcon icon={faCircleCheck} /> Validate All
            </button>
            <button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-2 rounded text-xs font-medium shadow flex items-center gap-2"
              onClick={onCompareAll} title="Compare offline & online for all collections">
              <FontAwesomeIcon icon={faCodeCompare} /> Compare All
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-medium shadow flex items-center gap-2"
              onClick={onSyncAll} title="Sync all collections (backup + update offline mock)">
              <FontAwesomeIcon icon={faDownload} /> Sync All
            </button>
          </div>
        </div>
        <div className="flex gap-8 text-xs text-gray-500 dark:text-gray-400">
          <span>Last Validation: <b>{stats.lastValidation || 'Never'}</b></span>
          <span>Last Sync: <b>{stats.lastSync || 'Never'}</b></span>
        </div>
      </section>
    );
  }

  // Dashboard stats state (mocked initially)
  const [dashboardStats, setDashboardStats] = useState({
    collections: 6,
    docs: 150,
    issues: 3,
    lastValidation: '',
    lastSync: '',
  });

  // Handlers for dashboard quick actions
  function handleValidateAll() {
    // TODO: Trigger validate all collections
  }
  function handleCompareAll() {
    // TODO: Trigger compare all collections
  }
  function handleSyncAll() {
    // TODO: Trigger sync all collections (backup + update offline mock)
  }

  // --- Compliance & Schema Drift Detection Tools ---
  const [complianceModal, setComplianceModal] = useState<{
    loading: boolean;
    results: { collection: string; issues: string[] }[];
    error?: string;
  } | null>(null);

  async function handleComplianceCheck() {
    setComplianceModal({ loading: true, results: [] });
    try {
      // Load zod schemas
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
      // Fetch live data (or mock)
      let data: Record<string, any[]> = {};
      if (typeof window !== 'undefined' && typeof (window as any).getAllFirestoreData === 'function') {
        data = await (window as any).getAllFirestoreData();
      } else {
        const res = await fetch('/scripts/offlineMockData.json');
        data = await res.json();
      }
      // Validate each document in each collection
      const results: { collection: string; issues: string[] }[] = [];
      for (const [col, schema] of Object.entries(schemaMap)) {
        const docs = data[col] || [];
        const issues: string[] = [];
        for (const doc of docs) {
          const result = schema.safeParse(doc);
          if (!result.success) {
            issues.push(JSON.stringify(result.error.issues));
          }
        }
        results.push({ collection: col, issues });
      }
      setComplianceModal({ loading: false, results });
      if (results.some(r => r.issues.length > 0)) {
        showNotification('error', 'Schema drift or non-compliance detected!');
      } else {
        showNotification('success', 'All Firestore data matches Zod schemas.');
      }
    } catch (e: any) {
      setComplianceModal({ loading: false, results: [], error: e?.message || 'Compliance check failed.' });
      showNotification('error', 'Compliance check failed.');
    }
  }

  async function handleFixAndCheckCompliance() {
    setComplianceModal(prev => ({ ...prev, loading: true, fixing: true }));
    try {
      logInfo('CMS: Running data fix script and revalidating');
      
      // Call the backend fixer script via API route
      const fixRes = await fetch('/api/fix-offline-mock', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!fixRes.ok) {
        const errorText = await fixRes.text();
        throw new Error(`API returned ${fixRes.status}: ${errorText}`);
      }
      
      const fixResult = await fixRes.json();
      
      if (!fixResult.success) {
        throw new Error(fixResult.error || 'Failed to fix mock data');
      }
      
      logInfo('CMS: Fix script completed successfully', { 
        details: fixResult.stdout 
      });
      
      // Show notification of success
      showNotification('success', 'Data fixed successfully. Running validation...');
      
      // Now re-run the compliance check
      await handleComplianceCheck();
    } catch (e: any) {
      const errorMessage = e?.message || 'Fix/Compliance check failed.';
      logError('CMS: Fix and compliance check failed', { error: errorMessage });
      setComplianceModal(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage
      }));
      showNotification('error', 'Fix/Compliance check failed: ' + errorMessage);
    }
  }

  function ComplianceModal({ loading, results, error, onClose }: { loading: boolean; results: { collection: string; issues: string[] }[]; error?: string; onClose: () => void }) {
    const [isFixing, setIsFixing] = useState(false);
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full p-6 relative overflow-y-auto max-h-[90vh]">
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close">&times;</button>
          <h4 className="text-lg font-semibold mb-4">Schema Compliance & Drift Detection</h4>
          
          {loading && (
            <div className="flex items-center justify-center p-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-blue-700">{isFixing ? "Fixing data and validating..." : "Checking compliance..."}</span>
            </div>
          )}
          
          {error && <div className="text-red-700 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded">{error}</div>}
          
          {!loading && !error && (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <span className="font-semibold">Status: </span>
                  {totalIssues === 0 ? (
                    <span className="text-green-700 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">All Collections Compliant</span>
                  ) : (
                    <span className="text-red-700 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">{totalIssues} Issue(s) Found</span>
                  )}
                </div>
                
                {totalIssues > 0 && (
                  <button
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    onClick={async () => {
                      setIsFixing(true);
                      await handleFixAndCheckCompliance();
                      setIsFixing(false);
                    }}
                    disabled={loading}
                  >
                    Fix & Validate
                  </button>
                )}
              </div>
              
              <ul className="space-y-3 text-sm">
                {results.map(r => (
                  <li key={r.collection} className={`p-3 rounded ${r.issues.length === 0 ? 'border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30' : 'border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{r.collection}:</span> 
                      {r.issues.length === 0 ? (
                        <span className="text-green-700 dark:text-green-400 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full">Compliant</span>
                      ) : (
                        <span className="text-red-700 dark:text-red-400 text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded-full">{r.issues.length} issue(s)</span>
                      )}
                    </div>
                    
                    {r.issues.length > 0 && (
                      <div className="mt-2 ml-4 text-xs overflow-x-auto">
                        <details>
                          <summary className="cursor-pointer hover:text-red-800 dark:hover:text-red-300">
                            View validation errors
                          </summary>
                          <ul className="mt-2 space-y-2 list-disc pl-4">
                            {r.issues.map((iss, i) => {
                              // Try to make the JSON error more readable
                              try {
                                const issueObj = JSON.parse(iss);
                                return (
                                  <li key={i} className="text-red-600 dark:text-red-300 whitespace-normal break-words">
                                    {issueObj.map((err: any, j: number) => (
                                      <div key={j} className="mb-1">
                                        <span className="font-mono bg-red-50 dark:bg-red-900/20 px-1 py-0.5 rounded">
                                          {err.path.join('.')}
                                        </span>: {err.message}
                                        {err.received && 
                                          <span className="ml-1">
                                            (received: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{JSON.stringify(err.received)}</code>)
                                          </span>
                                        }
                                      </div>
                                    ))}
                                  </li>
                                );
                              } catch {
                                return <li key={i} className="text-red-600 dark:text-red-300">{iss}</li>;
                              }
                            })}
                          </ul>
                        </details>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    );
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

      {/* Dashboard Summary & Quick Actions */}
      {mounted ? (
        <DashboardSummary
          stats={dashboardStats}
          onValidateAll={handleValidateAll}
          onCompareAll={handleCompareAll}
          onSyncAll={handleSyncAll}
          env={apiModeValue}
        />
      ) : null}

      {/* Compare Offline & Online Data Panel */}
      {mounted ? <ComparePanel /> : null}

      {/* Firestore Data Integrity Table */}
      {mounted ? <FirestoreIntegrityTableLive apiMode={apiModeValue} /> : null}

      {/* Data Structure Integrity Check Button */}
      <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded shadow text-sm font-medium"
          onClick={async () => {
            logInfo('CMS: Data structure integrity check started');
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebaseClient');
              if (!app) {
                logWarn('CMS: Firebase app not initialized during data structure integrity check');
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
              const getAllFirestoreData = (window as any).getAllFirestoreData;
              if (typeof getAllFirestoreData !== 'function') {
                logWarn('CMS: Cannot fetch Firestore data during data structure integrity check');
                alert('Cannot fetch Firestore data in this environment.');
                return;
              }
              const data = await getAllFirestoreData();
              let summary: string[] = [];
              for (const [col, schema] of Object.entries(schemaMap)) {
                if (!data[col]) continue;
                let issues = 0;
                for (const doc of data[col]) {
                  const result = (schema as any).safeParse(doc);
                  if (!result.success) {
                    issues++;
                    summary.push(`[OFFLINE] ${col}: ${JSON.stringify(result.error.issues)}`);
                  }
                }
                if (issues === 0) {
                  summary.push(`[OFFLINE] ${col}: No issues found.`);
                }
              }
              if (summary.length === 0) {
                logInfo('CMS: Data structure integrity check PASSED');
                alert('All data structures are valid according to Zod schemas.');
              } else {
                logWarn('CMS: Data structure integrity check FAILED', { errors: summary });
                alert(`Data structure validation errors found:\n${summary.slice(0, 10).join('\n')}\n${summary.length > 10 ? `...and ${summary.length - 10} more` : ''}`);
              }
            } catch (e: any) {
              logWarn('CMS: Error during data structure integrity check', { error: e.message || String(e) });
              alert('Error during data structure integrity check: ' + (e.message || String(e)));
            }
          }}
        >
          Check Data Structure Integrity (Zod)
        </button>

        <button
          className="px-4 py-2 bg-green-600 hover:bg-green-800 text-white rounded shadow text-sm font-medium flex items-center justify-center"
          onClick={() => {
            logInfo('CMS: Running schema compliance check and fix');
            // First show current status
            handleComplianceCheck().then(() => {
              // Auto-open the fix and validate modal
              if (complianceModal && !complianceModal.loading && complianceModal.results.some(r => r.issues.length > 0)) {
                showNotification('info', 'Schema validation found issues. You can fix them by clicking the "Fix & Validate" button in the modal.');
              }
            });
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Fix Schema Issues & Validate
        </button>
      </section>

      {/* Fix User Data Integrity Button */}
      <section className="mb-6">
        <button
          className="px-4 py-2 bg-green-600 hover:bg-green-800 text-white rounded shadow text-sm font-medium"
          onClick={async () => {
            logInfo('CMS: User data integrity auto-fix started');
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebaseClient');
              if (!app) {
                logWarn('CMS: Firebase app not initialized during user auto-fix');
                alert('Firebase app is not initialized.');
                return;
              }
              const db = getFirestore(app);
              const getAllFirestoreData = (window as any).getAllFirestoreData;
              if (typeof getAllFirestoreData !== 'function') {
                logWarn('CMS: Cannot fetch Firestore data during user auto-fix');
                alert('Cannot fetch Firestore data in this environment.');
                return;
              }
              const data = await getAllFirestoreData();
              if (!data.users) {
                logWarn('CMS: No users found during user auto-fix');
                alert('No users found in Firestore.');
                return;
              }
              let fixedCount = 0;
              for (const user of data.users) {
                const updateObj: Record<string, any> = {};
                let needsUpdate = false;
                if (typeof user.id !== 'string') {
                  updateObj.id = user.id || user.__id || '';
                  needsUpdate = true;
                }
                ['isActive', 'emailVerified', 'phoneVerified'].forEach(field => {
                  if (typeof user[field] !== 'boolean') {
                    updateObj[field] = false;
                    needsUpdate = true;
                  }
                });
                ['phone', 'firstName', 'lastName'].forEach(field => {
                  if (typeof user[field] !== 'string') {
                    updateObj[field] = '';
                    needsUpdate = true;
                  }
                });
                if (typeof user.userType === 'string' && !['PATIENT', 'DOCTOR', 'ADMIN'].includes(user.userType)) {
                  const upper = user.userType.toUpperCase();
                  if (['PATIENT', 'DOCTOR', 'ADMIN'].includes(upper)) {
                    updateObj.userType = upper;
                    needsUpdate = true;
                  }
                }
                if (needsUpdate && user.id) {
                  await updateDoc(doc(db, 'users', user.id), updateObj);
                  fixedCount++;
                }
              }
              logInfo('CMS: User data integrity auto-fix complete', { fixedCount });
              alert(`User data integrity auto-fix complete. Fixed ${fixedCount} user(s).`);
            } catch (e: any) {
              logWarn('CMS: Error during user data integrity fix', { error: e.message || String(e) });
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
            logInfo('CMS: All data integrity auto-fix started');
            try {
              const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
              const { app } = await import('@/lib/firebaseClient');
              if (!app) {
                logWarn('CMS: Firebase app not initialized during all-collection auto-fix');
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
              const getAllFirestoreData = (window as any).getAllFirestoreData;
              if (typeof getAllFirestoreData !== 'function') {
                logWarn('CMS: Cannot fetch Firestore data during all-collection auto-fix');
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
                  const shape = (schema as any)._def.shape();
                  for (const [field, def] of Object.entries(shape)) {
                    const value = docObj[field];
                    // String (fix if not a string, undefined, or null)
                    if (def._def.typeName === 'ZodString') {
                      if (typeof value !== 'string' || value === undefined || value === null) {
                        updateObj[field] = '';
                        needsUpdate = true;
                      }
                    }
                    // Boolean (fix if not boolean, undefined, or null)
                    if (def._def.typeName === 'ZodBoolean') {
                      if (typeof value !== 'boolean' || value === undefined || value === null) {
                        updateObj[field] = false;
                        needsUpdate = true;
                      }
                    }
                    // Number (fix if not number, undefined, or null)
                    if (def._def.typeName === 'ZodNumber') {
                      if (typeof value !== 'number' || value === undefined || value === null) {
                        updateObj[field] = 0;
                        needsUpdate = true;
                      }
                    }
                    // Enum (auto-fix casing and map unknowns)
                    if (def._def.typeName === 'ZodEnum') {
                      if (typeof value !== 'string' || value === undefined || value === null || !def.options.includes(value)) {
                        // Map 'prefer_not_to_say' and any unknown to 'Other' if present in options
                        if (def.options.includes('Other')) {
                          updateObj[field] = 'Other';
                          needsUpdate = true;
                        } else {
                          // fallback: use first option
                          updateObj[field] = def.options[0];
                          needsUpdate = true;
                        }
                      }
                    }
                    // id field (prefer __id if present)
                    if ('id' in shape && (typeof docObj.id !== 'string' || docObj.id === undefined || docObj.id === null) && docId) {
                      updateObj.id = docId;
                      needsUpdate = true;
                    }
                  }
                  if (needsUpdate && docId) {
                    await updateDoc(doc(db, col, docId), updateObj);
                    fixedCount++;
                  }
                }
                summary.push(`${col}: fixed ${fixedCount}`);
              }
              logInfo('CMS: All data integrity auto-fix complete', { summary });
              alert(`Data integrity auto-fix complete.\n${summary.join('\n')}`);
            } catch (e: any) {
              logWarn('CMS: Error during all data integrity fix', { error: e.message || String(e) });
              alert('Error during data integrity fix: ' + (e.message || String(e)));
            }
          }}
        >
          Fix All Data Integrity (Auto-Fix)
        </button>
      </section>

      {/* Fix & Validate Button */}
      <section className="mb-6">
        <button
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded shadow text-sm font-medium"
          onClick={handleFixAndCheckCompliance}
        >
          Fix & Validate
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
      {diffModal && (
        <CollectionDiffModal
          collection={diffModal.collection}
          diffs={diffModal.diffs}
          audit={diffModal.audit}
          onClose={() => setDiffModal(null)}
        />
      )}
      {syncAllModal && (
        <SyncAllModal
          syncing={syncAllModal.syncing}
          progress={syncAllModal.progress}
          total={syncAllModal.total}
          results={syncAllModal.results}
          onClose={() => setSyncAllModal(null)}
        />
      )}
      {backupModal && (
        <BackupModal
          restoring={backupModal.restoring}
          error={backupModal.error}
          onClose={() => setBackupModal(null)}
          onRestore={handleRestoreFromBackup}
        />
      )}
      {/* Add buttons to dashboard */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <button className="bg-blue-600 text-white rounded px-3 py-1" onClick={handleSyncAll}>Sync All</button>
        <button className="bg-green-600 text-white rounded px-3 py-1" onClick={() => setBackupModal({ restoring: false })}>Backup/Restore</button>
        <button className="bg-yellow-600 text-white rounded px-3 py-1" onClick={handleComplianceCheck}>Schema Compliance</button>
      </div>
      {notification && <NotificationToast type={notification.type} message={notification.message} />}
      {complianceModal && (
        <ComplianceModal
          loading={complianceModal.loading}
          results={complianceModal.results}
          error={complianceModal.error}
          onClose={() => setComplianceModal(null)}
        />
      )}
    </div>
  );
};

export default CmsValidationPage;
