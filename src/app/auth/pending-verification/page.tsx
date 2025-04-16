"use client";
import React from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function PendingVerificationPage() {
  function handleResend() {
    // Placeholder for resend logic
    // eslint-disable-next-line no-console
    console.log("Resend verification email clicked");
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-6">Check your email</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">A verification link was sent to your email address. Please verify to continue.</p>
        <Button type="button" className="w-full mb-4" onClick={handleResend}>Resend Email</Button>
        <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">Back to Login</Link>
      </Card>
    </main>
  );
}
