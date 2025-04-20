"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AppointmentTimeline from './timeline';
import { 
  CalendarIcon, 
  ClockIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import ApiModeIndicator from '@/components/ui/ApiModeIndicator';
import Link from 'next/link';
import { Appointment } from '@/types/appointment';
import { mockGetMyAppointments } from '@/lib/mockApiService';
import { UserType } from '@/types/enums';

// Simple EmptyState component
const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  action: React.ReactNode;
}) => (
  <div className="text-center py-12">
    <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
    {action}
  </div>
);

// Simple AppointmentsFilter component
const AppointmentsFilter = ({ 
  filter, 
  onFilterChange 
}: { 
  filter: string; 
  onFilterChange: (filter: string) => void;
}) => (
  <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
    <button 
      className={`py-3 px-4 text-sm font-medium ${
        filter === 'all' 
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
      onClick={() => onFilterChange('all')}
    >
      All
    </button>
    <button 
      className={`py-3 px-4 text-sm font-medium ${
        filter === 'upcoming' 
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
      onClick={() => onFilterChange('upcoming')}
    >
      Upcoming
    </button>
    <button 
      className={`py-3 px-4 text-sm font-medium ${
        filter === 'past' 
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
      onClick={() => onFilterChange('past')}
    >
      Past
    </button>
  </div>
);

// Simple AppointmentsList component
const AppointmentsList = ({ 
  appointments, 
  loading 
}: { 
  appointments: Appointment[]; 
  loading: boolean;
}) => {
  if (loading) {
    return <div className="text-center py-6">Loading appointments...</div>;
  }
  
  if (appointments.length === 0) {
    return <div className="text-center py-6">No appointments found</div>;
  }
  
  return (
    <div className="space-y-4">
      {appointments.map(appointment => (
        <div key={appointment.id} className="p-4 border rounded-lg shadow-sm">
          <div className="font-medium">{appointment.doctorName || 'Unknown Doctor'}</div>
          <div className="text-sm text-gray-500">
            {appointment.startTime && new Date(appointment.startTime).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function AppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [hasDrAnaAppointment, setHasDrAnaAppointment] = useState(false);
  const [hasDrJaneLeeAppointment, setHasDrJaneLeeAppointment] = useState(false);
  const [hasDrDavidNguyenAppointment, setHasDrDavidNguyenAppointment] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Check localStorage for Dr. Ana Souza appointments
  useEffect(() => {
    try {
      const storedAppointments = localStorage.getItem('recent_appointments');
      if (storedAppointments) {
        const parsedAppointments = JSON.parse(storedAppointments);
        const anaAppointment = parsedAppointments.find(
          (appt: any) => appt.doctor && appt.doctor.id === 'user_doctor_005'
        );
        setHasDrAnaAppointment(!!anaAppointment);
        
        const janeLeeAppointment = parsedAppointments.find(
          (appt: any) => appt.doctor && appt.doctor.id === 'user_doctor_002'
        );
        setHasDrJaneLeeAppointment(!!janeLeeAppointment);
        
        const davidNguyenAppointment = parsedAppointments.find(
          (appt: any) => appt.doctor && appt.doctor.id === 'user_doctor_001'
        );
        setHasDrDavidNguyenAppointment(!!davidNguyenAppointment);
      }
    } catch (err) {
      console.error("Error checking for doctor appointments:", err);
    }
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch from API
        const apiAppointments = await mockGetMyAppointments(user.id, UserType.PATIENT);
        
        // Also check localStorage for any appointments created during the booking flow
        // In a real app, these would be persisted to the backend
        const localAppointments = localStorage.getItem('appointments');
        let parsedLocalAppointments: Appointment[] = [];
        
        if (localAppointments) {
          try {
            parsedLocalAppointments = JSON.parse(localAppointments);
          } catch (e) {
            console.error('Error parsing local appointments', e);
          }
        }
        
        // Combine API and local appointments
        const allAppointments = [...apiAppointments, ...parsedLocalAppointments];
        
        // Check if user has an appointment with Dr. Ana Souza
        const hasAnaSouza = allAppointments.some(appointment => 
          appointment.doctorId === 'user_doctor_005' && 
          appointment.appointmentDate && 
          (typeof appointment.appointmentDate === 'string' || appointment.appointmentDate instanceof Date
            ? new Date(appointment.appointmentDate) > new Date()
            : appointment.appointmentDate.toDate() > new Date())
        );
        
        // Check if user has an appointment with Dr. Jane Lee
        const hasJaneLee = allAppointments.some(appointment => 
          appointment.doctorId === 'user_doctor_002' && 
          appointment.appointmentDate && 
          (typeof appointment.appointmentDate === 'string' || appointment.appointmentDate instanceof Date
            ? new Date(appointment.appointmentDate) > new Date()
            : appointment.appointmentDate.toDate() > new Date())
        );
        
        // Check if user has an appointment with Dr. David Nguyen
        const hasDavidNguyen = allAppointments.some(appointment => 
          appointment.doctorId === 'user_doctor_001' && 
          appointment.appointmentDate && 
          (typeof appointment.appointmentDate === 'string' || appointment.appointmentDate instanceof Date
            ? new Date(appointment.appointmentDate) > new Date()
            : appointment.appointmentDate.toDate() > new Date())
        );
        
        setHasDrAnaAppointment(hasAnaSouza);
        setHasDrJaneLeeAppointment(hasJaneLee);
        setHasDrDavidNguyenAppointment(hasDavidNguyen);
        setAppointments(allAppointments);
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
        setError('Failed to load appointments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user]);
  
  const filteredAppointments = filter === 'all'
    ? appointments
    : appointments.filter(appointment => {
        const now = new Date();
        // Handle different date types safely
        if (!appointment.appointmentDate) return false;
        
        let appointmentDate: Date;
        if (typeof appointment.appointmentDate === 'string') {
          appointmentDate = new Date(appointment.appointmentDate);
        } else if (appointment.appointmentDate instanceof Date) {
          appointmentDate = appointment.appointmentDate;
        } else {
          // Assume it's a Timestamp with toDate method
          appointmentDate = appointment.appointmentDate.toDate();
        }
        
        return filter === 'upcoming' 
          ? appointmentDate > now 
          : appointmentDate <= now;
      });
  
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };
  
  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />}
          title="Error Loading Appointments"
          description={error}
          action={
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
              label="Try Again"
              pageName="Appointments"
            >
              Try Again
            </Button>
          }
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Appointments</h1>
            <p className="text-gray-600 dark:text-gray-400">View and manage your upcoming and past appointments</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button 
              variant="primary"
              label="Book New Appointment"
              pageName="AppointmentsPage"
              onClick={() => router.push('/main/find-doctors')}
              className="flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-1.5" />
              Book New Appointment
            </Button>
            <ApiModeIndicator />
          </div>
        </div>

        {/* Display special banner for users with Dr. Ana Souza appointments */}
        {hasDrAnaAppointment && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-blue-800 dark:text-blue-300">Appointment with Dr. Ana Souza</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  You have an upcoming appointment with Dr. Ana Souza. Make sure to complete any pre-appointment questionnaires and arrive 15 minutes early.
                </p>
                <div className="mt-3">
                  <Link 
                    href="/main/appointments/questionnaire/neuro" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Complete Pre-Visit Questionnaire
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display special banner for users with Dr. Jane Lee appointments */}
        {hasDrJaneLeeAppointment && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-green-800 dark:text-green-300">Appointment with Dr. Jane Lee</h3>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  You have an upcoming appointment with Dr. Jane Lee. Please complete the dermatology questionnaire to help Dr. Lee better understand your skin concerns.
                </p>
                <div className="mt-3">
                  <Link 
                    href="/main/appointments/questionnaire/dermatology" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Complete Dermatology Questionnaire
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display special banner for users with Dr. David Nguyen appointments */}
        {hasDrDavidNguyenAppointment && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-purple-800 dark:text-purple-300">Appointment with Dr. David Nguyen</h3>
                <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                  You have an upcoming appointment with Dr. David Nguyen. Please complete the general health questionnaire which will help with your primary care visit.
                </p>
                <div className="mt-3">
                  <Link 
                    href="/main/appointments/questionnaire/general" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Complete General Health Questionnaire
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointments timeline component */}
        <AppointmentTimeline />

        <AppointmentsFilter filter={filter} onFilterChange={handleFilterChange} />
        
        {filteredAppointments.length > 0 ? (
          <>
            <AppointmentsList appointments={filteredAppointments} loading={loading} />
            
            <div className="mt-10 mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Appointment Timeline</h2>
              <AppointmentTimeline />
            </div>
          </>
        ) : (
          <EmptyState
            icon={<CalendarIcon className="h-12 w-12 text-gray-400" />}
            title={`No ${filter} appointments`}
            description={
              filter === 'all'
                ? "You don't have any appointments yet."
                : filter === 'upcoming'
                ? "You don't have any upcoming appointments."
                : "You don't have any past appointments."
            }
            action={
              <Link href="/main/doctors">
                <Button 
                  variant="primary" 
                  label="Book Appointment"
                  pageName="Appointments"
                >
                  Book Appointment
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
} 