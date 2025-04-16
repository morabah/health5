"use client";
import { useEffect, useState } from "react";
import { getApiMode } from "@/config/appConfig";

/**
 * Hydration-safe API mode label for CMS Validation page.
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

  return <span>{mode.toUpperCase()}</span>;
}
