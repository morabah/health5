"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback("Sending reset email...");
    setTimeout(() => {
      setFeedback("If an account exists, a reset email was sent.");
    }, 700);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full" label="Send Reset Link" pageName="auth-forgot-password">
            Send Reset Link
          </Button>
        </form>
        {feedback && <div className="mt-4 text-center text-sm text-blue-600 dark:text-blue-400">{feedback}</div>}
        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">Back to Login</Link>
        </div>
      </Card>
    </main>
  );
}
