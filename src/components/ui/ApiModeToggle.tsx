"use client";

import { useState, useEffect } from "react";
import { getApiMode, setApiMode } from "@/config/appConfig";
import { ApiMode } from "@/config/appConfig";

interface ApiModeToggleProps {
  className?: string;
}

export function ApiModeToggle({ className = "" }: ApiModeToggleProps) {
  const [mode, setMode] = useState<ApiMode>("mock");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client to avoid hydration mismatch
    setMode(getApiMode());
    setMounted(true);

    // Listen for API mode changes from other sources
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "apiMode" && (event.newValue === "live" || event.newValue === "mock")) {
        setMode(event.newValue as ApiMode);
      }
    };

    // Custom event for same-tab updates
    const handleApiModeChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.mode && (customEvent.detail.mode === "live" || customEvent.detail.mode === "mock")) {
        setMode(customEvent.detail.mode);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("apiModeChanged", handleApiModeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("apiModeChanged", handleApiModeChange);
    };
  }, []);

  const toggleApiMode = () => {
    const newMode: ApiMode = mode === "live" ? "mock" : "live";
    setApiMode(newMode);
    setMode(newMode);
  };

  // Don't render anything during SSR to prevent hydration mismatch
  if (!mounted) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
          mode === "live" ? "bg-blue-600" : "bg-gray-300"
        }`}
        onClick={toggleApiMode}
        aria-pressed={mode === "live"}
      >
        <span className="sr-only">Toggle API Mode</span>
        <span
          className={`${
            mode === "live" ? "translate-x-6" : "translate-x-1"
          } inline-block h-4 w-4 transform rounded-full bg-white transition`}
        />
      </button>
      <span className="text-sm font-medium cursor-pointer" onClick={toggleApiMode}>
        {mode === "live" ? "Live API" : "Mock API"}
      </span>
    </div>
  );
} 