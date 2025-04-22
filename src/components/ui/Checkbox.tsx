import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Accessible, styled checkbox component for forms.
 *
 * @param {object} props - React input props for checkbox.
 * @param {string} [props.className] - Additional class names.
 * @param {React.Ref<HTMLInputElement>} [ref] - Forwarded ref.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-500 dark:bg-gray-900 dark:border-gray-700 dark:checked:bg-primary-600 dark:checked:border-primary-600 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";
