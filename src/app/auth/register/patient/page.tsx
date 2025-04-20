"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Link from "next/link";
import { mockRegisterUser } from "@/lib/mockApiService";
import { UserType } from "@/types/enums";

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback("Registering patient...");
    
    // Basic validation
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) {
      setFeedback("Please fill in all required fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFeedback("Passwords do not match.");
      return;
    }
    
    try {
      const result = await mockRegisterUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
        password: form.password,
        userType: UserType.PATIENT,
        // These will be added to the patient profile
        patientData: {
          dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : null,
          gender: (["Male", "Female", "Other"].includes(form.gender) ? form.gender : null) as "Male" | "Female" | "Other" | null,
          bloodType: form.bloodType || null,
          medicalHistory: form.medicalHistory || null
        }
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
          
          <Button type="submit" label="Register" pageName="PatientRegistration" className="w-full">Register</Button>
        </form>
        {feedback && <div className="mt-4 text-center text-sm text-blue-600 dark:text-blue-400">{feedback}</div>}
        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">Back to Login</Link>
        </div>
      </Card>
    </main>
  );
}
