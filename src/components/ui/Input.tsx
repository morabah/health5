/**
 * Input component for forms with label and error display.
 * @param label - Optional label for the input.
 * @param error - Optional error message string.
 * @param rest - Standard input props (id, name, etc.).
 */
import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, id, className = '', ...rest }) => (
  <div className="mb-4">
    {label && (
      <label htmlFor={id} className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>
    )}
    <input
      id={id}
      className={`border rounded p-2 w-full focus:ring-primary focus:border-primary transition-all duration-300 ease-in-out ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
      {...rest}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default Input;
