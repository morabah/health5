"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { mockGetNotifications, mockMarkNotificationRead } from "@/lib/mockApiService";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/dateUtils";

interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: Date | import("firebase/firestore").Timestamp;
  isRead: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const { user } = useAuth();

  async function fetchNotifications() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const items = await mockGetNotifications(user.uid);
      setNotifications(items);
    } catch (err) {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    setMarkingId(id);
    try {
      await mockMarkNotificationRead({ notificationId: id, userId: user.uid });
      await fetchNotifications();
    } catch {}
    setMarkingId(null);
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Notifications</h1>
      <Card className="w-full max-w-2xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Notifications</h2>
          <Link href="/">
            <Button label="Back to Home" pageName="Notifications" />
          </Link>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && notifications.length === 0 && (
          <EmptyState
            title="No notifications."
            message="You have no notifications at this time. Important updates will appear here."
            className="my-8"
          />
        )}
        {!loading && notifications.length > 0 && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map(n => (
              <li key={n.id} className={`py-4 flex flex-col gap-1 ${n.isRead ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{n.type}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(n.createdAt)}</span>
                </div>
                <div className="text-gray-700 dark:text-gray-300">{n.message}</div>
                {!n.isRead && (
                  <Button 
                    size="sm" 
                    onClick={() => handleMarkRead(n.id)} 
                    disabled={markingId === n.id}
                    label={markingId === n.id ? "Marking..." : "Mark as Read"}
                    pageName="NotificationsPage"
                  >
                    {markingId === n.id ? "Marking..." : "Mark as Read"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
