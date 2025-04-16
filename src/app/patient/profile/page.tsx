"use client";
import React from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function PatientProfilePage() {
  const { user, userProfile, loading } = useAuth();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Patient Profile</h1>
      <Card className="w-full max-w-xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Profile Details</h2>
          <Button asChild>
            <Link href="/patient/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {!loading && !userProfile && (
          <div className="text-red-600 dark:text-red-400">No profile found. Please log in as a patient.</div>
        )}
        {!loading && userProfile && (
          <div className="space-y-4">
            <div><span className="font-medium">Name:</span> {userProfile.firstName} {userProfile.lastName}</div>
            <div><span className="font-medium">Email:</span> {userProfile.email}</div>
            <div><span className="font-medium">Phone:</span> {userProfile.phone || "-"}</div>
            <div><span className="font-medium">User Type:</span> {userProfile.userType}</div>
            <div><span className="font-medium">Email Verified:</span> {userProfile.emailVerified ? "Yes" : "No"}</div>
            <div><span className="font-medium">Active:</span> {userProfile.isActive ? "Yes" : "No"}</div>
            {/* Add more fields as needed */}
          </div>
        )}
      </Card>
    </main>
  );
}
