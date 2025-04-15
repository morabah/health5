"use client";
import React, { useState } from "react";
import { appEventBus } from "@/lib/eventBus";
import { logInfo, logError } from "@/lib/logger";

// Utility to deeply compare two objects/arrays
function deepDiff(a: any, b: any): { added: any[]; removed: any[]; changed: any[] } {
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

export const DataSyncPanel: React.FC = () => {
  const [diff, setDiff] = useState<{ added: any[]; removed: any[]; changed: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCompared, setLastCompared] = useState<string | null>(null);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      logInfo("Comparing offline and online data", {});
      const [offline, online] = await Promise.all([
        fetchOfflineData(),
        fetchOnlineData(),
      ]);
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
      <button
        className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium shadow mb-3"
        onClick={handleCompare}
        disabled={loading}
      >
        {loading ? "Comparing..." : "Compare Offline & Online Data"}
      </button>
      {lastCompared && <p className="text-xs text-gray-500 mb-2">Last compared: {lastCompared}</p>}
      {error && <p className="text-xs text-red-600 mb-2">Error: {error}</p>}
      {diff && (
        <div className="mt-2">
          <h3 className="font-semibold mb-1">Diff Summary</h3>
          {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 ? (
            <p className="text-green-600">Offline and online data are in sync.</p>
          ) : (
            <>
              {diff.added.length > 0 && <p className="text-emerald-700">Added: {diff.added.length}</p>}
              {diff.removed.length > 0 && <p className="text-red-700">Removed: {diff.removed.length}</p>}
              {diff.changed.length > 0 && <p className="text-orange-700">Changed: {diff.changed.length}</p>}
              <div className="flex gap-2 mt-3">
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
