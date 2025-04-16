"use client";
import React from "react";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default function VerifiedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-6">Email Verified</h1>
        <p className="mb-6 text-green-600 dark:text-green-400">Your email has been successfully verified.</p>
        <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">Go to Login</Link>
      </Card>
    </main>
  );
}
