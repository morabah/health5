"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { mockSignIn } from "@/lib/mockApiService";
import { UserType } from "@/types/enums";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback("Logging in...");
    try {
      const { user, userProfile } = await mockSignIn(email, password);
      
      if (userProfile.userType === UserType.DOCTOR) {
        await login('doctor');
        if (!userProfile.emailVerified) {
          setFeedback("Email not verified. Redirecting to verification page...");
          setTimeout(() => {
            window.location.href = `/auth/verify-email?token=${user.uid}`;
          }, 900);
        } else {
          setFeedback("Login successful. Admin approval pending...");
          setTimeout(() => {
            window.location.href = "/auth/pending-verification";
          }, 900);
        }
      } else if (userProfile.userType === UserType.PATIENT) {
        await login('patient');
        setFeedback("Login successful. Redirecting to patient dashboard...");
        setTimeout(() => {
          window.location.href = "/patient/dashboard";
        }, 900);
      } else if (userProfile.userType === UserType.ADMIN) {
        await login('admin');
        setFeedback("Login successful. Redirecting to admin dashboard...");
        setTimeout(() => {
          window.location.href = "/admin";
        }, 900);
      } else {
        await login('patient');
        setFeedback("Login successful. Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 900);
      }
    } catch (err: any) {
      setFeedback(err.message === "invalid-credential" ? "Invalid credentials." : "Login failed.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button 
            type="submit" 
            className="w-full"
            label="Sign In"
            pageName="Login"
          >
            Sign In
          </Button>
        </form>
        {feedback && <div className="mt-4 text-center text-sm text-blue-600 dark:text-blue-400">{feedback}</div>}
        <div className="mt-6 flex flex-col gap-2 text-center">
          <Link href="/auth/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</Link>
          <Link href="/auth/register" className="text-blue-600 dark:text-blue-400 hover:underline">Don't have an account? Register</Link>
        </div>
        <div className="mt-8">
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {
                setEmail("admin@example.com");
                setPassword("adminpass");
              }}
              disabled={loading}
              label="Fill Admin Credentials"
              pageName="Login"
            >
              Fill Admin Credentials
            </Button>
            <Button
              type="button"
              className="w-full bg-green-600 text-white hover:bg-green-700"
              onClick={() => {
                setEmail("patient1@example.com");
                setPassword("password");
              }}
              disabled={loading}
              label="Fill Patient Credentials"
              pageName="Login"
            >
              Fill Patient Credentials
            </Button>
            <Button
              type="button"
              className="w-full bg-purple-600 text-white hover:bg-purple-700"
              onClick={() => {
                setEmail("doctor1@example.com");
                setPassword("password");
              }}
              disabled={loading}
              label="Fill Doctor Credentials"
              pageName="Login"
            >
              Fill Doctor Credentials
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
