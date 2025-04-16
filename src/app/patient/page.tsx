"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";
import { loadPatientAppointments } from '@/data/patientLoaders';

interface Appointment {
  id: string;
  doctor: string;
  date: string;
  status: string;
}

export default function PatientPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      setError(null);
      try {
        const data = await loadPatientAppointments();
        setAppointments(data);
      } catch (err) {
        setError("Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Patient Dashboard</h1>
      <Card className="w-full max-w-3xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Appointments</h2>
          <Button asChild>
            <Link href="/find">Find a Doctor</Link>
          </Button>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && appointments.length === 0 && (
          <div className="text-gray-600 dark:text-gray-300">No appointments found.</div>
        )}
        {!loading && appointments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-2 text-left">Doctor</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{appt.doctor}</td>
                    <td className="px-4 py-2">{appt.date}</td>
                    <td className="px-4 py-2">{appt.status}</td>
                    <td className="px-4 py-2">
                      <Button size="sm" onClick={() => console.log('View appt', appt.id)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="w-full max-w-3xl flex justify-end">
        <Button asChild variant="secondary">
          <Link href="/patient/profile">Profile</Link>
        </Button>
      </div>
    </main>
  );
}
