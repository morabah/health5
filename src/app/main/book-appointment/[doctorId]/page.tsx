"use client";
import { useEffect, useState, useRef, useCallback } from "react";
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
import dynamic from "next/dynamic";
const DayPicker = dynamic(
  () => import("react-day-picker").then(mod => mod.DayPicker),
  { ssr: false, loading: () => <Spinner size="md" /> }
);
import DoctorAvailabilityCalendar from '@/components/DoctorAvailabilityCalendar';
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
  UserGroupIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { Transition, Dialog } from "@headlessui/react";
import { Fragment } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { AppointmentStatus } from "@/types/enums";
import { getMockDoctorAvailability } from "@/data/mockDataService";
import { getUsersStore, getDoctorProfilesStore } from "@/data/mockDataStore";
import type { DoctorAvailabilitySlot } from "@/types/doctor";
import { saveAs } from 'file-saver';
import ical from 'ical-generator';

// Add these CSS styles at the top of the file
const timeSlotStyles = {
  available: `py-3 px-3 rounded-md text-sm font-medium transition-all transform hover:scale-105
    bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 
    hover:from-blue-100 hover:to-blue-200 hover:shadow-md
    dark:from-blue-900/30 dark:to-blue-800/40 dark:text-blue-300 
    dark:hover:from-blue-800/50 dark:hover:to-blue-700/60 border border-blue-200 dark:border-blue-700`,
  
  selected: `py-3 px-3 rounded-md text-sm font-medium transition-all transform scale-105
    bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md
    hover:from-blue-600 hover:to-blue-700 border border-blue-400 dark:border-blue-500`,
  
  past: `py-3 px-3 rounded-md text-sm font-medium transition-colors 
    bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed
    dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700`,
};

