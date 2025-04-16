"use client";
import { useEffect, useState } from "react";
import { getApiMode } from "@/config/apiConfig";

/**
 * Hydration-safe API mode label for Home page.
 * Ensures SSR/CSR text mismatch does not occur.
 */
export default function ApiModeLabel() {
  const [mode, setMode] = useState<string>("mock");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMode(getApiMode() || "mock");
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid rendering until after hydration
    return null;
  }

  return <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 ml-2">{mode.toUpperCase()}</span>;
}
