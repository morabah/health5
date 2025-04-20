"use client";
import React from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function RegisterChoicePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-3xl">
        {/* Patient Card */}
        <Card className="flex-1 p-8 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Register as Patient</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300 text-center">Book appointments, manage your health, and access personalized services.</p>
          <Button
            asChild
            className="w-full"
            label="Continue as Patient"
            pageName="RegisterChoicePage"
          >
            <Link href="/auth/register/patient">Continue as Patient</Link>
          </Button>
        </Card>
        {/* Doctor Card */}
        <Card className="flex-1 p-8 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Register as Doctor</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300 text-center">Join the network, manage appointments, and connect with patients.</p>
          <Button
            asChild
            className="w-full"
            label="Continue as Doctor"
            pageName="RegisterChoicePage"
          >
            <Link href="/auth/register/doctor">Continue as Doctor</Link>
          </Button>
        </Card>
      </div>
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">Back to Login</Link>
      </div>
    </main>
  );
}
