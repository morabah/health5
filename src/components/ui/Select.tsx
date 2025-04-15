/**
 * Select component for dropdowns with label and error display.
 * @param label - Optional label for the select.
 * @param error - Optional error message string.
 * @param options - Array of { value, label } for the dropdown.
 * @param rest - Standard select props.
 */
import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

const Select: React.FC<SelectProps> = ({ label, error, id, options, className = '', ...rest }) => (
  <div className="mb-4">
    {label && (
      <label htmlFor={id} className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>
    )}
    <select
      id={id}
      className={`border rounded p-2 w-full focus:ring-primary focus:border-primary transition-colors duration-150 ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
      {...rest}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default Select;
