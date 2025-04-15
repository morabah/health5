/**
 * Spinner component for loading states.
 * Renders a spinning animation using Tailwind.
 */
import React from 'react';

export const Spinner: React.FC = () => (
  <span
    className="inline-block w-5 h-5 border-t-2 border-primary border-solid rounded-full animate-spin"
    aria-label="Loading"
  />
);

export default Spinner;
