"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { loadNotifications } from '@/data/notificationLoaders';

interface Notification {
  id: string;
  type: string;
  message: string;
  date: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      setError(null);
      try {
        const items = await loadNotifications('mockUserId');
        setNotifications(items);
      } catch (err) {
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Notifications</h1>
      <Card className="w-full max-w-2xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Notifications</h2>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && notifications.length === 0 && (
          <div className="text-gray-600 dark:text-gray-300">No notifications found.</div>
        )}
        {!loading && notifications.length > 0 && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map(n => (
              <li key={n.id} className={`py-4 flex flex-col gap-1 ${n.read ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{n.type}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{n.date}</span>
                </div>
                <div className="text-gray-700 dark:text-gray-300">{n.message}</div>
                <div>
                  <Button size="sm" onClick={() => console.log('Mark as read', n.id)} disabled={n.read}>
                    Mark as Read
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
