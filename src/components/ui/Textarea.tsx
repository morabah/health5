/**
 * Textarea component for multiline input with label and error display.
 * @param label - Optional label for the textarea.
 * @param error - Optional error message string.
 * @param rows - Number of rows for the textarea.
 * @param rest - Standard textarea props.
 */
import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  rows?: number;
}

const Textarea: React.FC<TextareaProps> = ({ label, error, id, rows = 3, className = '', ...rest }) => (
  <div className="mb-4">
    {label && (
      <label htmlFor={id} className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>
    )}
    <textarea
      id={id}
      rows={rows}
      className={`border rounded p-2 w-full focus:ring-primary focus:border-primary transition-all duration-300 ease-in-out ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
      {...rest}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default Textarea;
