"use client";
/**
 * ProtectedPage: Restricts access to children based on mock auth context and allowed roles.
 * Redirects to home if not authenticated or not in allowedRoles.
 * Usage: <ProtectedPage allowedRoles={[UserType.PATIENT]}><Dashboard /></ProtectedPage>
 */
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserType } from "@/types/enums";
import Spinner from "@/components/ui/Spinner";

interface ProtectedPageProps {
  children: React.ReactNode;
  allowedRoles?: UserType[];
}

const ProtectedPage: React.FC<ProtectedPageProps> = ({ children, allowedRoles }) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (
      allowedRoles &&
      (!userProfile?.userType || !allowedRoles.includes(userProfile.userType))
    ) {
      router.replace("/");
    }
  }, [user, userProfile, loading, allowedRoles, router]);

  if (loading || !user) return <Spinner className="mt-12" />;
  if (
    allowedRoles &&
    (!userProfile?.userType || !allowedRoles.includes(userProfile.userType))
  ) {
    return null;
  }
  return <>{children}</>;
};

export default ProtectedPage;
