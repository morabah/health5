"use client";
import React from "react";
import { usePathname } from "next/navigation";
import ProtectedPage from "@/components/shared/ProtectedPage";

const protectedRoutePrefixes = [
  "/patient/",
  "/doctor/",
  "/admin/",
  "/main/"
];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutePrefixes.some((prefix) => pathname.startsWith(prefix));
}

export default function ClientProtect({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname && isProtectedRoute(pathname)) {
    return <ProtectedPage>{children}</ProtectedPage>;
  }
  return <>{children}</>;
}
