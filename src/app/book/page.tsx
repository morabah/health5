"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { mockGetAvailableSlots, mockBookAppointment } from "@/lib/mockApiService";
import { useAuth } from "@/context/AuthContext";

interface AppointmentSlot {
  id: string;
  doctorName: string;
  specialty: string;
  time: string;
  location: string;
  available: boolean;
}

export default function BookAppointmentPage() {
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      setError(null);
      try {
        const items = await mockGetAvailableSlots({ doctorId: "mockDoctorId", dateString: new Date().toISOString().slice(0, 10) });
        setSlots(items.map((time: string, idx: number) => ({
          id: `slot-${idx}`,
          doctorName: "Dr. Demo",
          specialty: "General",
          time,
          location: "Demo Clinic",
          available: true,
        })));
      } catch (err) {
        setError("Failed to load appointment slots.");
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, []);

  const handleBook = async (slotId: string, slotTime: string) => {
    if (!user) {
      setFeedback("You must be logged in to book an appointment.");
      return;
    }
    setBookingId(slotId);
    setFeedback(null);
    try {
      await mockBookAppointment({
        patientId: user.uid,
        doctorId: "mockDoctorId",
        appointmentDate: { toDate: () => new Date() },
        startTime: slotTime,
        endTime: slotTime,
      });
      setFeedback("Appointment booked successfully!");
    } catch (err) {
      setFeedback("Failed to book appointment.");
    } finally {
      setBookingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Book Appointment</h1>
      <Card className="w-full max-w-4xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Available Slots</h2>
          <Button asChild>
            <Link href="/find">Back to Find a Doctor</Link>
          </Button>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && slots.length === 0 && (
          <div className="text-gray-600 dark:text-gray-300">No appointment slots found.</div>
        )}
        {!loading && slots.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-2 text-left">Doctor</th>
                  <th className="px-4 py-2 text-left">Specialty</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Available</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{slot.doctorName}</td>
                    <td className="px-4 py-2">{slot.specialty}</td>
                    <td className="px-4 py-2">{slot.time}</td>
                    <td className="px-4 py-2">{slot.location}</td>
                    <td className="px-4 py-2">
                      {slot.available ? (
                        <span className="text-green-600 dark:text-green-400">Yes</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <Button size="sm" onClick={() => handleBook(slot.id, slot.time)} disabled={!slot.available || bookingId === slot.id}>
                        {bookingId === slot.id ? "Booking..." : "Book"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {feedback && <div className="mt-4 text-center text-blue-600 dark:text-blue-400">{feedback}</div>}
      </Card>
    </main>
  );
}
