"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { db } from "@/lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";

interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
}

export default function PatientProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        // For static mock, use a fixed ID or fetch from auth context if available
        const ref = doc(db, "mockPatientProfiles", "mockPatientId");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile({ id: snap.id, ...snap.data() } as PatientProfile);
        } else {
          setProfile(null);
        }
      } catch (err) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Patient Profile</h1>
      <Card className="w-full max-w-xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Profile Details</h2>
          <Button asChild>
            <Link href="/patient">Back to Dashboard</Link>
          </Button>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && profile && (
          <div className="space-y-4">
            <div><span className="font-medium">Name:</span> {profile.name}</div>
            <div><span className="font-medium">Email:</span> {profile.email}</div>
            <div><span className="font-medium">Phone:</span> {profile.phone}</div>
            <div><span className="font-medium">Date of Birth:</span> {profile.dob}</div>
            <div><span className="font-medium">Address:</span> {profile.address}</div>
            <Button size="sm" onClick={() => console.log('Edit profile')}>Edit Profile</Button>
          </div>
        )}
        {!loading && !error && !profile && (
          <div className="text-gray-600 dark:text-gray-300">Profile not found.</div>
        )}
      </Card>
    </main>
  );
}
