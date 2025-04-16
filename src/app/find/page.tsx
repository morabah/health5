"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs } from "firebase/firestore";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  location: string;
  available: boolean;
}

export default function FindDoctorPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await getDocs(collection(db, "mockDoctors"));
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Doctor[];
        setDoctors(items);
      } catch (err) {
        setError("Failed to load doctors.");
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Find a Doctor</h1>
      <Card className="w-full max-w-4xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Available Doctors</h2>
          <Button asChild>
            <Link href="/patient">Back to Dashboard</Link>
          </Button>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && doctors.length === 0 && (
          <div className="text-gray-600 dark:text-gray-300">No doctors found.</div>
        )}
        {!loading && doctors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Specialty</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Available</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doc => (
                  <tr key={doc.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{doc.name}</td>
                    <td className="px-4 py-2">{doc.specialty}</td>
                    <td className="px-4 py-2">{doc.location}</td>
                    <td className="px-4 py-2">
                      {doc.available ? (
                        <span className="text-green-600 dark:text-green-400">Yes</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Button size="sm" onClick={() => console.log('Book doctor', doc.id)} disabled={!doc.available}>
                        Book
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
