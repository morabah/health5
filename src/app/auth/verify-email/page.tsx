'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import VerifiedPage from '../verified/page';
import { mockVerifyEmail } from "@/lib/mockApiService";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Invalid or missing token.");
      return;
    }
    mockVerifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err: any) => {
        setStatus("error");
        setError(err.message === "invalid-token" ? "Invalid verification token." : "Verification failed.");
      });
  }, [token]);

  if (status === "pending") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Spinner />
          Verifying your email...
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md text-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Verification Failed</h1>
          <p className="mb-4">{error}</p>
          <Link href="/auth/pending-verification" className="text-blue-600 hover:underline">
            Check Pending Verification
          </Link>
        </Card>
      </main>
    );
  }

  return <VerifiedPage />;
}
