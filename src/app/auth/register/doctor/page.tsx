"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function DoctorRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    license: "",
    specialty: ""
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setLicenseFile(e.target.files[0]);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback("Registering doctor...");
    setTimeout(() => {
      setFeedback("Registration simulated. State: " + JSON.stringify({ ...form, licenseFile: licenseFile ? licenseFile.name : null }));
    }, 700);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Doctor Registration</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Full Name" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
          <Input label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
          <Input label="Medical License #" name="license" value={form.license} onChange={handleChange} required />
          <Input label="Specialty" name="specialty" value={form.specialty} onChange={handleChange} required />
          <div>
            <label className="block text-sm font-medium mb-1">Upload License Document</label>
            <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="block w-full text-gray-900 dark:text-gray-100" />
          </div>
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
