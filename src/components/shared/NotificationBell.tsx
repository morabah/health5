"use client";

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { mockGetNotifications } from '@/lib/mockApiService';

const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) {
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      try {
        const notifications = await mockGetNotifications(user.uid);
        setUnreadCount(notifications.filter(notification => !notification.isRead).length);
      } catch (error) {
        console.error('Error fetching unread notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Set up an interval to refresh the count every minute
    const intervalId = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  if (loading || !user) {
    return null;
  }

  return (
    <Link href="/notifications" className="relative block">
      <FontAwesomeIcon
        icon={faBell}
        className="text-xl text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
      />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell; 