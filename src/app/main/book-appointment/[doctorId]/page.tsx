"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadDoctorAvailability } from '@/data/doctorLoaders';
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { logValidation } from "@/lib/logger";

interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  specialty: string;
  profilePicUrl: string;
  fee: number;
  userId: string;
}

interface Slot {
  id: string;
  date: string; // ISO
  time: string; // e.g. "09:00 AM"
  available: boolean;
}

type AppointmentType = "In-person" | "Video";

export default function BookAppointmentPage() {
  const { doctorId } = useParams() as { doctorId: string };
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("In-person");
  const [reason, setReason] = useState<string>("");
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchDoctorAndSlots() {
      setLoading(true);
      try {
        // Fetch doctor info
        const doctorData = await loadDoctorAvailability(doctorId);
        setDoctor({ id: doctorId, ...doctorData } as Doctor);
        setSlots(doctorData.slots);
      } catch {
        setDoctor(null);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctorAndSlots();
  }, [doctorId]);

  useEffect(() => {
    logValidation("main-book-appointment-ui", "success");
  }, []);

  // Extract unique dates from slots
  const availableDates = Array.from(new Set(slots.map((slot) => slot.date)));
  const slotsForDate = slots.filter((slot) => slot.date === selectedDate && slot.available);

  const handleBook = async () => {
    setBooking(true);
    // Simulate booking
    setTimeout(() => {
      setSuccess(true);
      setBooking(false);
      setTimeout(() => router.push("/patient/appointments"), 1500);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner />
      </div>
    );
  }

  if (!doctor) {
    return <div className="text-center text-muted-foreground">Doctor not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 md:px-12 lg:px-32">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 mb-6 flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 flex flex-col items-center md:items-start">
            <img
              src={doctor.profilePicUrl}
              alt={doctor.firstName ?? doctor.name ?? doctor.userId}
              className="w-20 h-20 rounded-full object-cover border mb-2"
            />
            <div className="font-semibold text-lg">{doctor.name ?? `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() || doctor.userId}</div>
            <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
            <div className="text-xs text-muted-foreground">Fee: ${doctor.fee}</div>
          </div>
          <div className="md:w-2/3">
            <div className="mb-4">
              <label className="font-medium">Select Date</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableDates.length === 0 ? (
                  <span className="text-muted-foreground">No available dates.</span>
                ) : (
                  availableDates.map((date) => (
                    <Button
                      key={date}
                      variant={selectedDate === date ? "default" : "secondary"}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(""); }}
                    >
                      {new Date(date).toLocaleDateString()}
                    </Button>
                  ))
                )}
              </div>
            </div>
            {selectedDate && (
              <div className="mb-4">
                <label className="font-medium">Select Time Slot</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {slotsForDate.length === 0 ? (
                    <span className="text-muted-foreground">No slots available for this date.</span>
                  ) : (
                    slotsForDate.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedSlot === slot.id ? "default" : "secondary"}
                        onClick={() => setSelectedSlot(slot.id)}
                      >
                        {slot.time}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            )}
            {selectedSlot && (
              <div className="mb-4">
                <label className="font-medium">Appointment Type</label>
                <div className="flex gap-4 mt-2">
                  {["In-person", "Video"].map((type) => (
                    <Button
                      key={type}
                      variant={appointmentType === type ? "default" : "secondary"}
                      onClick={() => setAppointmentType(type as AppointmentType)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {selectedSlot && (
              <div className="mb-4">
                <label className="font-medium">Reason for Visit (optional)</label>
                <Input
                  type="text"
                  placeholder="Brief reason for visit"
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
                />
              </div>
            )}
            {selectedSlot && (
              <Button
                className="w-full mt-2"
                onClick={handleBook}
                disabled={booking}
              >
                {booking ? "Booking..." : "Book Appointment"}
              </Button>
            )}
            {success && (
              <div className="text-green-600 mt-3 text-center">Appointment booked! Redirecting...</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
