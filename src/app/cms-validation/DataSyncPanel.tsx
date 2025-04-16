"use client";
import React, { useState } from "react";
import { appEventBus } from "@/lib/eventBus";
import { logInfo, logError } from "@/lib/logger";
import "@/lib/firestoreFetchAll";
import { Disclosure } from '@headlessui/react';

// Utility to deeply compare two objects/arrays
export function deepDiff(a: any, b: any): { added: any[]; removed: any[]; changed: any[] } {
  // Only compares top-level collections and their array items by id
  const added: any[] = [];
  const removed: any[] = [];
  const changed: any[] = [];
  for (const key of Object.keys(a)) {
    if (!b[key]) {
      added.push({ collection: key, items: a[key] });
      continue;
    }
    const aArr = Array.isArray(a[key]) ? a[key] : [];
    const bArr = Array.isArray(b[key]) ? b[key] : [];
    const bById = Object.fromEntries(bArr.map((x: any) => [x.id || x.userId, x]));
    for (const item of aArr) {
      const id = item.id || item.userId;
      if (!bById[id]) {
        added.push({ collection: key, item });
      } else if (JSON.stringify(item) !== JSON.stringify(bById[id])) {
        changed.push({ collection: key, id, from: bById[id], to: item });
      }
    }
  }
  for (const key of Object.keys(b)) {
    if (!a[key]) {
      removed.push({ collection: key, items: b[key] });
      continue;
    }
    const aArr = Array.isArray(a[key]) ? a[key] : [];
    const bArr = Array.isArray(b[key]) ? b[key] : [];
    const aById = Object.fromEntries(aArr.map((x: any) => [x.id || x.userId, x]));
    for (const item of bArr) {
      const id = item.id || item.userId;
      if (!aById[id]) {
        removed.push({ collection: key, item });
      }
    }
  }
  return { added, removed, changed };
}

async function fetchOfflineData(): Promise<any> {
  const res = await fetch("/scripts/offlineMockData.json");
  return res.json();
}

async function fetchOnlineData(): Promise<any> {
  // This requires Firestore client SDK to be initialized in the browser
  // For demo, we assume window.getAllFirestoreData is available (to be implemented in a real app)
  if (typeof window !== "undefined" && typeof (window as any).getAllFirestoreData === "function") {
    return await (window as any).getAllFirestoreData();
  }
  throw new Error("Firestore data fetch not implemented in browser. Implement getAllFirestoreData().");
}

function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface DataSyncPanelProps {
  selectedCollection?: string | null;
  selectedCollectionData?: any[] | null;
  apiMode?: string;
}