// Add a helper function to categorize time slots
function getTimeCategory(time: string): 'morning' | 'afternoon' | 'evening' {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// Add a tooltip component for time slots
const TimeSlotTooltip = ({ time, onClick, isSelected, isDisabled }: { 
  time: string, 
  onClick: () => void, 
  isSelected: boolean, 
  isDisabled: boolean
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Parse hour for better display
  const [hour, minute] = time.split(':').map(Number);
  const displayHour = hour > 12 ? hour - 12 : hour;
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const formattedTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${amPm}`;
  
  return (
    <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={isDisabled ? timeSlotStyles.past : (isSelected ? timeSlotStyles.selected : timeSlotStyles.available)}
        aria-label={`Select ${formattedTime} appointment time`}
      >
        {formattedTime}
      </button>
      
      {showTooltip && (
        <div className="absolute z-10 w-48 px-3 py-2 -mt-1 text-sm font-medium text-white transform -translate-y-full bg-gray-900 rounded-md shadow-lg top-0 left-1/2 -translate-x-1/2 dark:bg-gray-800">
          <p>
            {isSelected ? '✓ Selected' : 'Click to select'} {formattedTime}
          </p>
          <div className="absolute w-2 h-2 transform rotate-45 bg-gray-900 -translate-x-1/2 left-1/2 -bottom-1 dark:bg-gray-800"></div>
        </div>
      )}
    </div>
  );
};

// Debug component to help diagnose doctor data issues
const DebugInfo = ({ doctorId }: { doctorId: string }) => {
  const [debugData, setDebugData] = useState<any>({
    loading: true,
    doctors: [],
    usersCount: 0,
    specificDoctor: null,
    error: null
  });

  useEffect(() => {
    async function loadDebugData() {
      try {
        // Get all doctors from the store
        const doctors = getDoctorProfilesStore();
        const users = getUsersStore();
        const specificDoctor = doctors.find(d => d.userId === doctorId);
        const specificUser = users.find(u => u.id === doctorId);
        
        // Load doctor profile directly
        let profileData = null;
        try {
          profileData = await loadDoctorProfilePublic(doctorId);
        } catch (error) {
          console.error("Error loading doctor profile:", error);
        }

        setDebugData({
          loading: false,
          doctors: doctors.map(d => ({ userId: d.userId, specialty: d.specialty })),
          usersCount: users.length,
          specificDoctor,
          specificUser,
          profileData,
          error: null
        });
      } catch (error) {
        setDebugData({
          loading: false,
          doctors: [],
          usersCount: 0,
          specificDoctor: null,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    loadDebugData();
  }, [doctorId]);

  if (debugData.loading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800">Loading debug data...</div>;
  }

  if (debugData.error) {
    return <div className="p-4 bg-red-100 text-red-800">Error: {debugData.error}</div>;
  }

  return (
    <div className="p-4 border border-gray-300 bg-gray-50 my-4 rounded-md">
      <h2 className="text-lg font-bold">Debug Info (Doctor ID: {doctorId})</h2>
      <div className="mt-2 space-y-2 text-sm">
        <p>Total doctors: {debugData.doctors.length}</p>
        <p>Total users: {debugData.usersCount}</p>
        <p>Doctor exists in store: {debugData.specificDoctor ? 'Yes' : 'No'}</p>
        <p>User exists in store: {debugData.specificUser ? 'Yes' : 'No'}</p>
        <p>Doctor profile data: {debugData.profileData ? 'Found' : 'Not found'}</p>
        
        <div className="mt-2">
          <p className="font-semibold">Available Doctors:</p>
          <ul className="list-disc pl-6">
            {debugData.doctors.map((doc: any, idx: number) => (
              <li key={idx}>{doc.userId} - {doc.specialty}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

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

// Add a SuccessScreen component that appears after booking
const AppointmentSuccessScreen = ({ 
  appointment, 
  doctor, 
  onViewAppointments, 
  onAddToCalendar 
}: { 
  appointment: any, 
  doctor: Doctor,
  onViewAppointments: () => void,
  onAddToCalendar: () => void
}) => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Appointment Confirmed!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your appointment with Dr. {doctor.lastName} has been scheduled successfully.
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Appointment Details</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-3 text-blue-500 dark:text-blue-400" />
              <span className="text-gray-700 dark:text-gray-300">{format(appointment.date, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 mr-3 text-blue-500 dark:text-blue-400" />
              <span className="text-gray-700 dark:text-gray-300">{appointment.startTime}</span>
            </div>
            <div className="flex items-center">
              <MapPinIcon className="w-5 h-5 mr-3 text-blue-500 dark:text-blue-400" />
              <span className="text-gray-700 dark:text-gray-300">{doctor.location}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button 
            variant="secondary" 
            onClick={onAddToCalendar}
            className="justify-center"
            label="Add to Calendar"
            pageName="BookAppointmentPage"
          >
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Add to Calendar
            </div>
          </Button>
          
          <Button 
            variant="primary" 
            onClick={onViewAppointments}
            className="justify-center"
            label="View My Appointments"
            pageName="BookAppointmentPage"
          >
            <div className="flex items-center">
              <ChevronRightIcon className="w-5 h-5 mr-2" />
              View My Appointments
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

// Add new function to fetch available days for a month
function fetchAvailableDaysForMonth(doctor: Doctor | null, month: Date): Set<string> {
  console.log(`Fetching available days for ${month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
  
  if (!doctor) return new Set<string>();
  
  try {
    // Get first and last day of the month
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    // Get doctor's weekly availability slots
    const doctorAvailability = getMockDoctorAvailability(doctor.userId);
    console.log(`Retrieved ${doctorAvailability.length} availability slots for doctor`);
    
    // Get the days of week where the doctor is available
    const availableDaysOfWeek = doctorAvailability
      .filter((slot: { isAvailable: boolean }) => slot.isAvailable)
      .map((slot: { dayOfWeek: number }) => slot.dayOfWeek);
    
    console.log(`Doctor is available on days of week: ${availableDaysOfWeek.join(', ')}`);
    
    // If doctor isn't available on any day, return empty set
    if (availableDaysOfWeek.length === 0) {
      return new Set<string>();
    }
    
    // Loop through all days in the month
    const availableDays = new Set<string>();
    const today = new Date();
    let currentDay = new Date(firstDay);
    
    while (currentDay <= lastDay) {
      // Check if this day of week is in doctor's availability
      if (availableDaysOfWeek.includes(currentDay.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
        // Don't add days in the past
        if (currentDay > today) {
          // Format date as ISO string and add to set
          availableDays.add(format(currentDay, 'yyyy-MM-dd'));
        }
      }
      
      // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    console.log(`Found ${availableDays.size} available days in ${month.toLocaleDateString('en-US', { month: 'long' })}`);
    return availableDays;
  } catch (error) {
    console.error("Error fetching available days:", error);
    return new Set<string>();
  }
}

export default function BookAppointmentPage() {
  const params = useParams();
  const doctorId = params?.doctorId as string || "";
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateString, setDateString] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(null);
  const [reason, setReason] = useState<string>('');
  const [bookingAppointment, setBookingAppointment] = useState(false);
  const [appointmentBooked, setAppointmentBooked] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [insuranceProvider, setInsuranceProvider] = useState<string>("");
  const [insuranceFile, setInsuranceFile] = useState<{ name: string } | null>(null);
  
  // Initialize available days with an empty Set
  const initialAvailableDates = new Set<string>();
  const [availableDays, setAvailableDays] = useState<Set<string>>(initialAvailableDates);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const timeStepRef = useRef<HTMLDivElement>(null);
  const typeStepRef = useRef<HTMLDivElement>(null);
  const reasonStepRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const slotsCacheRef = useRef<Record<string, string[]>>({});

  const handleReset = () => {
    setDateString(format(new Date(), 'yyyy-MM-dd'));
    setSelectedTime(null);
    setAppointmentType("IN_PERSON");
    setReason("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      // Check if the day is available
      const dateStr = format(date, 'yyyy-MM-dd');
      if (!availableDays.has(dateStr)) {
        toast.error("This day is not available for appointments.");
        return;
      }
      
      setSelectedDate(date);
      setDateString(format(date, 'yyyy-MM-dd'));
      setTimeout(() => timeStepRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [setDateString, availableDays]);

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
    setTimeout(() => typeStepRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [setSelectedTime]);

  const handleAppointmentTypeChange = useCallback((type: AppointmentType) => {
    setAppointmentType(type);
    setTimeout(() => reasonStepRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [setAppointmentType]);

  // Handle calendar invite generation
  const generateCalendarInvite = useCallback(() => {
    if (!bookedAppointment || !doctor) return;
    
    try {
      // Parse appointment date and time
      const appointmentDate = new Date(bookedAppointment.date);
      const [startHour, startMinute] = bookedAppointment.startTime.split(':').map(Number);
      
      // Set the appointment start time
      appointmentDate.setHours(startHour, startMinute, 0);
      
      // Calculate end time (30 minutes later)
      const endDate = new Date(appointmentDate);
      endDate.setMinutes(endDate.getMinutes() + 30);
      
      // Create a calendar event
      const calendar = ical({
        name: 'Health Appointment',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      // Add the appointment as an event
      calendar.createEvent({
        start: appointmentDate,
        end: endDate,
        summary: `Appointment with Dr. ${doctor.lastName}`,
        description: `${bookedAppointment.appointmentType} appointment${bookedAppointment.reason ? ': ' + bookedAppointment.reason : ''}`,
        location: doctor.location,
        organizer: {
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          email: 'appointments@healthsystem.example'
        }
      });
      
      // Generate and download the .ics file
      const blob = new Blob([calendar.toString()], { type: 'text/calendar;charset=utf-8' });
      saveAs(blob, `appointment-dr-${doctor.lastName.toLowerCase()}-${format(appointmentDate, 'yyyyMMdd')}.ics`);
      
      // Show confirmation toast
      toast.success("Calendar invite downloaded!");
    } catch (error) {
      console.error("Error generating calendar invite:", error);
      toast.error("Could not generate calendar invite");
    }
  }, [bookedAppointment, doctor]);

  // Modified handleBookAppointment function
  const handleBookAppointment = useCallback(async () => {
    if (!doctor || !selectedDate || !selectedTime || !user) {
      toast.error("Please select all appointment details");
      return;
    }
    
    setBookingAppointment(true);
    
    try {
      // Create a Timestamp from the selected date
      const dateObj = new Date(selectedDate);
      const appointmentTimestamp = Timestamp.fromDate(dateObj);
      
      // Calculate end time (30 minutes after start)
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endHour = hours + (minutes + 30 >= 60 ? 1 : 0);
      const endMinute = (minutes + 30) % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Create the appointment data object matching expected interface
      const appointmentData = {
        doctorId: doctor.id,
        patientId: user.id,
        appointmentDate: appointmentTimestamp, // Renamed from 'date' to 'appointmentDate'
        startTime: selectedTime,
        endTime: endTime,
        appointmentType: appointmentType === "IN_PERSON" ? "In-person" : "Video" as "In-person" | "Video",
        status: AppointmentStatus.SCHEDULED,
        reason: reason,
        notes: '',
        fee: doctor.fee || 0
      };
      
      const result = await mockBookAppointment(appointmentData);
      
      if (result.success) {
        // Store the booked appointment data for the success screen
        setBookedAppointment({
          id: result.appointmentId,
          doctorId: doctor.id,
          date: selectedDate,
          startTime: selectedTime,
          endTime: endTime,
          appointmentType: appointmentType === "IN_PERSON" ? "In-person" : "Video",
          reason: reason,
          fee: doctor.fee || 0
        });
        
        // Show success screen instead of redirecting immediately
        setAppointmentBooked(true);
        
        // Save appointment to localStorage for extra persistence
        try {
          const existingAppointments = localStorage.getItem('recent_appointments') ? 
            JSON.parse(localStorage.getItem('recent_appointments') || '[]') : [];
            
          existingAppointments.push({
            id: result.appointmentId,
            doctor: {
              id: doctor.id,
              name: doctor.name,
              specialty: doctor.specialty
            },
            date: selectedDate.toISOString(),
            time: selectedTime,
            type: appointmentType,
            booked: new Date().toISOString()
          });
          
          localStorage.setItem('recent_appointments', JSON.stringify(existingAppointments));
          console.log("Saved appointment to localStorage:", result.appointmentId);
        } catch (err) {
          console.error("Error saving to localStorage:", err);
        }
      } else {
        toast.error("Failed to book appointment");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("An error occurred while booking your appointment");
    } finally {
      setBookingAppointment(false);
    }
  }, [doctor, selectedDate, selectedTime, appointmentType, reason, user]);

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
        console.log(`Attempting to load doctor with ID: ${doctorId}`);
        
        // First check if the doctor exists in the user store
        const users = getUsersStore();
        const doctorUser = users.find(u => u.id === doctorId);
        
        if (!doctorUser) {
          console.warn(`Doctor user not found in users store: ${doctorId}`);
        } else {
          console.log(`Found doctor user in store: ${doctorUser.firstName} ${doctorUser.lastName}`);
        }
        
        // Next try to load the doctor profile
        const data = await loadDoctorProfilePublic(doctorId);
        
        if (data) {
          console.log(`Successfully loaded doctor profile for ID: ${doctorId}`, data);
          
          // Set the proper doctor name using the user data if available
          let doctorName = "Dr. Unknown";
          if (doctorUser && doctorUser.firstName && doctorUser.lastName) {
            doctorName = `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`;
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
          console.warn(`Doctor profile not found for ID: ${doctorId}`);
          
          // No profile found, check if we can use the user data to create a temporary doctor
          if (doctorUser) {
            console.log("Creating temporary doctor from user data");
            
            const doctorName = `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`;
            
            // Create a doctor object with minimal data
            const tempDoctorData: Doctor = {
              id: doctorId,
              userId: doctorId,
              name: doctorName,
              firstName: doctorUser.firstName || '',
              lastName: doctorUser.lastName || '',
              specialty: 'General Practice',
              experience: 5,
              location: 'Main Hospital',
              languages: ['English'],
              fee: 100,
              available: true,
              profilePicUrl: '',
            };
            
            setDoctor(tempDoctorData);
            console.log("Created temporary doctor:", tempDoctorData);
          } else {
            // No user or profile found, handle gracefully
            toast.error("Doctor not found");
            setDoctor(null);
          }
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
      if (!selectedDate || !doctor) {
        console.log("Cannot fetch slots: missing date or doctor", { 
          selectedDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null, 
          doctor: doctor?.id
        });
        return;
      }
      
      // Check cache first
      const cacheKey = `${doctor.userId}-${dateString}`;
      console.log(`Checking cache for slots with key: ${cacheKey}`);
      
      if (slotsCacheRef.current[cacheKey]) {
        console.log(`Using cached slots for ${cacheKey} - found ${slotsCacheRef.current[cacheKey].length} slots`);
        setAvailableSlots(slotsCacheRef.current[cacheKey]);
        return;
      }
      
      setLoadingSlots(true);
      setSelectedTime(null);
      
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        console.log(`Fetching available slots for doctor ${doctor.userId} on ${dateString}`);
        
        // Get the day of week (0-6, where 0 is Sunday)
        const dayOfWeek = selectedDate.getDay();
        console.log(`Selected date ${dateString} is day of week: ${dayOfWeek}`);
        
        // Get doctor's weekly availability slots
        console.log(`Getting availability for doctor: ${doctor.userId}`);
        let doctorAvailability: DoctorAvailabilitySlot[] = [];
        
        try {
          doctorAvailability = getMockDoctorAvailability(doctor.userId);
          console.log(`Retrieved ${doctorAvailability.length} availability slots for doctor`);
        } catch (error) {
          console.error(`Error getting doctor availability: ${error}`);
          // Create fallback availability if function fails
          doctorAvailability = [
            {
              id: `fallback_${doctor.userId}_1`,
              doctorId: doctor.userId,
              dayOfWeek: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
              startTime: '09:00',
              endTime: '17:00',
              isAvailable: true
            }
          ];
          console.log("Using fallback availability:", doctorAvailability);
        }
        
        // Exclude dates blocked by doctor
        const profiles = getDoctorProfilesStore();
        const profile = profiles.find(p => p.userId === doctor.userId) as any;
        const blockedDates: string[] = profile?.mockAvailability?.blockedDates || [];
        if (blockedDates.includes(dateString)) {
          console.log(`Selected date ${dateString} is blocked`);
          setAvailableSlots([]);
          setLoadingSlots(false);
          return;
        }
        
        // Check if doctor is available on this day of week
        const availableDaysForDoctor = doctorAvailability.filter(slot => 
          slot.dayOfWeek === dayOfWeek && slot.isAvailable
        );
        
        console.log(`Doctor has ${availableDaysForDoctor.length} availability entries for this day:`, availableDaysForDoctor);
        
        // If doctor is not available on this day, return empty slots
        if (availableDaysForDoctor.length === 0) {
          console.log(`Doctor ${doctor.userId} not available on day ${dayOfWeek}`);
          setAvailableSlots([]);
          setLoadingSlots(false);
          return;
        }
        
        // If doctor is available on this day, get slots that don't conflict with appointments
        console.log(`Getting available slots for doctor ${doctor.userId} on ${dateString}`);
        let slots: string[] = [];
        
        try {
          slots = await mockGetAvailableSlots({ 
            doctorId: doctor.userId, 
            dateString 
          });
          console.log(`Retrieved ${slots.length} available slots from API`);
        } catch (error) {
          console.error(`Error getting available slots: ${error}`);
          // Create fallback slots if API fails
          const hours = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
          slots = hours;
          console.log("Using fallback slots:", slots);
        }
        
        // Filter slots based on doctor's availability hours for this day
        console.log("Filtering slots based on doctor's availability windows");
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
        
        // Additional filtering to remove past time slots for today
        if (isSameDay(selectedDate, new Date())) {
          const currentHour = new Date().getHours();
          const currentMinute = new Date().getMinutes();
          
          // Filter out time slots that have already passed
          const filteredForToday = filteredSlots.filter(timeSlot => {
            const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
            return (slotHour > currentHour) || 
                   (slotHour === currentHour && slotMinute > currentMinute + 30); // Add 30 min buffer
          });
          
          console.log(`Filtered out past slots for today, remaining: ${filteredForToday.length}`);
          slotsCacheRef.current[cacheKey] = filteredForToday;
          setAvailableSlots(filteredForToday);
        } else {
          slotsCacheRef.current[cacheKey] = filteredSlots;
          setAvailableSlots(filteredSlots);
        }
      } catch (error) {
        console.error(`Error in fetchAvailableSlots: ${error}`);
        toast.error("Could not load available time slots");
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }
    
    fetchAvailableSlots();
  }, [dateString, doctor, selectedDate]);

  const goBack = useCallback(() => {
    router.push('/main/find-doctors');
  }, [router]);

  // Add effect to load available days when doctor changes or month changes
  useEffect(() => {
    if (doctor) {
      const days = fetchAvailableDaysForMonth(doctor, currentMonth);
      setAvailableDays(days);
    }
  }, [doctor, currentMonth]);

  // Add handler for month change
  const handleMonthChange = (month: Date) => {
    console.log(`Month changed to ${month.toLocaleDateString()}`);
    setCurrentMonth(month);
    
    // Fetch available days for the new month
    setLoadingCalendar(true);
    const days = fetchAvailableDaysForMonth(doctor, month);
    setAvailableDays(days);
    setLoadingCalendar(false);
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

  // If doctor not found, try to create a fallback doctor from the ID
  if (!doctor) {
    console.log("No doctor data found, attempting to create fallback doctor");
    
    // Extract information from doctor ID if possible
    let doctorNumber = "Unknown";
    const match = doctorId.match(/doctor_(\d+)/);
    if (match) {
      doctorNumber = match[1];
    }
    
    // Create a fallback doctor object
    const fallbackDoctor: Doctor = {
      id: doctorId,
      userId: doctorId,
      name: `Dr. Doctor ${doctorNumber}`,
      firstName: "",
      lastName: "",
      specialty: "General Practice",
      experience: 5,
      location: "Main Hospital",
      languages: ["English"],
      fee: 100,
      available: true,
      profilePicUrl: ""
    };
    
    console.log("Using fallback doctor:", fallbackDoctor);
    
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
            <ApiModeIndicator />
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  We're having trouble loading this doctor's information. You can:
                </p>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                  <li>Try again later</li>
                  <li>Browse our <button onClick={goBack} className="text-yellow-800 underline">other doctors</button></li>
                  <li>Or continue with limited information about this doctor</li>
                </ul>
                <div className="mt-4">
                  <Button 
                    variant="primary" 
                    onClick={() => setDoctor(fallbackDoctor)}
                    label="Continue with Limited Info" 
                    pageName="BookAppointmentPage"
                  >
                    Continue with Limited Info
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <DebugInfo doctorId={doctorId} />
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Show success screen if appointment was booked */}
      {appointmentBooked && bookedAppointment && doctor && (
        <AppointmentSuccessScreen 
          appointment={bookedAppointment}
          doctor={doctor}
          onViewAppointments={() => router.push('/main/appointments')}
          onAddToCalendar={generateCalendarInvite}
        />
      )}
      
      {/* Add debug component at the top */}
      <DebugInfo doctorId={doctorId} />
      
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
              <Button variant="secondary" size="sm" onClick={handleReset} label="Reset" pageName="BookAppointmentPage">Reset</Button>
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
                  <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-8">Schedule Your Appointment</h3>
                  
                  {/* Step 1: Select Date */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 tracking-wide">1. Select a Date</h4>
                    <div className="flex justify-center">
                      <DoctorAvailabilityCalendar 
                        doctor={doctor}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        disablePastDates={true}
                      />
                    </div>
                  </div>
                  
                  {/* Step 2: Select Time */}
                  {selectedDate && (
                    <div ref={timeStepRef} className="mb-8">
                      <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                        <CalendarIcon className="w-5 h-5 mr-2 text-blue-500" />
                        2. Select a Time Slot for {format(selectedDate, 'MMMM d, yyyy')}
                      </h4>
                      
                      {doctor && doctor.specialty === "Neurology" && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
                          Dr. {doctor.lastName} typically offers 30-minute consultations for neurological assessments.
                        </p>
                      )}
                      
                      {loadingSlots ? (
                        <div className="flex justify-center py-6">
                          <div className="text-center">
                            <Spinner size="md" />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading available time slots...</p>
                          </div>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <CalendarIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-2" />
                            <span className="font-medium text-yellow-700 dark:text-yellow-300">No available slots</span>
                          </div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            Dr. {doctor?.lastName || 'The doctor'} doesn't have any available appointments on this date. 
                            Please select another date to view availability.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Group slots by time of day */}
                          {['morning', 'afternoon', 'evening'].map(timeOfDay => {
                            const slots = availableSlots.filter(time => getTimeCategory(time) === timeOfDay);
                            if (slots.length === 0) return null;
                            
                            return (
                              <div key={timeOfDay} className="space-y-2">
                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize flex items-center">
                                  {timeOfDay === 'morning' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                                    </svg>
                                  )}
                                  {timeOfDay === 'afternoon' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                                    </svg>
                                  )}
                                  {timeOfDay === 'evening' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                  )}
                                  {timeOfDay} ({slots.length} slots)
                                </h5>
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                                  {slots.map((time, idx) => {
                                    const [hour, minute] = time.split(':').map(Number);
                                    const slotDate = new Date(selectedDate);
                                    slotDate.setHours(hour, minute, 0, 0);
                                    const isPast = slotDate < new Date();
                                    return (
                                      <TimeSlotTooltip
                                        key={`${time}-${idx}`}
                                        time={time}
                                        onClick={() => handleTimeSelect(time)}
                                        isSelected={selectedTime === time}
                                        isDisabled={isPast}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Show helpful message about availability */}
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Appointment slots are 30 minutes. Need more time? Contact the doctor's office directly.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Step 3: Appointment Type */}
                  {selectedTime && (
                    <div ref={typeStepRef} className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                        <VideoCameraIcon className="w-5 h-5 mr-2 text-blue-500" />
                        3. Appointment Type
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => handleAppointmentTypeChange("IN_PERSON")}
                          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-lg border transition-all ${
                            appointmentType === "IN_PERSON"
                              ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 text-blue-700 shadow-sm dark:from-blue-900/30 dark:to-blue-800/40 dark:border-blue-700 dark:text-blue-300'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-750'
                          }`}
                        >
                          <div className={`rounded-full p-2 ${appointmentType === "IN_PERSON" ? 'bg-blue-100 dark:bg-blue-800/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <UserGroupIcon className={`w-6 h-6 ${appointmentType === "IN_PERSON" ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                          </div>
                          <div className="text-left">
                            <span className="font-medium block">In-Person Visit</span>
                            <span className="text-xs opacity-75 block">Visit the doctor's office</span>
                          </div>
                          {appointmentType === "IN_PERSON" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleAppointmentTypeChange("VIDEO")}
                          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-lg border transition-all ${
                            appointmentType === "VIDEO"
                              ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 text-blue-700 shadow-sm dark:from-blue-900/30 dark:to-blue-800/40 dark:border-blue-700 dark:text-blue-300'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-750'
                          }`}
                        >
                          <div className={`rounded-full p-2 ${appointmentType === "VIDEO" ? 'bg-blue-100 dark:bg-blue-800/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <VideoCameraIcon className={`w-6 h-6 ${appointmentType === "VIDEO" ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                          </div>
                          <div className="text-left">
                            <span className="font-medium block">Video Consultation</span>
                            <span className="text-xs opacity-75 block">Meet online via video call</span>
                          </div>
                          {appointmentType === "VIDEO" && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Add info about the appointment types */}
                        <div className="sm:col-span-2 mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                          <p className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {appointmentType === "IN_PERSON" ? (
                              <span>In-person visits are conducted at Dr. {doctor?.lastName || "the doctor's"} office in {doctor?.location || "their location"}. Please arrive 15 minutes before your appointment time.</span>
                            ) : (
                              <span>Video consultations are conducted through our secure platform. You'll receive a link to join 15 minutes before your appointment.</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Step 4: Reason for Visit */}
                  {selectedTime && (
                    <div ref={reasonStepRef} className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        4. Reason for Visit
                      </h4>
                      <div className="space-y-4">
                        <textarea
                          placeholder="Please describe your symptoms or reason for visiting Dr. Ana Souza (Neurology)"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full h-24 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Your information is private and secure. Only Dr. {doctor?.lastName || "the doctor"} and authorized staff will have access.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Appointment Summary & Confirm Button */}
                  {selectedDate && selectedTime && (
                    <div ref={summaryRef} className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg overflow-hidden shadow-sm border border-blue-100 dark:border-blue-800">
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                          <h4 className="font-medium text-lg flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Appointment Summary
                          </h4>
                          <p className="text-sm text-blue-100 mt-1">Please review the details below before confirming</p>
                        </div>
                        <div className="p-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center">
                              <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-3">
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Date</span>
                              <span className="font-medium">{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Not selected'}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center">
                              <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-3">
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Time</span>
                              <span className="font-medium">{selectedTime ?? 'Not selected'}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center">
                              {appointmentType === "IN_PERSON" ? (
                                <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <VideoCameraIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div className="ml-3">
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Type</span>
                              <span className="font-medium">{appointmentType ? (appointmentType === "IN_PERSON" ? "In-Person Visit" : "Video Consultation") : 'Not selected'}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center">
                              <CurrencyDollarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-3">
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Consultation Fee</span>
                              <span className="font-medium">{doctor ? `$${doctor.fee}` : 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-blue-100 dark:border-blue-800">
                          <Button
                            variant="primary"
                            size="lg"
                            className="w-full justify-center py-3"
                            onClick={() => setShowSummaryModal(true)}
                            disabled={bookingAppointment}
                            label="Continue to Confirm Appointment"
                            pageName="BookAppointmentPage"
                          >
                            <span className="flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Continue to Confirm Appointment
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      <Transition appear show={showSummaryModal} as={Fragment}>
        <Dialog as="div" role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => setShowSummaryModal(false)}>
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-50"></div>
            </Transition.Child>
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="relative inline-block w-full max-w-md p-6 my-8 max-h-[80vh] overflow-y-auto text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  Confirm Appointment
                </Dialog.Title>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  aria-label="Close modal"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
                <div className="mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    <span>Date: {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Not selected'}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    <span>Time: {selectedTime ?? 'Not selected'}</span>
                  </div>
                  <div className="flex items-center">
                    {appointmentType === 'IN_PERSON' ? (
                      <UserGroupIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <VideoCameraIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    )}
                    <span>
                      Type: {appointmentType ? (appointmentType === 'IN_PERSON' ? 'In-Person Visit' : 'Video Consultation') : 'Not selected'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    <span>Fee: {doctor ? `$${doctor.fee}` : 'Unknown'}</span>
                  </div>
                  {reason && (
                    <div>
                      <span className="font-semibold">Reason:</span> {reason}
                    </div>
                  )}
                  {appointmentType === 'VIDEO' && notes && (
                    <div>
                      <span className="font-semibold">Notes:</span> {notes}
                    </div>
                  )}
                  {appointmentType === 'IN_PERSON' && insuranceProvider && (
                    <div>
                      <span className="font-semibold">Insurance:</span> {insuranceProvider}
                    </div>
                  )}
                  {appointmentType === 'IN_PERSON' && insuranceFile && (
                    <div>
                      <span className="font-semibold">Card:</span> {insuranceFile.name}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowSummaryModal(false)}
                    label="Cancel"
                    pageName="BookAppointmentPage"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowSummaryModal(false);
                      handleBookAppointment();
                    }}
                    isLoading={bookingAppointment}
                    label="Confirm"
                    pageName="BookAppointmentPage"
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
