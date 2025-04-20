"use client";
import React, { createContext, useContext, useState } from "react";

// Context for managing active tab
const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (value: string) => void;
  defaultValue?: string;
}>({
  activeTab: "",
  setActiveTab: () => {},
});

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, className = "", children, onValueChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleChange = (value: string) => {
    setActiveTab(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <TabsContext.Provider
      value={{ activeTab, setActiveTab: handleChange, defaultValue }}
    >
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export function TabsList({ className = "", children }: TabsListProps) {
  return (
    <div className={`flex space-x-1 rounded-md p-1 bg-gray-100 dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function TabsTrigger({
  value,
  className = "",
  children,
  disabled = false,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={`
        px-3 py-2 text-sm font-medium rounded-md 
        ${isActive 
          ? "bg-white dark:bg-gray-700 shadow-sm" 
          : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsContent({
  value,
  className = "",
  children,
}: TabsContentProps) {
  const { activeTab } = useContext(TabsContext);
  
  if (value !== activeTab) {
    return null;
  }

  return <div className={className}>{children}</div>;
} 