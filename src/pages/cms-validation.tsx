/** Development CMS & Validation Control Panel */
import React, { useState, useEffect, useCallback } from 'react';
import { appEventBus, LogPayload, ValidationPayload } from '../lib/eventBus';
import { logInfo } from '../lib/logger';

/**
 * CMS / Validation Control Panel Page
 *
 * Provides a live dashboard for validation steps and logs, powered by the global appEventBus.
 * Allows toggling API mode (mock/live) in local state, launching the app, and clearing logs.
 *
 * State:
 * - validationSteps: Tracks status/details for each validation prompt.
 * - logs: Stores recent log events (max 100).
 * - apiMode: Local state for current API mode (manual env change required for real effect).
 */
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
  const [apiMode, setApiMode] = useState<'mock' | 'live'>(
    (process.env.NEXT_PUBLIC_API_MODE as 'mock' | 'live') || 'mock'
  );

  // Subscribe to log and validation events
  useEffect(() => {
    /**
     * Handles log events by prepending new logs and limiting array size.
     */
    const handleLog = (payload: LogPayload) => {
      setLogs(prev => [payload, ...prev.slice(0, MAX_LOGS - 1)]);
    };
    /**
     * Handles validation events by updating the validationSteps state.
     */
    const handleValidation = (payload: ValidationPayload) => {
      setValidationSteps(prev => ({
        ...prev,
        [payload.promptId]: { status: payload.status, details: payload.details },
      }));
    };
    appEventBus.on('log_event', handleLog);
    appEventBus.on('validation_event', handleValidation);
    // Cleanup subscriptions on unmount
    return () => {
      appEventBus.off('log_event', handleLog);
      appEventBus.off('validation_event', handleValidation);
    };
  }, []);

  /**
   * Handles API mode switch. Only updates local state and logs the action.
   * Real API mode change requires editing .env.local and reloading the page.
   */
  const handleModeSwitch = useCallback((mode: 'mock' | 'live') => {
    setApiMode(mode);
    logInfo(`CMS: Switched API Mode state to -> ${mode}. NOTE: Requires page reload to affect Firebase SDK init.`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100 p-6">
      {/* Title Section */}
      <h1 className="text-2xl font-bold mb-4">CMS / Validation Control Panel</h1>

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
          className="inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
          rel="noopener noreferrer"
        >
          Launch App Homepage
        </a>
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
          <h2 className="text-lg font-semibold">Logs</h2>
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
            <span className="text-gray-400 italic">No logs yet.</span>
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
