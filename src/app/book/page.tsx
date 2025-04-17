"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Link from "next/link";
import { mockGetAvailableSlots, mockBookAppointment, mockGetDoctorPublicProfile } from "@/lib/mockApiService";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams, useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import Alert from "@/components/ui/Alert";
import { AppointmentStatus } from "@/types/enums";
import { toast } from "react-hot-toast";
import { parseISO } from "date-fns";

interface AppointmentSlot {
  id: string;
  doctorName: string;
  specialty: string;
  time: string;
  location: string;
  available: boolean;
}

export default function BookPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [dateString, setDateString] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [appointmentReason, setAppointmentReason] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<'In-person' | 'Video'>('In-person');
  const [success, setSuccess] = useState<boolean>(false);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  
  // Safe access to searchParams - since searchParams is an object, not the URLSearchParams
  const doctorId = typeof searchParams?.doctorId === 'string' ? searchParams.doctorId : "mockDoctorId";

  useEffect(() => {
    async function fetchDoctorProfile() {
      try {
        const doctorData = await mockGetDoctorPublicProfile({ doctorId });
        setDoctorInfo(doctorData);
      } catch (err) {
        console.error("Failed to load doctor profile:", err);
      }
    }
    
    fetchDoctorProfile();
  }, [doctorId]);

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      setError(null);
      try {
        const items = await mockGetAvailableSlots({ doctorId, dateString: dateString });
        setSlots(items.map((time: string, idx: number) => ({
          id: `slot-${idx}`,
          doctorName: doctorInfo?.name || "Dr. Demo",
          specialty: doctorInfo?.specialty || "General",
          time,
          location: doctorInfo?.location || "Demo Clinic",
          available: true,
        })));
      } catch (err) {
        setError("Failed to load appointment slots.");
      } finally {
        setLoading(false);
      }
    }
    
    if (dateString) {
      fetchSlots();
    }
  }, [dateString, doctorId, doctorInfo]);

  const handleBookSlot = async (slotId: string) => {
    setBookingId(slotId);
    
    if (!user) {
      setError("You must be logged in to book an appointment");
      return;
    }
    
    const selectedSlot = slots.find(s => s.id === slotId);
    if (!selectedSlot) {
      setError("Invalid slot selection");
      return;
    }
    
    const date = parseISO(dateString);
    
    try {
      const timeparts = selectedSlot.time.split(':').map(t => parseInt(t));
      const appointmentDate = new Date(date);
      appointmentDate.setHours(timeparts[0], timeparts[1], 0);
      
      const startTime = selectedSlot.time;
      const [hours, minutes] = startTime.split(':');
      const endTimeDate = new Date(appointmentDate);
      endTimeDate.setHours(parseInt(hours), parseInt(minutes) + 30);
      const endTime = `${endTimeDate.getHours().toString().padStart(2, '0')}:${endTimeDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Create a Timestamp for Firestore
      const timestamp = Timestamp.fromDate(appointmentDate);
      
      // Book the appointment
      const result = await mockBookAppointment({
        patientId: user.uid,
        doctorId,
        appointmentDate: timestamp,
        startTime,
        endTime,
        reason: appointmentReason,
        appointmentType: appointmentType,
      });
      
      if (result.success) {
        toast.success(`Appointment booked successfully!`);
        router.push('/patient/appointments');
      } else {
        setError("Failed to book appointment");
        setBookingId(null);
      }
    } catch (err) {
      console.error("[BookPage] Error booking appointment:", err);
      setError("An error occurred while booking the appointment");
      setBookingId(null);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Appointment Booked!</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Your appointment request has been submitted. You will receive a confirmation notification soon.
          </p>
          <div className="flex flex-col gap-4">
            <Button 
              asChild 
              label="View My Appointments" 
              pageName="BookAppointment"
              variant="primary"
            >
              <Link href="/patient/appointments">View My Appointments</Link>
            </Button>
            <Button 
              asChild 
              label="Book Another Appointment" 
              pageName="BookAppointment"
              variant="secondary"
            >
              <Link href="/find">Find Another Doctor</Link>
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Book Appointment</h1>
      
      {doctorInfo && (
        <Card className="w-full max-w-4xl mb-6 p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-200 to-blue-200 dark:from-emerald-900 dark:to-blue-900 flex items-center justify-center">
                <span className="text-3xl text-blue-800 dark:text-emerald-200 font-bold">
                  {doctorInfo.name?.charAt(0) || 'D'}
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{doctorInfo.name || "Doctor"}</h2>
              <p className="text-gray-600 dark:text-gray-300">{doctorInfo.specialty || "Specialty"}</p>
              <p className="text-gray-500 dark:text-gray-400">{doctorInfo.location || "Location"}</p>
              {doctorInfo.consultationFee && (
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Consultation Fee: ${doctorInfo.consultationFee}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
      
      <Card className="w-full max-w-4xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Schedule Appointment</h2>
          <Button 
            asChild 
            label="Back to Find a Doctor" 
            pageName="BookAppointment"
          >
            <Link href="/find">Back to Find a Doctor</Link>
          </Button>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Date
              </label>
              <Input 
                type="date" 
                value={dateString} 
                onChange={(e) => setDateString(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Appointment Type
              </label>
              <Select
                options={[
                  { value: "In-person", label: "In-person" },
                  { value: "Video", label: "Video" },
                ]}
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as 'In-person' | 'Video')}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason for Appointment *
            </label>
            <Textarea
              value={appointmentReason}
              onChange={(e) => setAppointmentReason(e.target.value)}
              placeholder="Please describe your symptoms or reason for this appointment"
              required
            />
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Available Slots</h3>
          {loading && <div className="flex justify-center py-8"><Spinner /></div>}
          {error && <Alert variant="error" message={error} isVisible={true} />}
          {!loading && !error && slots.length === 0 && (
            <div className="text-gray-600 dark:text-gray-300 py-4 text-center">
              No appointment slots found for the selected date.
            </div>
          )}
          
          {!loading && slots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
              {slots.map(slot => (
                <button
                  key={slot.id}
                  className={`py-3 px-4 rounded border text-center transition-colors ${
                    slot.available 
                      ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-300'
                      : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => slot.available && handleBookSlot(slot.id)}
                  disabled={!slot.available || !!bookingId || !appointmentReason.trim()}
                >
                  {bookingId === slot.id ? <Spinner size="sm" /> : slot.time}
                </button>
              ))}
            </div>
          )}
          
          {feedback && <div className="mt-4 text-center text-blue-600 dark:text-blue-400">{feedback}</div>}
        </div>
      </Card>
    </main>
  );
}
