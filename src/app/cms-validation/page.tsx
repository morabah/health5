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
    const [filter, setFilter] = useState<'all' | 'issues' | 'valid'>('all');
    const [sort, setSort] = useState<'name' | 'issues'>('issues');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [search, setSearch] = useState('');
    const [modalDoc, setModalDoc] = useState<{ doc: any, issues: any[], collection: string } | null>(null);
    const { loading, results, logs, error, validateAll, validateCollection } = useLiveValidationData(apiMode);

    // Filter/sort/search logic
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

    // CSV export
    function exportCSV() {
      const header = ['Collection', 'Status', 'Issues', 'Last Checked'];
      const rows = displayResults.map(r => [r.collection, r.status, r.issues, r.lastChecked]);
      const csv = [header, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'firestore_validation_results.csv';
      a.click();
      URL.revokeObjectURL(url);
    }

    // Drilldown modal
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
                  <li key={i} className="text-red-600 dark:text-red-300">{iss.path.join('.')} — {iss.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return (
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
          <h2 className="text-xl font-semibold">Firestore Collections Data Integrity ({apiMode})</h2>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded transition shadow-sm flex items-center gap-2"
              onClick={validateAll}
              disabled={loading}
              title="Re-validate all collections"
            >
              {loading && <FontAwesomeIcon icon={faSpinner} spin />} Validate All
            </button>
            <button
              className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs px-3 py-2 rounded transition flex items-center gap-2"
              onClick={exportCSV}
              title="Export validation results as CSV"
            >
              <FontAwesomeIcon icon={faDownload} /> Export CSV
            </button>
            <input
              type="text"
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              placeholder="Search collections..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search collections"
              style={{ minWidth: 120 }}
            />
            <select
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              title="Filter collections by status"
            >
              <option value="all">All</option>
              <option value="issues">Issues</option>
              <option value="valid">Valid</option>
            </select>
            <select
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              title="Sort collections"
            >
              <option value="issues">Sort by Issues</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
        {error && <div className="mb-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 px-4 py-2 rounded">{error}</div>}
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-4"><FontAwesomeIcon icon={faSpinner} spin /> Validating...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ position: 'relative' }}>
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Collection
                    <span className="ml-1 text-gray-400 cursor-help" title="Firestore collection name">?</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Status
                    <span className="ml-1 text-gray-400 cursor-help" title="Validation status">?</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Issues
                    <span className="ml-1 text-gray-400 cursor-help" title="Number of documents with validation errors">?</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Last Checked
                    <span className="ml-1 text-gray-400 cursor-help" title="Last validation time">?</span>
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {displayResults.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-8">No collections found.</td></tr>
                ) : (
                  displayResults.map((col) => (
                    <tr key={col.collection}>
                      <td className="px-4 py-3 font-mono text-sm">{col.collection}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${statusColors[col.status]}`}
                          title={col.status}
                        >
                          <FontAwesomeIcon icon={statusIcons[col.status]} /> {col.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{col.issues}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400" title={col.lastChecked}>{col.lastChecked}</td>
                      <td className="px-4 py-3 text-right flex gap-2">
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded transition"
                          onClick={() => validateCollection(col.collection)}
                          disabled={loading}
                          title="Re-validate this collection"
                        >
                          Validate
                        </button>
                        {/* Future: Auto-Fix button here if implemented */}
                        <button
                          className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs px-3 py-1 rounded transition"
                          disabled
                          title="Auto-fix not yet implemented"
                        >
                          Auto-Fix
                        </button>
                        <button
                          className="ml-2 text-xs text-blue-600 dark:text-blue-400 underline"
                          onClick={() => setExpanded(e => ({ ...e, [col.collection]: !e[col.collection] }))}
                          aria-expanded={!!expanded[col.collection]}
                          aria-controls={`logs-${col.collection}`}
                        >
                          {expanded[col.collection] ? 'Hide Logs' : 'Show Logs'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Collapsible Logs for collections with issues */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Validation Logs</h3>
          {displayResults.filter(c => c.issues > 0).length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-4 text-gray-700 dark:text-gray-200">No issues found.</div>
          ) : (
            displayResults.filter(c => c.issues > 0).map((col) => (
              <div key={col.collection} className="mb-4">
                <div className="flex items-center mb-1">
                  <span className="font-semibold">{col.collection}</span>
                  <button
                    className="ml-2 text-xs text-blue-600 dark:text-blue-400 underline"
                    onClick={() => setExpanded(e => ({ ...e, [col.collection]: !e[col.collection] }))}
                    aria-expanded={!!expanded[col.collection]}
                    aria-controls={`logs-${col.collection}`}
                  >
                    {expanded[col.collection] ? 'Hide' : 'Show'}
                  </button>
                </div>
                {expanded[col.collection] && (
                  <div id={`logs-${col.collection}`} className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs font-mono text-gray-700 dark:text-gray-200">
                    {logs[col.collection]?.map((log, i) => {
                      // Try to extract doc id and issues for drilldown
                      let docId = null, issues = [];
                      try {
                        const match = log.match(/^Doc ([^:]+): (.+)$/);
                        if (match) {
                          docId = match[1];
                          issues = JSON.parse(match[2]);
                        }
                      } catch {}
                      return (
                        <div key={i} className="flex items-center gap-2 py-1">
                          <span>{log}</span>
                          {docId && issues.length > 0 && (
                            <button
                              className="text-xs text-blue-600 underline ml-2"
                              onClick={() => {
                                // Find the doc in results for modal
                                const colData = results.find(r => r.collection === col.collection);
                                const data = (colData && colData.logs && colData.logs[i]) ? colData : null;
                                const doc = null; // Not available in logs; would require backend support
                                setModalDoc({ doc: { id: docId }, issues, collection: col.collection });
                              }}
                              title="View document details"
                            >
                              <FontAwesomeIcon icon={faSearch} /> Details
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {/* Modal for document drilldown */}
        {modalDoc && <DocModal {...modalDoc} onClose={() => setModalDoc(null)} />}
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
          <div className="mb-4 text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-200 px-4 py-2 rounded">
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
        {error && <div className="mb-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 px-4 py-2 rounded">{error}</div>}
        {diff && Object.values(diff).every((d: any) => d.added.length === 0 && d.removed.length === 0 && d.changed.length === 0) && (
          <div className="bg-green-50 dark:bg-green-900 rounded p-4 text-green-700 dark:text-green-200 font-mono">No differences found between offline and online data.</div>
        )}
        {diff && Object.entries(diff).map(([col, d]: any) => (
          (d.added.length > 0 || d.removed.length > 0 || d.changed.length > 0) && (
            <div key={col} className="mb-6">
              <h4 className="font-semibold mb-2 text-base">{col}</h4>
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
                      <tr key={`a${i}`} className="bg-green-50 dark:bg-green-900">
                        <td className="px-2 py-1">Added</td>
                        <td className="px-2 py-1">{doc.id || doc.userId}</td>
                        <td className="px-2 py-1" colSpan={3}>Entire document only in online data</td>
                        <td></td>
                      </tr>
                    ))}
                    {d.removed.map((doc: any, i: number) => (
                      <tr key={`r${i}`} className="bg-red-50 dark:bg-red-900">
                        <td className="px-2 py-1">Removed</td>
                        <td className="px-2 py-1">{doc.id || doc.userId}</td>
                        <td className="px-2 py-1" colSpan={3}>Entire document only in offline data</td>
                        <td></td>
                      </tr>
                    ))}
                    {d.changed.map(({ id, diffs }: any, i: number) => Object.entries(diffs).map(([f, v]: any, j) => (
                      <tr key={`c${i}-${j}`} className="bg-yellow-50 dark:bg-yellow-900">
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

      {/* Compare Offline & Online Data Panel */}
      {mounted ? <ComparePanel /> : null}

      {/* Firestore Data Integrity Table */}
      {mounted ? <FirestoreIntegrityTableLive apiMode={apiModeValue} /> : null}

      {/* Data Structure Integrity Check Button */}
      <section className="mb-6">
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-800 text-white rounded shadow text-sm font-medium"
          onClick={async () => {
            logInfo('CMS: Data structure integrity check started');
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
                logWarn('CMS: Online data fetch unavailable during integrity check');
                alert('Online data fetch is not available in this environment.');
                return;
              }
              const results: string[] = [];
              for (const [key, schema] of Object.entries(schemaMap)) {
                if (offlineRes[key]) {
                  for (const [i, doc] of offlineRes[key].entries()) {
                    const result = schema.safeParse(doc);
                    if (!result.success) {
                      results.push(`[OFFLINE] ${key}[${i}]: ${JSON.stringify(result.error.issues)}`);
                    }
                  }
                }
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
                logInfo('CMS: Data structure integrity check PASSED');
                alert('All data structures are valid according to Zod schemas.');
              } else {
                logWarn('CMS: Data structure integrity check FAILED', { errors: results });
                alert(`Data structure validation errors found:\n${results.slice(0, 10).join('\n')}\n${results.length > 10 ? `...and ${results.length - 10} more` : ''}`);
              }
            } catch (e: any) {
              logWarn('CMS: Error during data structure integrity check', { error: e.message || String(e) });
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
                        logInfo(`Auto-fix: Setting string field '${field}' to '' for doc ${docId} in ${col}`);
                      }
                    }
                    // Boolean (fix if not boolean, undefined, or null)
                    if (def._def.typeName === 'ZodBoolean') {
                      if (typeof value !== 'boolean' || value === undefined || value === null) {
                        updateObj[field] = false;
                        needsUpdate = true;
                        logInfo(`Auto-fix: Setting boolean field '${field}' to false for doc ${docId} in ${col}`);
                      }
                    }
                    // Number (fix if not number, undefined, or null)
                    if (def._def.typeName === 'ZodNumber') {
                      if (typeof value !== 'number' || value === undefined || value === null) {
                        updateObj[field] = 0;
                        needsUpdate = true;
                        logInfo(`Auto-fix: Setting number field '${field}' to 0 for doc ${docId} in ${col}`);
                      }
                    }
                    // Enum (auto-fix casing and map unknowns)
                    if (def._def.typeName === 'ZodEnum') {
                      if (typeof value !== 'string' || value === undefined || value === null || !def.options.includes(value)) {
                        // Map 'prefer_not_to_say' and any unknown to 'Other' if present in options
                        if (def.options.includes('Other')) {
                          updateObj[field] = 'Other';
                          needsUpdate = true;
                          logInfo(`Auto-fix: Setting enum field '${field}' to 'Other' for doc ${docId} in ${col}`);
                        } else {
                          // fallback: use first option
                          updateObj[field] = def.options[0];
                          needsUpdate = true;
                          logInfo(`Auto-fix: Setting enum field '${field}' to '${def.options[0]}' for doc ${docId} in ${col}`);
                        }
                      }
                    }
                    // id field (prefer __id if present)
                    if ('id' in shape && (typeof docObj.id !== 'string' || docObj.id === undefined || docObj.id === null) && docId) {
                      updateObj.id = docId;
                      needsUpdate = true;
                      logInfo(`Auto-fix: Setting id field for doc ${docId} in ${col}`);
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
