"use client";
import React, { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";

interface ProtectedPageProps {
  children: ReactNode;
}

/**
 * Protects a page by redirecting unauthenticated users to /auth/login.
 * Shows a loading spinner while auth state is loading.
 */
const ProtectedPage = ({ children }: ProtectedPageProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
};

export default ProtectedPage;
