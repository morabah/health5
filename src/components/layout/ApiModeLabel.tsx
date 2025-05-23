"use client";
import { useEffect, useState } from "react";
import { getApiMode, setApiMode } from "@/config/appConfig";
import { ApiMode } from "@/config/appConfig";

/**
 * Hydration-safe API mode label and toggle for Navbar.
 * Ensures SSR/CSR text mismatch does not occur.
 */
export default function ApiModeLabel() {
  const [mode, setMode] = useState<ApiMode>("mock");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMode(getApiMode());
    setMounted(true);

    // Listen for API mode changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "apiMode" && (event.newValue === "live" || event.newValue === "mock")) {
        setMode(event.newValue as ApiMode);
      }
    };

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

  if (!mounted) {
    // Avoid rendering until after hydration
    return null;
  }

  const modeColor = mode === "live" 
    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" 
    : "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300";

  return (
    <div className="flex items-center space-x-2">
      <span className={`font-mono text-xs px-2 py-1 rounded ${modeColor}`}>
        {mode.toUpperCase()}
      </span>
      <button
        className={`relative inline-flex h-5 w-10 items-center rounded-full ${
          mode === "live" ? "bg-blue-600" : "bg-gray-300"
        }`}
        onClick={toggleApiMode}
        aria-pressed={mode === "live"}
        title={`Switch to ${mode === "live" ? "mock" : "live"} mode`}
      >
        <span className="sr-only">Toggle API Mode</span>
        <span
          className={`${
            mode === "live" ? "translate-x-5" : "translate-x-1"
          } inline-block h-3 w-3 transform rounded-full bg-white transition`}
        />
      </button>
    </div>
  );
}
