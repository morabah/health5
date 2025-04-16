/**
 * Card component for consistent container styling.
 * @param props - Accepts children and optional className for extra Tailwind classes.
 */
import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 ease-in-out ${className}`}>
    {children}
  </div>
);

export default Card;
