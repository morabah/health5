"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { loadDoctorProfilePublic } from '@/data/doctorLoaders';
import { mockGetAvailableSlots, mockBookAppointment } from "@/lib/mockApiService";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { format, addDays, isSameDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import 'react-day-picker/dist/style.css';
import ApiModeIndicator from "@/components/ui/ApiModeIndicator";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { 
  MapPinIcon, 
  GlobeAltIcon, 
  BriefcaseIcon, 
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  VideoCameraIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { AppointmentStatus } from "@/types/enums";
import { getMockDoctorAvailability } from "@/data/mockDataService";
import { getUsersStore } from "@/data/mockDataStore";
import type { DoctorAvailabilitySlot } from "@/types/doctor";

interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  specialty: string;
  experience: number;
  location: string;
  languages: string[];
  fee: number;
  available: boolean;
  profilePicUrl: string;
  userId: string;
}

type AppointmentType = "IN_PERSON" | "VIDEO";

export default function BookAppointmentPage() {
  const { doctorId } = useParams() as { doctorId: string };
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const defaultDateStr = addDays(new Date(), 1).toISOString().split('T')[0];
  const [dateString, setDateString] = useLocalStorage<string>(`book_${doctorId}_dateString`, defaultDateStr);
  const [selectedTime, setSelectedTime] = useLocalStorage<string | null>(`book_${doctorId}_selectedTime`, null);
  const [appointmentType, setAppointmentType] = useLocalStorage<AppointmentType>(`book_${doctorId}_appointmentType`, "IN_PERSON");
  const [reason, setReason] = useLocalStorage<string>(`book_${doctorId}_reason`, "");
  const [bookingInProgress, setBookingInProgress] = useState(false);
  
  const selectedDate = dateString ? new Date(dateString) : undefined;

  const router = useRouter();
  const { user } = useAuth();
  
  const timeStepRef = useRef<HTMLDivElement>(null);
  const typeStepRef = useRef<HTMLDivElement>(null);
  const reasonStepRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    setDateString(defaultDateStr);
    setSelectedTime(null);
    setAppointmentType("IN_PERSON");
    setReason("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      toast.error("Please log in to book an appointment");
      router.push('/auth/login');
    }
  }, [user, router]);

  // Load doctor profile
  useEffect(() => {
    async function fetchDoctor() {
      setLoading(true);
      try {
        const data = await loadDoctorProfilePublic(doctorId);
        
        if (data) {
          // Get the doctor's user data to get full name
          const users = getUsersStore();
          const doctorUser = users.find(u => u.id === doctorId);
          
          let doctorName = "Dr. Unknown";
          
          // Set the proper doctor name using the user data if available
          if (doctorUser && doctorUser.firstName && doctorUser.lastName) {
            doctorName = `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`;
          } else if (doctorId === 'user_doctor_001') {
            // Hardcoded fallback for main doctor
            doctorName = 'Dr. Bob Johnson';
          }
          
          // Convert to Doctor format with proper fallback values
          const doctorData: Doctor = {
            id: data.userId || doctorId,
            userId: data.userId || doctorId,
            name: doctorName,
            firstName: doctorUser?.firstName || '',
            lastName: doctorUser?.lastName || '',
            specialty: data.specialty || 'General Practice',
            experience: data.yearsOfExperience || 0,
            location: data.location || 'Not specified',
            languages: data.languages || ['English'],
            fee: data.consultationFee || 0,
            available: true,
            profilePicUrl: data.profilePictureUrl || '',
          };
          
          setDoctor(doctorData);
          console.log("Doctor loaded:", doctorData);
        } else {
          toast.error("Doctor not found");
          setDoctor(null);
        }
      } catch (error) {
        console.error("Error fetching doctor:", error);
        toast.error("Could not load doctor information");
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    }

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  // Load available slots when selected date changes
  useEffect(() => {
    async function fetchAvailableSlots() {
      if (!selectedDate || !doctor) return;
      
      setLoadingSlots(true);
      setSelectedTime(null);
      
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        
        // Get the day of week (0-6, where 0 is Sunday)
        const dayOfWeek = selectedDate.getDay();
        console.log(`Selected date ${dateString} is day of week: ${dayOfWeek}`);
        
        // Get doctor's weekly availability slots
        const doctorAvailability: DoctorAvailabilitySlot[] = getMockDoctorAvailability(doctor.userId);
        const availableDaysForDoctor = doctorAvailability.filter(slot => 
          slot.dayOfWeek === dayOfWeek && slot.isAvailable
        );
        
        console.log("Doctor availability for this day:", availableDaysForDoctor);
        
        // If doctor is not available on this day, return empty slots
        if (availableDaysForDoctor.length === 0) {
          setAvailableSlots([]);
          setLoadingSlots(false);
          return;
        }
        
        // If doctor is available on this day, get slots that don't conflict with appointments
        const slots = await mockGetAvailableSlots({ 
          doctorId: doctor.userId, 
          dateString 
        });
        
        // Filter slots based on doctor's availability hours for this day
        const filteredSlots = slots.filter(timeSlot => {
          const [hour, minute] = timeSlot.split(':').map(Number);
          
          // Check if this time slot is within any of the doctor's available time ranges for this day
          return availableDaysForDoctor.some(availableSlot => {
            const [startHour, startMinute] = availableSlot.startTime.split(':').map(Number);
            const [endHour, endMinute] = availableSlot.endTime.split(':').map(Number);
            
            // Convert all to minutes for easier comparison
            const slotMinutes = hour * 60 + minute;
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;
            
            // Check if slot is within the available range
            return slotMinutes >= startMinutes && slotMinutes < endMinutes;
          });
        });
        
        console.log(`Found ${filteredSlots.length} available slots after filtering by doctor schedule`);
        setAvailableSlots(filteredSlots);
      } catch (error) {
        console.error("Error fetching available slots:", error);
        toast.error("Could not load available time slots");
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }
    
    fetchAvailableSlots();
  }, [dateString, doctor]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setDateString(format(date, 'yyyy-MM-dd'));
      setTimeout(() => timeStepRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setTimeout(() => typeStepRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleAppointmentTypeChange = (type: AppointmentType) => {
    setAppointmentType(type);
    setTimeout(() => reasonStepRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleBookAppointment = async () => {
    if (!doctor || !selectedDate || !selectedTime || !user) {
      toast.error("Please select all appointment details");
      return;
    }
    
    setBookingInProgress(true);
    
    try {
      // Create a Timestamp from the selected date
      const dateObj = new Date(selectedDate);
      const appointmentTimestamp = Timestamp.fromDate(dateObj);
      
      // Calculate end time (30 minutes after start)
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endHour = hours + (minutes + 30 >= 60 ? 1 : 0);
      const endMinute = (minutes + 30) % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Create the appointment data object
      const appointmentData = {
        patientId: user.uid,
        doctorId: doctor.userId,
        appointmentDate: appointmentTimestamp,
        startTime: selectedTime,
        endTime: endTime,
        reason: reason.trim() || "General consultation",
        status: AppointmentStatus.PENDING,
        appointmentType: appointmentType === "IN_PERSON" ? "In-person" : "Video" as "In-person" | "Video",
        patientName: user.displayName || 'Patient',
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty
      };
      
      const result = await mockBookAppointment(appointmentData);
      
      if (result.success) {
        toast.success("Appointment booked successfully!");
        router.push('/patient/appointments?justBooked=true');
      } else {
        throw new Error("Booking failed");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setBookingInProgress(false);
    }
  };

  const goBack = () => {
    router.push('/main/find-doctors');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading doctor information...</p>
            </div>
          </div>
      </div>
      </main>
    );
  }

  if (!doctor) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[400px]">
            <EmptyState
              title="Doctor not found"
              message="The doctor you are looking for does not exist or is unavailable."
              action={
                <Button onClick={goBack} variant="primary" label="Go Back" pageName="BookAppointmentPage">
                  Back to Find Doctors
                </Button>
              }
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={goBack}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Book Appointment</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Step {selectedDate ? (selectedTime ? (appointmentType ? 4 : 3) : 2) : 1} of 4
            </span>
            <Button variant="outline" size="sm" onClick={handleReset}>Reset</Button>
            <ApiModeIndicator />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Doctor Information Sidebar */}
          <div className="md:col-span-4">
            <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="relative">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="absolute top-4 right-4">
                  {doctor.available ? (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-200">
                      Available
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-red-200">
                      Unavailable
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-16 left-6">
                  <img
                    src={doctor.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=0D8ABC&color=fff&size=128`}
                    alt={doctor.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=0D8ABC&color=fff&size=128`;
                    }}
                  />
                </div>
              </div>
              
              <div className="p-6 pt-20">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {doctor.name}
                </h2>
                
                <div className="flex items-center mt-1 text-sm text-blue-600 dark:text-blue-400 mb-4">
                  <BriefcaseIcon className="w-4 h-4 mr-2" />
                  <span>{doctor.specialty || 'General Practice'}</span>
                </div>
                
                <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <MapPinIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                    <span>{doctor.location || 'Location not specified'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <GlobeAltIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                    <span>{doctor.languages?.join(', ') || 'English'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <CurrencyDollarIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                    <span>Consultation fee: ${doctor.fee}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Booking Form */}
          <div className="md:col-span-8">
            <Card className="border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Schedule Your Appointment</h3>
                
                {/* Step 1: Select Date */}
                <div className="mb-8">
                  <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">1. Select a Date</h4>
                  <div className="flex justify-center">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={[
                        { before: addDays(new Date(), 1) }, // Disable past dates and today
                      ]}
                      modifiers={{ today: new Date() }}
                      modifiersClassNames={{ today: 'ring-2 ring-blue-500 text-blue-700' }}
                      className="border rounded-lg bg-white dark:bg-gray-800 p-4"
                    />
                  </div>
                </div>
                
                {/* Step 2: Select Time */}
                {selectedDate && (
                  <div ref={timeStepRef} className="mb-8">
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">
                      2. Select a Time Slot for {format(selectedDate, 'MMMM d, yyyy')}
                    </h4>
                    
                    {loadingSlots ? (
                      <div className="flex justify-center py-4">
                        <Spinner size="md" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No available time slots for this date. Please select another date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {availableSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                              selectedTime === time
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Step 3: Appointment Type */}
                {selectedTime && (
                  <div ref={typeStepRef} className="mb-8">
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">3. Appointment Type</h4>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => handleAppointmentTypeChange("IN_PERSON")}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border ${
                          appointmentType === "IN_PERSON"
                            ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        <UserGroupIcon className="w-5 h-5" />
                        <span className="font-medium">In-Person Visit</span>
                      </button>
                      
                      <button
                        onClick={() => handleAppointmentTypeChange("VIDEO")}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border ${
                          appointmentType === "VIDEO"
                            ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        <VideoCameraIcon className="w-5 h-5" />
                        <span className="font-medium">Video Consultation</span>
                      </button>
                </div>
              </div>
            )}
                
                {/* Step 4: Reason for Visit */}
                {selectedTime && (
                  <div ref={reasonStepRef} className="mb-8">
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">4. Reason for Visit (Optional)</h4>
                <Input
                  type="text"
                      placeholder="Brief description of your symptoms or reason for visit"
                  value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full"
                />
              </div>
            )}
                
                {/* Appointment Summary & Confirm Button */}
                {selectedDate && selectedTime && (
                  <div ref={summaryRef} className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-10 p-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Appointment Summary</h4>
                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <CalendarIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                          <span>Date: {format(selectedDate, 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                          <span>Time: {selectedTime}</span>
                        </div>
                        <div className="flex items-center">
                          {appointmentType === "IN_PERSON" ? (
                            <UserGroupIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <VideoCameraIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                          )}
                          <span>Type: {appointmentType === "IN_PERSON" ? "In-Person Visit" : "Video Consultation"}</span>
                        </div>
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                          <span>Fee: ${doctor.fee}</span>
                        </div>
                      </div>
                    </div>
                    
              <Button
                      variant="primary"
                      size="lg"
                      className="w-full justify-center"
                      onClick={handleBookAppointment}
                      disabled={bookingInProgress}
                      isLoading={bookingInProgress}
                      label="Confirm Appointment"
                      pageName="BookAppointmentPage"
                    >
                      Confirm Appointment
              </Button>
                  </div>
            )}
          </div>
        </div>
      </div>
    </div>
      </main>
  );
}
