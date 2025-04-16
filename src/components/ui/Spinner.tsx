/**
 * Spinner component for loading states.
 * Renders a spinning animation using Tailwind.
 */
import React, { useState } from 'react';

export const Spinner: React.FC = () => {
  const [visible, setVisible] = useState(true);
  // Spinner fades in/out via Tailwind transition
  return (
    <span
      className="inline-block w-5 h-5 border-t-2 border-primary border-solid rounded-full animate-spin opacity-100 transition-opacity duration-300 ease-in-out"
      aria-label="Loading"
    />
  );
};

export default Spinner;
