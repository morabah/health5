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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointmentReason, setAppointmentReason] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<string>("In-person");
  const [success, setSuccess] = useState<boolean>(false);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const doctorId = searchParams.get('doctorId') || "mockDoctorId";

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
        const items = await mockGetAvailableSlots({ doctorId, dateString: selectedDate });
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
    
    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate, doctorId, doctorInfo]);

  const handleBook = async (slotId: string, slotTime: string) => {
    if (!user) {
      setFeedback("You must be logged in to book an appointment.");
      return;
    }
    
    if (!appointmentReason.trim()) {
      setFeedback("Please provide a reason for your appointment.");
      return;
    }
    
    setBookingId(slotId);
    setFeedback("Booking your appointment...");
    try {
      const dateObj = new Date(selectedDate);
      const appointmentTimestamp = Timestamp.fromDate(dateObj);
      
      // Calculate end time (30 minutes after start)
      const [startHour, startMinute] = slotTime.split(':').map(Number);
      let endHour = startHour;
      let endMinute = startMinute + 30;
      
      if (endMinute >= 60) {
        endMinute -= 60;
        endHour += 1;
      }
      
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      const response = await mockBookAppointment({
        patientId: user.uid,
        doctorId: doctorId,
        appointmentDate: appointmentTimestamp,
        startTime: slotTime,
        endTime: endTime,
        reason: appointmentReason,
        status: AppointmentStatus.PENDING,
        appointmentType: appointmentType,
        patientName: user.displayName || 'Patient',
        doctorName: doctorInfo?.name || 'Doctor',
        doctorSpecialty: doctorInfo?.specialty || 'Specialty',
      });
      
      setSuccess(true);
      setFeedback("Appointment booked successfully!");
      
      // After 2 seconds, redirect to appointments page
      setTimeout(() => {
        router.push('/patient/appointments');
      }, 2000);
      
    } catch (err) {
      setFeedback("Failed to book appointment. Please try again.");
    } finally {
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
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
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
                  { value: "Phone", label: "Phone" }
                ]}
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
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
                  onClick={() => slot.available && handleBook(slot.id, slot.time)}
                  disabled={!slot.available || !!bookingId || !appointmentReason.trim()}
                >
                  {bookingId === slot.id ? <Spinner size="small" /> : slot.time}
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
