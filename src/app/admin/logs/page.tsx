"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { mockGetSystemLogs } from "@/lib/mockApiService";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  user?: string;
  context?: string;
}

const LogListPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "info" | "warn" | "error">("all");

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const items = await mockGetSystemLogs();
        setLogs(items.map(item => ({
          ...item,
          level: item.level === 'info' || item.level === 'warn' || item.level === 'error' ? item.level : 'info',
        })));
      } catch (err) {
        setError("Failed to load logs.");
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filtered = filter === "all" ? logs : logs.filter(log => log.level === filter);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">System Logs</h1>
      <Card className="w-full max-w-5xl mb-8 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Log Entries</h2>
          <div className="flex gap-2 items-center">
            <label htmlFor="filter" className="text-sm font-medium">Level:</label>
            <select
              id="filter"
              className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100"
              value={filter}
              onChange={e => setFilter(e.target.value as "all" | "info" | "warn" | "error")}
            >
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title="No logs found."
            message="There are no log entries in this category."
            className="my-8"
          />
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Context</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">{log.timestamp}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        log.level === "info" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                        log.level === "warn" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-pre-wrap">{log.message}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{log.user || "-"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{log.context || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
};

export default LogListPage;
