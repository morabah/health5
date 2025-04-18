"use client";
import React, { useEffect, useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { mockGetNotifications, mockMarkNotificationRead } from "@/lib/mockApiService";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/dateUtils";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: Date | import("firebase/firestore").Timestamp | string;
  isRead: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const { user } = useAuth();
  const [tab, setTab] = useState<'Unread'|'All'>('Unread');

  async function fetchNotifications() {
    console.log("[DEBUG] fetchNotifications - Current user:", user);
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      console.log("[DEBUG] Calling mockGetNotifications with userId:", user.uid);
      const items = await mockGetNotifications(user.uid);
      console.log("[DEBUG] Received notifications:", items);
      setNotifications(items);
    } catch (err) {
      console.error("[DEBUG] Error fetching notifications:", err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("[DEBUG] Notifications page mounted, user:", user);
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    setMarkingId(id);
    try {
      await mockMarkNotificationRead({ 
        notificationId: id, 
        userId: user.uid 
      });
      await fetchNotifications();
    } catch {}
    setMarkingId(null);
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);
  const filteredNotifications = tab === 'Unread' ? unreadNotifications : notifications;
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    filteredNotifications.forEach(n => {
      let dateObj: Date;
      if (n.createdAt instanceof Date) {
        dateObj = n.createdAt;
      } else if (n.createdAt && typeof n.createdAt === 'object' && 'toDate' in n.createdAt && typeof n.createdAt.toDate === 'function') {
        dateObj = n.createdAt.toDate();
      } else if (typeof n.createdAt === 'string') {
        dateObj = new Date(n.createdAt);
      } else {
        // fallback to now if invalid
        dateObj = new Date();
      }
      const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffTime = todayOnly.getTime() - dateOnly.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      const section = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : 'Older';
      if (!groups[section]) groups[section] = [];
      groups[section].push(n);
    });
    return groups;
  }, [filteredNotifications]);
  const iconForType = (type: string) => {
    switch(type.toLowerCase()) {
      case 'info': return faInfoCircle;
      case 'success': return faCheckCircle;
      case 'warning': return faExclamationTriangle;
      default: return faInfoCircle;
    }
  };
  const handleMarkAllRead = async () => {
    if (!user) return;
    setMarkingAll(true);
    try {
      await Promise.all(unreadNotifications.map(n =>
        mockMarkNotificationRead({ notificationId: n.id, userId: user.uid })
      ));
      await fetchNotifications();
    } catch(err) {
      console.error(err);
    }
    setMarkingAll(false);
  };

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
          <div>
            <EmptyState
              title="No notifications."
              message="You have no notifications at this time. Important updates will appear here."
              className="my-8"
            />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Debug info: User ID: {user ? user.uid : 'not logged in'}
            </div>
          </div>
        )}
        {!loading && notifications.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4 w-full max-w-2xl">
              <div className="flex space-x-4">
                {['Unread', 'All'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t as 'Unread' | 'All')}
                    className={`px-3 py-1 font-medium ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {t}{t === 'Unread' && unreadNotifications.length > 0 ? ` (${unreadNotifications.length})` : ''}
                  </button>
                ))}
              </div>
              {unreadNotifications.length > 0 && tab === 'Unread' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  label={markingAll ? 'Marking...' : 'Mark all as read'}
                  pageName="NotificationsPage"
                >
                  {markingAll ? 'Marking...' : 'Mark all as read'}
                </Button>
              )}
            </div>
            {Object.keys(groupedNotifications).map(section => (
              <div key={section} className="mb-6 w-full max-w-2xl">
                <h3 className="text-lg font-semibold border-b pb-1">{section}</h3>
                <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
                  {groupedNotifications[section].map(n => (
                    <li key={n.id} className={`py-4 flex items-center gap-3 ${n.isRead ? 'opacity-60' : ''}`}>
                      <FontAwesomeIcon icon={iconForType(n.type)} className="text-gray-500 dark:text-gray-400" />
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{n.type}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(n.createdAt)}</span>
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">{n.message}</div>
                      </div>
                      {!n.isRead && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleMarkRead(n.id)}
                          disabled={markingId === n.id}
                          label={markingId === n.id ? 'Marking...' : 'Mark as Read'}
                          pageName="NotificationsPage"
                        >
                          {markingId === n.id ? 'Marking...' : 'Mark as Read'}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </Card>
    </main>
  );
}
