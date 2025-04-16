"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { mockRegisterUser } from "@/lib/mockApiService";
import { UserType } from "@/types/enums";

export default function PatientRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback("Registering patient...");
    // Basic validation
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setFeedback("Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFeedback("Passwords do not match.");
      return;
    }
    try {
      const result = await mockRegisterUser({
        name: form.name,
        email: form.email,
        password: form.password,
        userType: UserType.PATIENT,
      });
      setFeedback("Registration successful! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1000);
    } catch (err: any) {
      setFeedback(err.message === "already-exists" ? "Email already registered." : "Registration failed.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Patient Registration</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Full Name" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
          <Input label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
          <Button type="submit" className="w-full">Register</Button>
        </form>
        {feedback && <div className="mt-4 text-center text-sm text-blue-600 dark:text-blue-400">{feedback}</div>}
        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">Back to Login</Link>
        </div>
      </Card>
    </main>
  );
}
