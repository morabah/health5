"use client";

import { useEffect, useState } from "react";
import { getApiMode } from "@/config/apiConfig";
import { appEventBus, ApiModePayload } from "@/lib/eventBus";

/**
 * A reusable API mode indicator component that updates when API mode changes.
 * Displays the current API mode (mock/live) with appropriate styling.
 * Listens for API mode changes via the event bus and storage events.
 */
export default function ApiModeIndicator({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<string>("mock");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize with current API mode
    setMode(getApiMode() || "mock");
    setMounted(true);

    // Listen for API mode changes
    const handleApiModeChange = (payload: ApiModePayload) => {
      console.log(`[ApiModeIndicator] Received API mode change: ${payload.newMode}`);
      setMode(payload.newMode);
    };

    // Register event listeners
    appEventBus.on("api_mode_change", handleApiModeChange);
    
    // Listen for storage events from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "apiMode" && event.newValue) {
        console.log(`[ApiModeIndicator] Storage event: apiMode changed to ${event.newValue}`);
        setMode(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Cleanup listeners
    return () => {
      appEventBus.off("api_mode_change", handleApiModeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  if (!mounted) {
    // Avoid rendering until after hydration to prevent SSR/CSR mismatch
    return null;
  }

  const modeColor = mode === "live" 
    ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400";

  return (
    <div className={`font-mono text-xs px-2 py-1 rounded border ${modeColor} ${className}`}>
      {mode === "live" ? "LIVE" : "MOCK"}
    </div>
  );
} 