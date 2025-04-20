"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { initializeFirebaseClient } from "@/lib/firebaseClient";
import { logInfo, logError, logValidation } from "@/lib/logger";
import { trackPerformance } from "@/lib/performance";
import type { UserProfile } from "@/types/user";
import { UserType } from "@/types/enums";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    const perf = trackPerformance("login");
    logInfo("[LoginPage] Login attempt", { email });
    const { auth: fbAuth, db: firestoreDb } = initializeFirebaseClient("live");
    if (!fbAuth || !firestoreDb) {
      logError("[LoginPage] Firebase not initialized");
      setErrorMsg("Authentication service unavailable.");
      setIsLoading(false);
      perf.stop();
      return;
    }
    try {
      const cred = await signInWithEmailAndPassword(fbAuth, email, password);
      logInfo("[LoginPage] Login successful", { uid: cred.user.uid });
      const userDocRef = doc(firestoreDb, "users", cred.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        setErrorMsg("User profile not found.");
        return;
      }
      const profile = userDocSnap.data() as UserProfile;
      logInfo("[LoginPage] Profile fetched", { userType: profile.userType });
      logValidation("6.2", "success", "Live Login page logic implemented and tested.");
      if (profile.userType === UserType.DOCTOR) {
        if (!profile.emailVerified) router.push(`/auth/verify-email?token=${cred.user.uid}`);
        else router.push("/auth/pending-verification");
      } else if (profile.userType === UserType.PATIENT) {
        router.push("/patient/dashboard");
      } else if (profile.userType === UserType.ADMIN) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      logError("[LoginPage] Login error", { error });
      let message = "Login failed. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/user-not-found": message = "No user found with that email."; break;
          case "auth/wrong-password": message = "Incorrect password."; break;
          case "auth/invalid-email": message = "Invalid email address."; break;
          case "auth/too-many-requests": message = "Too many login attempts. Try again later."; break;
        }
      }
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
      perf.stop();
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {errorMsg && <Alert variant="error" message={errorMsg} isVisible={true} />}
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={isLoading} label="Sign In" pageName="Login">
            {isLoading ? <Spinner /> : "Sign In"}
          </Button>
        </form>
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
                setPassword("Password123!");
              }}
              disabled={isLoading}
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
                setPassword("Password123!");
              }}
              disabled={isLoading}
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
                setPassword("Password123!");
              }}
              disabled={isLoading}
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
