"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Link from "next/link";
import { initializeFirebaseClient } from "@/lib/firebaseClient";
import { getFunctions, httpsCallable } from "firebase/functions";
import { UserType } from "@/types/enums";
import { useRouter } from "next/navigation";
import { logInfo, logError, logValidation } from "@/lib/logger";
import { trackPerformance } from "@/lib/performance";
import Alert from "@/components/ui/Alert";

export default function PatientRegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    gender: "",
    bloodType: "",
    medicalHistory: ""
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    const perf = trackPerformance("registerPatient");
    logInfo("[PatientRegisterPage] Registration attempt", { email: form.email });

    // Basic validation
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) {
      setErrorMsg("Please fill in all required fields.");
      setIsLoading(false);
      perf.stop();
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setIsLoading(false);
      perf.stop();
      return;
    }

    try {
      const { app } = initializeFirebaseClient("live");
      if (!app) {
        setErrorMsg("Registration service unavailable.");
        return;
      }
      const functionsClient = getFunctions(app);
      const registerUserFn = httpsCallable(functionsClient, "registerUser");
      await registerUserFn({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        userType: UserType.PATIENT,
      });
      logInfo("[PatientRegisterPage] Registration successful", { email: form.email });
      logValidation("6.4", "success", "Live Patient Registration connected.");
      router.push("/auth/pending-verification");
    } catch (error: any) {
      logError("[PatientRegisterPage] Registration error", { error });
      const code = error.code || error.message;
      if (code.includes("already-exists")) {
        setErrorMsg("Email already registered.");
      } else if (code.includes("invalid-argument")) {
        setErrorMsg("Invalid registration data.");
      } else {
        setErrorMsg("Registration failed.");
      }
    } finally {
      setIsLoading(false);
      perf.stop();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-8">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Patient Registration</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name *" name="firstName" value={form.firstName} onChange={handleChange} required />
            <Input label="Last Name *" name="lastName" value={form.lastName} onChange={handleChange} required />
          </div>
          <Input label="Email *" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
          <Input label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
          
          <Select 
            label="Gender" 
            name="gender" 
            value={form.gender} 
            onChange={handleChange}
            options={[
              { value: "", label: "Select gender" },
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" },
              { value: "Prefer not to say", label: "Prefer not to say" }
            ]}
          />
          
          <Select 
            label="Blood Type" 
            name="bloodType" 
            value={form.bloodType} 
            onChange={handleChange}
            options={[
              { value: "", label: "Select blood type" },
              { value: "A+", label: "A+" },
              { value: "A-", label: "A-" },
              { value: "B+", label: "B+" },
              { value: "B-", label: "B-" },
              { value: "AB+", label: "AB+" },
              { value: "AB-", label: "AB-" },
              { value: "O+", label: "O+" },
              { value: "O-", label: "O-" },
              { value: "Unknown", label: "Unknown" }
            ]}
          />
          
          <Textarea 
            label="Medical History" 
            name="medicalHistory" 
            value={form.medicalHistory} 
            onChange={handleChange}
            placeholder="Enter any relevant medical history, conditions, or allergies (optional)"
          />
          
          <Input label="Password *" name="password" type="password" value={form.password} onChange={handleChange} required />
          <Input label="Confirm Password *" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
          
          <Button type="submit" label="Register" pageName="PatientRegistration" className="w-full" disabled={isLoading}>Register</Button>
        </form>
        {errorMsg && <Alert variant="error" message={errorMsg} isVisible={true} />}
        {feedback && <div className="mt-4 text-center text-sm text-blue-600 dark:text-blue-400">{feedback}</div>}
        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">Back to Login</Link>
        </div>
      </Card>
    </main>
  );
}
