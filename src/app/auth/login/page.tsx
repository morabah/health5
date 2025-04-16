"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback("Logging in...");
    setTimeout(() => {
      setFeedback("Login simulated. State: " + JSON.stringify({ email, password }));
    }, 700);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full">Sign In</Button>
        </form>
        {feedback && <div className="mt-4 text-center text-sm text-blue-600 dark:text-blue-400">{feedback}</div>}
        <div className="mt-6 flex flex-col gap-2 text-center">
          <Link href="/auth/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</Link>
          <Link href="/auth/register" className="text-blue-600 dark:text-blue-400 hover:underline">Don't have an account? Register</Link>
        </div>
      </Card>
    </main>
  );
}
