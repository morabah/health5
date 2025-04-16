"use client";
import React, { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import { UserType } from "@/types/enums";
import { logInfo } from "@/lib/logger";

/**
 * Props for ProtectedPage component.
 * @property children - The content to render if access is allowed.
 * @property allowedRoles - Optional array of allowed UserType roles. If omitted, any authenticated user is allowed.
 */
interface ProtectedPageProps {
  children: ReactNode;
  allowedRoles?: UserType[];
}

/**
 * Protects a page by redirecting unauthenticated users to /auth/login, and unauthorized users to /.
 * Shows a loading spinner while auth state is loading or role check is pending.
 * Usage: <ProtectedPage allowedRoles={[UserType.PATIENT]}>{children}</ProtectedPage>
 */
const ProtectedPage = ({ children, allowedRoles }: ProtectedPageProps) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    // Not authenticated
    if (!user) {
      router.push("/auth/login");
      return;
    }
    // Authenticated but role check needed
    if (user && allowedRoles) {
      if (!userProfile) return; // Wait for profile
      if (!allowedRoles.includes(userProfile.userType)) {
        logInfo("Authorization failure: user role not allowed", { userType: userProfile.userType, allowedRoles });
        router.push("/"); // Or /unauthorized
      }
    }
  }, [loading, user, userProfile, router, allowedRoles]);

  // Show spinner if loading, or waiting for userProfile for role check
  if (loading || (user && allowedRoles && !userProfile)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }
  // Not authenticated: will be redirected
  if (!user) return null;
  // Authenticated but not authorized: will be redirected
  if (user && allowedRoles && userProfile && !allowedRoles.includes(userProfile.userType)) return null;
  // Authenticated and authorized
  return <>{children}</>;
};

export default ProtectedPage;
