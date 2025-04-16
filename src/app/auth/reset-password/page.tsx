"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback("Resetting password...");
    setTimeout(() => {
      setFeedback("Password reset simulated. You may now log in.");
    }, 700);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          <Button type="submit" className="w-full">Reset Password</Button>
        </form>
        {feedback && <div className="mt-4 text-center text-sm text-blue-600 dark:text-blue-400">{feedback}</div>}
        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">Back to Login</Link>
        </div>
      </Card>
    </main>
  );
}
