import React from 'react';
import { Slot } from "@radix-ui/react-slot";
import { trackButtonClick } from '@/lib/eventTracker';

type ButtonVariant = 'primary' | 'secondary' | 'info' | 'warning' | 'danger' | 'admin' | 'main';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-700 hover:bg-blue-900 text-white',
  secondary: 'bg-emerald-600 hover:bg-emerald-800 text-white',
  info: 'bg-purple-600 hover:bg-purple-800 text-white',
  warning: 'bg-orange-500 hover:bg-orange-700 text-white',
  danger: 'bg-pink-600 hover:bg-pink-800 text-white',
  admin: 'bg-gray-700 hover:bg-gray-900 text-white',
  main: 'bg-yellow-600 hover:bg-yellow-800 text-white',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  pageName: string;
  additionalLogData?: Record<string, any>;
  asChild?: boolean;
  isLoading?: boolean;
}

/**
 * Reusable button component that automatically logs click events to CMS.
 * 
 * @param label - The button text/label
 * @param variant - The visual style variant of the button
 * @param size - The size of the button (sm, md, lg, xl)
 * @param pageName - The name of the page where the button appears (for logging)
 * @param additionalLogData - Optional additional data to include in CMS logs
 * @param className - Additional CSS classes to apply
 * @param onClick - Additional onClick handler
 * @param children - Optional children elements (falls back to label if not provided)
 * @param asChild - When true, the component will render its child as the root element
 * @param isLoading - Shows loading state when true
 * @param rest - All other button props
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  label,
  variant = 'primary',
  size = 'md',
  pageName,
  additionalLogData,
  className = '',
  onClick,
  children,
  asChild = false,
  isLoading = false,
  ...domProps
}, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Log the button click event
    trackButtonClick(label, pageName, additionalLogData);
    
    // Call the original onClick handler if provided
    if (onClick) {
      onClick(e);
    }
  };
  
  const buttonProps = {
    className: `rounded ${variantStyles[variant]} ${sizeStyles[size]} transition-all duration-300 ease-in-out ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`,
    onClick: handleClick,
    ref,
    ...domProps
  };

  // Content to render inside the button
  const content = isLoading ? (
    <div className="inline-flex items-center">
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {children || label}
    </div>
  ) : (
    children || label
  );

  // Use Slot component when asChild is true
  if (asChild) {
    return <Slot {...buttonProps}>{content}</Slot>;
  }

  // Otherwise, use a regular button
  return <button {...buttonProps}>{content}</button>;
});

Button.displayName = "Button";

export default Button;