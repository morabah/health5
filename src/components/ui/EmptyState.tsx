"use client";
import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

/**
 * EmptyState component for displaying friendly empty or error states.
 * @param props.icon Optional icon (defaults to ExclamationCircleIcon)
 * @param props.title Main title (required)
 * @param props.message Secondary message (optional)
 * @param props.action Optional action button (e.g., CTA to navigate)
 */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  className = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    data-testid="empty-state"
  >
    <div className="mb-4 text-emerald-600 dark:text-emerald-400">
      {icon || <ExclamationCircleIcon className="w-12 h-12 mx-auto" />}
    </div>
    <h2 className="text-xl font-semibold mb-2 dark:text-white">{title}</h2>
    {message && (
      <div className="text-gray-600 dark:text-gray-300 mb-4 max-w-md mx-auto">{message}</div>
    )}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default EmptyState;
