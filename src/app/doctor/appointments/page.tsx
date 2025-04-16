"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { mockGetMyAppointments } from "@/lib/mockApiService";
import { useAuth } from "@/context/AuthContext";

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: string;
  notes?: string;
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      setError(null);
      try {
        if (!user) return;
        // Simulate fetching the doctor's appointments
        const items = await mockGetMyAppointments(user.uid, "doctor");
        setAppointments(items);
      } catch (err) {
        setError("Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, [user]);

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">My Appointments</h1>
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}
      {error && (
        <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
      )}
      {!loading && !error && appointments.length === 0 && (
        <EmptyState
          title="No appointments scheduled."
          message="You have no appointments at this time. Appointments with patients will appear here."
          className="my-8"
        />
      )}
      {!loading && appointments.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {appointments.map((appt) => (
            <Card key={appt.id} className="p-4">
              <div className="flex flex-col gap-1">
                <div className="font-semibold text-lg">{appt.patientName}</div>
                <div className="text-sm text-muted-foreground">{new Date(appt.date).toLocaleDateString()} {appt.time}</div>
                <div className="text-xs text-muted-foreground">Type: {appt.type}</div>
                <div className="text-xs text-muted-foreground">Status: {appt.status}</div>
                {appt.notes && (
                  <div className="text-xs text-gray-500 mt-1">Notes: {appt.notes}</div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button disabled title="Feature coming soon">View Details</Button>
                  <Button disabled variant="secondary" title="Feature coming soon">Mark as Completed</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
