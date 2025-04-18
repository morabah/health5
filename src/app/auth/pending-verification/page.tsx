"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { mockGetMyUserProfileData } from "@/lib/mockApiService";
import { VerificationStatus, UserType } from "@/types/enums";
import Spinner from "@/components/ui/Spinner";

export default function PendingVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkVerificationStatus() {
      try {
        // In a real app, this would get the current user's ID from Auth
        // For now, we use the mock data of a logged-in doctor
        const userId = localStorage.getItem('auth_user_id') || 'user_doctor_001';
        const { user, profile } = await mockGetMyUserProfileData(userId);
        
        if (user) {
          setUserType(user.userType);
          if (user.userType === UserType.DOCTOR && profile) {
            setVerificationStatus((profile as any).verificationStatus || null);
          }
        }
      } catch (err) {
        setError('Failed to load verification status');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    checkVerificationStatus();
  }, []);

  function handleResend() {
    // Placeholder for resend logic
    console.log("Resend verification email clicked");
  }

  function getStatusMessage() {
    if (!verificationStatus) return "Your verification status is unknown.";
    
    switch (verificationStatus) {
      case VerificationStatus.PENDING:
        if (userType === UserType.DOCTOR) {
          return "Thank you for registering as a doctor. Your credentials have been submitted and are pending administrator review. We'll notify you once approved.";
        }
        return "Your account is pending verification by an administrator. We'll notify you when your status changes.";
      case VerificationStatus.APPROVED:
        return "Your account has been verified! You can now access the doctor dashboard.";
      case VerificationStatus.REJECTED:
        return "Your verification was rejected. Please contact support for more information.";
      case VerificationStatus.MORE_INFO_REQUIRED:
        return "We need more information to verify your account. Please check your notifications.";
      default:
        return "Your verification status is being processed.";
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8 text-center">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400 mb-4">
            {error}
          </div>
        ) : userType === UserType.DOCTOR ? (
          <>
            <h1 className="text-2xl font-bold mb-6">Account Verification Status</h1>
            <div className={`mb-6 p-4 rounded-lg ${
              verificationStatus === VerificationStatus.APPROVED 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : verificationStatus === VerificationStatus.REJECTED
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            }`}>
              {getStatusMessage()}
            </div>
            {verificationStatus === VerificationStatus.APPROVED ? (
              <Button type="button" className="w-full mb-4" asChild label="Go to Dashboard" pageName="DoctorVerification">
                <Link href="/doctor/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <div className="text-gray-600 dark:text-gray-300 mb-4">
                We'll send you an email when your verification status changes.
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6">Check your email</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-300">A verification link was sent to your email address. Please verify to continue.</p>
            <Button type="button" className="w-full mb-4" onClick={handleResend} label="Resend Email" pageName="VerificationPage">
              Resend Email
            </Button>
          </>
        )}
        <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">Back to Login</Link>
      </Card>
    </main>
  );
}
