"use client";
/**
 * ProtectedPage: Restricts access to children based on mock auth context and allowed roles.
 * Redirects to home if not authenticated or not in allowedRoles.
 * Usage: <ProtectedPage allowedRoles={[UserType.PATIENT]}><Dashboard /></ProtectedPage>
 */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserType, VerificationStatus } from "@/types/enums";
import Spinner from "@/components/ui/Spinner";
import { mockGetDoctorVerifications } from "@/lib/mockApiService";

interface ProtectedPageProps {
  children: React.ReactNode;
  allowedRoles?: UserType[];
  checkVerification?: boolean;
}

const ProtectedPage: React.FC<ProtectedPageProps> = ({ 
  children, 
  allowedRoles,
  checkVerification = true
}) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [checkingVerification, setCheckingVerification] = useState(false);

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
      return;
    }

    // Check verification status for doctors
    if (checkVerification && userProfile?.userType === UserType.DOCTOR) {
      const checkDoctorVerification = async () => {
        setCheckingVerification(true);
        try {
          // Use the doctor's user ID to get verification status
          const verificationData = await mockGetDoctorVerifications();
          if (verificationData && verificationData.status !== VerificationStatus.APPROVED) {
            // Redirect to pending verification if not approved
            router.replace("/auth/pending-verification");
          }
        } catch (error) {
          console.error("Error checking doctor verification:", error);
        } finally {
          setCheckingVerification(false);
        }
      };
      
      checkDoctorVerification();
    }
  }, [user, userProfile, loading, allowedRoles, router, checkVerification]);

  if (loading || checkingVerification) return <Spinner />;
  
  if (
    allowedRoles &&
    (!userProfile?.userType || !allowedRoles.includes(userProfile.userType))
  ) {
    return null;
  }
  
  return <>{children}</>;
};

export default ProtectedPage;
