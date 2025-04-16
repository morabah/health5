"use client";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

/**
 * Doctor Notifications Page (Mock)
 * Displays a list of notifications for the doctor (mock data for now)
 */
const mockNotifications = [
  {
    id: "notif1",
    message: "You have a new appointment request.",
    date: "2025-04-16T09:30:00",
    read: false,
  },
  {
    id: "notif2",
    message: "Patient John Doe submitted a new form.",
    date: "2025-04-15T17:10:00",
    read: true,
  },
];

export default function DoctorNotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faBell} className="text-primary" /> Notifications
      </h1>
      {mockNotifications.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">No notifications yet.</div>
      ) : (
        <ul className="space-y-4">
          {mockNotifications.map((notif) => (
            <li
              key={notif.id}
              className={`rounded-lg border px-4 py-3 flex flex-col gap-1 ${notif.read ? "bg-gray-50 dark:bg-gray-900" : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"}`}
            >
              <span className="font-medium text-gray-800 dark:text-gray-100">{notif.message}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(notif.date).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