function CollectionDiff({ title, items, color, renderItem }: { title: string; items: any[]; color: string; renderItem: (item: any, idx: number) => React.ReactNode }) {
  if (!items.length) return null;
  return (
    <Disclosure defaultOpen={false} as="div" className="mb-2">
      {({ open }) => (
        <>
          <Disclosure.Button className={`w-full flex justify-between items-center px-3 py-2 rounded bg-${color}-50 dark:bg-${color}-900/30 border border-${color}-300 text-${color}-800 dark:text-${color}-100 font-semibold text-xs shadow-sm hover:bg-${color}-100 focus:outline-none mb-1`}>
            <span>{title} <span className="font-mono">({items.length})</span></span>
            <span className="ml-2">{open ? '▼' : '▶'}</span>
          </Disclosure.Button>
          <Disclosure.Panel className="pl-3 pr-1 py-1">
            <ul className="space-y-1 text-xs">
              {items.map(renderItem)}
            </ul>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}

export const DataSyncPanel: React.FC<DataSyncPanelProps> = ({ selectedCollection, selectedCollectionData, apiMode }) => {
  const [diff, setDiff] = useState<{ added: any[]; removed: any[]; changed: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCompared, setLastCompared] = useState<string | null>(null);
  const [onlineData, setOnlineData] = useState<any | null>(null);

  const handleCompare = async () => {
    console.log('[CMS DEBUG] handleCompare triggered');
    setLoading(true);
    setError(null);
    try {
      logInfo("Comparing offline and online data", {});
      const [offline, online] = await Promise.all([
        fetchOfflineData(),
        fetchOnlineData(),
      ]);
      if (!offline || typeof offline !== 'object' || !online || typeof online !== 'object') {
        throw new Error('Offline or online data is missing or not an object');
      }
      setOnlineData(online);
      const d = deepDiff(offline, online);
      setDiff(d);
      setLastCompared(new Date().toISOString());
      logInfo("Comparison complete", d);
    } catch (e: any) {
      setError(e.message || String(e));
      logError("Error comparing offline/online data", { error: e });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncOfflineToOnline = async () => {
    logInfo("Syncing offline data to Firestore (online)", {});
    // This requires a real implementation (API or SDK call)
    alert("Sync Offline → Online not implemented. Implement Firestore upload logic.");
  };

  const handleSyncOnlineToOffline = async () => {
    logInfo("Syncing Firestore data to offline JSON", {});
    try {
      const online = await fetchOnlineData();
      downloadJSON(online, "offlineMockData.json");
    } catch (e: any) {
      setError(e.message || String(e));
      logError("Error syncing online to offline", { error: e });
    }
  };

  return (
    <section className="mb-6 p-4 border border-yellow-300 rounded bg-yellow-50 dark:bg-yellow-900/20">
      <h2 className="text-lg font-semibold mb-2">Offline / Online Data Sync</h2>
      <div className="mb-3">
        <a
          href="/scripts/offlineMockData.json"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 text-xs font-mono"
        >
          View offlineMockData.json
        </a>
      </div>
      <button
        className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium shadow mb-3"
        onClick={handleCompare}
        disabled={loading}
      >
        {loading ? "Comparing..." : "Compare Offline & Online Data"}
      </button>
      {lastCompared && <p className="text-xs text-gray-500 mb-2">Last compared: {lastCompared}</p>}
      {error && (
        <div className="text-red-600 text-xs mt-2">
          Error: {error}
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-1">
          <h4 className="text-xs font-semibold mb-1">
            {selectedCollection
              ? `${selectedCollection.charAt(0).toUpperCase() + selectedCollection.slice(1)} Data (${apiMode === 'live' || apiMode === 'online' ? 'Online' : 'Offline'})`
              : apiMode === 'live' || apiMode === 'online'
                ? 'Online Data'
                : 'Offline Data'}
          </h4>
          <textarea
            className="w-full h-48 text-xs font-mono border rounded p-2 bg-gray-50 dark:bg-gray-800"
            value={selectedCollectionData ? JSON.stringify(selectedCollectionData, null, 2) : ''}
            readOnly
          />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-semibold mb-1">Online Data</h4>
          <textarea
            className="w-full h-48 text-xs font-mono border rounded p-2 bg-gray-50 dark:bg-gray-800"
            value={onlineData ? JSON.stringify(onlineData, null, 2) : ''}
            readOnly
          />
        </div>
      </div>
      {diff && (
        <div className="mt-2">
          <h3 className="font-semibold mb-1">Diff Summary</h3>
          {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 ? (
            <p className="text-green-600">Offline and online data are in sync.</p>
          ) : (
            <>
              <div className="flex gap-4 mb-2">
                {diff.added.length > 0 && <span className="text-emerald-700">Added: {diff.added.length}</span>}
                {diff.removed.length > 0 && <span className="text-red-700">Removed: {diff.removed.length}</span>}
                {diff.changed.length > 0 && <span className="text-orange-700">Changed: {diff.changed.length}</span>}
              </div>
              {/* Per-collection grouped diff display */}
              <div className="space-y-2">
                <CollectionDiff
                  title="Added"
                  items={diff.added}
                  color="emerald"
                  renderItem={(item, idx) => (
                    <li key={idx} className="bg-emerald-100 dark:bg-emerald-900/40 rounded p-2 overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-all">{JSON.stringify(item, null, 2)}</pre>
                    </li>
                  )}
                />
                <CollectionDiff
                  title="Removed"
                  items={diff.removed}
                  color="red"
                  renderItem={(item, idx) => (
                    <li key={idx} className="bg-red-100 dark:bg-red-900/40 rounded p-2 overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-all">{JSON.stringify(item, null, 2)}</pre>
                    </li>
                  )}
                />
                <CollectionDiff
                  title="Changed"
                  items={diff.changed}
                  color="orange"
                  renderItem={(item, idx) => (
                    <li key={idx} className="bg-orange-100 dark:bg-orange-900/40 rounded p-2 overflow-x-auto">
                      <div className="font-mono text-xs mb-1">ID: {item.id}</div>
                      <div className="flex flex-col md:flex-row gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-xs mb-0.5">From (Online):</div>
                          <pre className="whitespace-pre-wrap break-all bg-orange-50 dark:bg-orange-950/40 rounded p-1">{JSON.stringify(item.from, null, 2)}</pre>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-xs mb-0.5">To (Offline):</div>
                          <pre className="whitespace-pre-wrap break-all bg-orange-50 dark:bg-orange-950/40 rounded p-1">{JSON.stringify(item.to, null, 2)}</pre>
                        </div>
                      </div>
                    </li>
                  )}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium shadow"
                  onClick={handleSyncOfflineToOnline}
                >
                  Sync Offline → Online
                </button>
                <button
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium shadow"
                  onClick={handleSyncOnlineToOffline}
                >
                  Sync Online → Offline
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};
