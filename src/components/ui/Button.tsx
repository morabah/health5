import React from 'react';
import { trackButtonClick } from '@/lib/eventTracker';

type ButtonVariant = 'primary' | 'secondary' | 'info' | 'warning' | 'danger' | 'admin' | 'main';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-700 hover:bg-blue-900 text-white',
  secondary: 'bg-emerald-600 hover:bg-emerald-800 text-white',
  info: 'bg-purple-600 hover:bg-purple-800 text-white',
  warning: 'bg-orange-500 hover:bg-orange-700 text-white',
  danger: 'bg-pink-600 hover:bg-pink-800 text-white',
  admin: 'bg-gray-700 hover:bg-gray-900 text-white',
  main: 'bg-yellow-600 hover:bg-yellow-800 text-white',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  pageName: string;
  additionalLogData?: Record<string, any>;
}

/**
 * Reusable button component that automatically logs click events to CMS.
 * 
 * @param label - The button text/label
 * @param variant - The visual style variant of the button
 * @param pageName - The name of the page where the button appears (for logging)
 * @param additionalLogData - Optional additional data to include in CMS logs
 * @param className - Additional CSS classes to apply
 * @param onClick - Additional onClick handler
 * @param children - Optional children elements (falls back to label if not provided)
 * @param rest - All other button props
 */
export const Button = ({
  label,
  variant = 'primary',
  pageName,
  additionalLogData,
  className = '',
  onClick,
  children,
  ...rest
}: ButtonProps) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Log the button click event
    trackButtonClick(label, pageName, additionalLogData);
    
    // Call the original onClick handler if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={`px-4 py-2 rounded ${variantStyles[variant]} ${className}`}
      onClick={handleClick}
      {...rest}
    >
      {children || label}
    </button>
  );
};

export default Button; 