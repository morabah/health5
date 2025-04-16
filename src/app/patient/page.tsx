"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";
import { loadPatientAppointments } from '@/data/patientLoaders';
import { AppointmentStatus } from "@/types/enums";
import { formatDate, isPastDate } from "@/utils/dateUtils";
import type { Appointment as AppointmentType } from "@/types/appointment";
import { Timestamp } from "firebase/firestore";

// Local interface for simplified appointments returned from API
interface Appointment {
  id: string;
  doctor: string;
  doctorId?: string;
  date: string | Date | Timestamp;
  status: AppointmentStatus;
}

function isUpcoming(appt: Appointment) {
  // Consider both status and date
  if (appt.status === AppointmentStatus.PENDING || appt.status === AppointmentStatus.CONFIRMED) {
    return true;
  }
  
  // Check if date is in the future
  return !isPastDate(appt.date);
}

function isPast(appt: Appointment) {
  // Consider both status and date
  if (appt.status === AppointmentStatus.COMPLETED || appt.status === AppointmentStatus.CANCELLED) {
    return true;
  }
  
  // Check if date is in the past
  return isPastDate(appt.date);
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
        // Fetch appointments and convert to simplified format
        const data = await loadPatientAppointments();
        const simplified: Appointment[] = data.map((appt: AppointmentType) => ({
          id: appt.id || '',
          doctor: appt.doctorName || 'Unknown Doctor',
          doctorId: appt.doctorId,
          // Handle both Firebase Timestamp and Date objects
          date: appt.appointmentDate,
          status: appt.status
        }));
        setAppointments(simplified);
      } catch (err) {
        setError("Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  const upcoming = appointments.filter(isUpcoming);
  const past = appointments.filter(isPast);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Patient Dashboard</h1>
      {/* Quick Links */}
      <div className="w-full max-w-3xl flex flex-wrap gap-4 justify-end mb-6">
        <Button asChild variant="secondary" label="Profile" pageName="PatientDashboard"><Link href="/patient/profile">Profile</Link></Button>
        <Button asChild variant="secondary" label="Notifications" pageName="PatientDashboard"><Link href="/notifications">Notifications</Link></Button>
        <Button asChild variant="secondary" label="Logout" pageName="PatientDashboard"><Link href="/auth/logout">Logout</Link></Button>
      </div>
      {/* Book Appointment CTA */}
      <div className="w-full max-w-3xl flex justify-end mb-4">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" label="Book Appointment" pageName="PatientDashboard"><Link href="/find">Book Appointment</Link></Button>
      </div>
      <Card className="w-full max-w-3xl mb-8 p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && upcoming.length === 0 && (
          <div className="text-gray-600 dark:text-gray-300">No upcoming appointments.</div>
        )}
        {/* Appointment Cards: Upcoming */}
        {!loading && upcoming.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {upcoming.map(appt => (
              <div key={appt.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <div className="font-bold text-lg mb-1 text-blue-900 dark:text-white">
                    <Link href={appt.doctorId ? `/main/doctor-profile/${appt.doctorId}` : '#'} className="hover:underline" aria-label={`View profile for ${appt.doctor}`}>{appt.doctor}</Link>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-1">{formatDate(appt.date)}</div>
                  <div className="mb-1">
                    <span className={
                      appt.status === AppointmentStatus.PENDING ? "inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                      appt.status === AppointmentStatus.CONFIRMED ? "inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                      appt.status === AppointmentStatus.CANCELLED ? "inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                      "inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }>
                      {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 md:mt-0">
                  <Button asChild size="sm" aria-label={`View appointment details`} label="View" pageName="PatientDashboard"><Link href={`/patient/appointments/${appt.id}`}>View</Link></Button>
                  {/* Cancel/Reschedule logic stubbed, enable when backend ready */}
                  {(appt.status === AppointmentStatus.PENDING || appt.status === AppointmentStatus.CONFIRMED) && <Button size="sm" variant="secondary" disabled label="Cancel" pageName="PatientDashboard">Cancel</Button>}
                  {(appt.status === AppointmentStatus.PENDING || appt.status === AppointmentStatus.CONFIRMED) && <Button size="sm" variant="secondary" disabled label="Reschedule" pageName="PatientDashboard">Reschedule</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card className="w-full max-w-3xl mb-8 p-6">
        <h2 className="text-xl font-semibold mb-4">Past Appointments</h2>
        {!loading && !error && past.length === 0 && (
          <div className="text-gray-600 dark:text-gray-300">No past appointments.</div>
        )}
        {/* Appointment Cards: Past */}
        {!loading && past.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {past.map(appt => (
              <div key={appt.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <div className="font-bold text-lg mb-1 text-blue-900 dark:text-white">
                    <Link href={appt.doctorId ? `/main/doctor-profile/${appt.doctorId}` : '#'} className="hover:underline" aria-label={`View profile for ${appt.doctor}`}>{appt.doctor}</Link>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-1">{formatDate(appt.date)}</div>
                  <div className="mb-1">
                    <span className={
                      appt.status === AppointmentStatus.COMPLETED ? "inline-block px-2 py-1 text-xs rounded bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200" :
                      appt.status === AppointmentStatus.CANCELLED ? "inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                      "inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }>
                      {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 md:mt-0">
                  <Button asChild size="sm" aria-label={`View appointment details`} label="View" pageName="PatientDashboard"><Link href={`/patient/appointments/${appt.id}`}>View</Link></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
