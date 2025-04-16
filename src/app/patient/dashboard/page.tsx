"use client";
import React from "react";
import ProtectedPage from "@/components/shared/ProtectedPage";

export default function PatientDashboardPage() {
  return (
    <ProtectedPage>
      <main className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Patient Dashboard (Protected)</h1>
        <p className="mt-2 text-gray-600">Only visible to authenticated patients.</p>
      </main>
    </ProtectedPage>
  );
}
