'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { AppointmentStatus } from "@/types/enums";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: AppointmentStatus;
  reason: string;
}

const AppointmentListPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const router = useRouter();

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setError(null);
      try {
        const q = filter === "all" ? query(collection(db, "appointments")) : query(collection(db, "appointments"), where("status", "==", filter));
        const querySnapshot = await getDocs(q);
        const shaped = querySnapshot.docs.map(doc => ({
          id: doc.id,
          patientName: doc.data().patientName || '',
          doctorName: doc.data().doctorName || '',
          date: doc.data().appointmentDate || '',
          time: doc.data().startTime || '',
          type: doc.data().appointmentType || '',
          status: doc.data().status,
          reason: doc.data().reason || '',
        }));
        setAppointments(shaped);
      } catch (err) {
        setError("Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, [filter]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">All Appointments</h1>
      <Card className="w-full max-w-5xl mb-8 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Appointment List</h2>
          <div className="flex gap-2 items-center">
            <label htmlFor="filter" className="text-sm font-medium">Status:</label>
            <select
              id="filter"
              className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100"
              value={filter}
              onChange={e => setFilter(e.target.value as "all" | AppointmentStatus)}
            >
              <option value="all">All</option>
              <option value={AppointmentStatus.PENDING}>Pending</option>
              <option value={AppointmentStatus.CONFIRMED}>Confirmed</option>
              <option value={AppointmentStatus.COMPLETED}>Completed</option>
              <option value={AppointmentStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && appointments.length === 0 && (
          <EmptyState
            title="No appointments found."
            message="There are no appointments in this category."
            className="my-8"
          />
        )}
        {!loading && !error && appointments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                    <td className="px-4 py-2 whitespace-nowrap">{appt.patientName}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{appt.doctorName}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{appt.date}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{appt.time}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{appt.type}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        appt.status === AppointmentStatus.PENDING ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                        appt.status === AppointmentStatus.CONFIRMED ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                        appt.status === AppointmentStatus.COMPLETED ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{appt.reason}</td>
                    <td className="px-4 py-2 text-right">
                      <Button label="Details" pageName="AdminAppointments" size="sm" disabled />
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
};

export default AppointmentListPage;
