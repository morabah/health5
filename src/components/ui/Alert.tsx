/**
 * Alert component for showing contextual feedback.
 * @param variant - Visual style: 'success' | 'error' | 'warning' | 'info'
 * @param message - The message to display
 * @param isVisible - Whether the alert is shown
 */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

const variantStyles: Record<AlertVariant, string> = {
  success: 'bg-green-100 border-green-400 text-green-700',
  error: 'bg-red-100 border-red-400 text-red-700',
  warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
  info: 'bg-blue-100 border-blue-400 text-blue-700',
};

const variantIcons: Record<AlertVariant, any> = {
  success: faCheckCircle,
  error: faTimesCircle,
  warning: faExclamationTriangle,
  info: faInfoCircle,
};

export interface AlertProps {
  variant: AlertVariant;
  message: string;
  isVisible: boolean;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ variant, message, isVisible, className = '' }) => {
  if (!isVisible) return null;
  return (
    <div className={`flex items-center border-l-4 p-4 mb-4 rounded shadow-sm ${variantStyles[variant]} ${className}`} role="alert">
      <FontAwesomeIcon icon={variantIcons[variant]} className="mr-2 text-xl" />
      <span>{message}</span>
    </div>
  );
};

export default Alert;
