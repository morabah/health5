/**
 * Spinner component for loading states.
 * Renders a spinning animation using Tailwind.
 */
import React, { useState } from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-t-2',
  md: 'w-5 h-5 border-t-2',
  lg: 'w-8 h-8 border-t-3',
};

interface SpinnerProps {
  size?: SpinnerSize;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  // Spinner fades in/out via Tailwind transition
  return (
    <span
      className={`inline-block ${sizeStyles[size]} border-primary border-solid rounded-full animate-spin opacity-100 transition-opacity duration-300 ease-in-out`}
      aria-label="Loading"
    />
  );
};

export default Spinner;
