import React, { useState, useEffect } from 'react';
import { format, isAfter, isBefore, isToday, addDays } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClipboardIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { AppointmentStatus } from '@/types/enums';
import type { Appointment } from '@/types/appointment';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeFirebaseClient } from '@/lib/improvedFirebaseClient';
import { AppointmentSchema } from '@/lib/zodSchemas';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

// Helper function to convert Timestamp objects to Date
const toDate = (dateObj: any): Date => {
  if (dateObj && typeof dateObj === 'object' && 'toDate' in dateObj) {
    return dateObj.toDate();
  }
  return new Date(dateObj);
};

export const AppointmentTimeline = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    async function fetchAppointments() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        initializeFirebaseClient('live');
        const functions = getFunctions();
        const getMyAppointments = httpsCallable(functions, 'getMyAppointments');
        const res = await getMyAppointments({ statusFilter: selectedFilter });
        if (!res.data || !Array.isArray(res.data)) throw new Error('Malformed response from backend');
        const items = res.data.map((item: any, idx: number) => ({
          ...AppointmentSchema.parse(item),
          id: item.id ?? item.appointmentId ?? `appt-${idx}`,
          appointmentDate: item.appointmentDate ?? new Date(),
          status: (typeof item.status === 'string' ? AppointmentStatus[item.status as keyof typeof AppointmentStatus] : item.status) ?? AppointmentStatus.PENDING,
          createdAt: item.createdAt ?? new Date(),
          updatedAt: item.updatedAt ?? new Date(),
        }));
        setAppointments(items);
      } catch (err: any) {
        console.error('[AppointmentTimeline] Error:', err);
        setError('Failed to load appointments.');
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, [user, selectedFilter]);

  // Filter appointments based on selected filter
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = appointment.appointmentDate ? toDate(appointment.appointmentDate) : null;
    const today = new Date();
    
    if (selectedFilter === 'upcoming') {
      return appointmentDate && (isAfter(appointmentDate, today) || isToday(appointmentDate));
    } else if (selectedFilter === 'past') {
      return appointmentDate && (isBefore(appointmentDate, today) && !isToday(appointmentDate));
    }
    
    return true; // 'all' filter
  });

  // Function to get status color and icon
  const getStatusInfo = (appointment: Appointment) => {
    const appointmentDate = appointment.appointmentDate ? toDate(appointment.appointmentDate) : null;
    const today = new Date();
    const isUpcoming = appointmentDate && (isAfter(appointmentDate, today) || isToday(appointmentDate));
    
    switch (appointment.status) {
      case AppointmentStatus.SCHEDULED:
        return {
          color: isUpcoming ? 'text-blue-500' : 'text-gray-500',
          bgColor: isUpcoming ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-800',
          borderColor: isUpcoming ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700',
          icon: isUpcoming ? ClockIcon : ClipboardIcon,
          statusText: isUpcoming ? 'Upcoming' : 'Missed'
        };
      case AppointmentStatus.COMPLETED:
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: CheckCircleIcon,
          statusText: 'Completed'
        };
      case AppointmentStatus.CANCELLED:
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: XCircleIcon,
          statusText: 'Cancelled'
        };
      case AppointmentStatus.PENDING:
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: ExclamationCircleIcon,
          statusText: 'Pending Confirmation'
        };
      case AppointmentStatus.RESCHEDULED:
        return {
          color: 'text-purple-500',
          bgColor: 'bg-purple-100 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          icon: ArrowPathIcon,
          statusText: 'Rescheduled'
        };
      default:
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          borderColor: 'border-gray-200 dark:border-gray-700',
          icon: CalendarIcon,
          statusText: 'Unknown'
        };
    }
  };

  // Function to handle clicking on an appointment
  const handleAppointmentClick = (appointmentId: string) => {
    router.push(`/main/appointments/${appointmentId}`);
  };

  // Function to get the relative time text
  const getRelativeTimeText = (date: Date) => {
    const today = new Date();
    
    if (isToday(date)) {
      return 'Today';
    } else if (isToday(addDays(date, -1))) {
      return 'Yesterday';
    } else if (isToday(addDays(date, 1))) {
      return 'Tomorrow';
    } else if (isBefore(date, today)) {
      const diffTime = Math.abs(today.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days ago`;
    } else {
      const diffTime = Math.abs(date.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `In ${diffDays} days`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading appointments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <h3 className="text-red-800 dark:text-red-400 font-medium">Error loading appointments</h3>
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
        <CalendarIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-gray-800 dark:text-gray-200 font-medium text-lg mb-1">No appointments found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have any appointments yet.</p>
        <Button 
          variant="primary" 
          size="md"
          label="Book an Appointment"
          pageName="AppointmentsTimeline"
          onClick={() => router.push('/main/find-doctors')}
        >
          Book an Appointment
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Filter tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button 
          className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
            selectedFilter === 'all' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setSelectedFilter('all')}
        >
          All Appointments
        </button>
        <button 
          className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
            selectedFilter === 'upcoming' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setSelectedFilter('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
            selectedFilter === 'past' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setSelectedFilter('past')}
        >
          Past
        </button>
      </div>

      {/* Timeline */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredAppointments.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">No {selectedFilter} appointments found.</p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => {
            const appointmentDate = appointment.appointmentDate ? toDate(appointment.appointmentDate) : null;
            const isDateValid = appointmentDate && !isNaN(appointmentDate.getTime());
            const statusInfo = getStatusInfo(appointment);
            const StatusIcon = statusInfo.icon;
            
            // Determine the appropriate time format based on user preferences
            // For this example, we'll use 12-hour format
            const timeFormat = (timeString: string) => {
              if (!timeString) return 'Not specified';
              const [hour, minute] = timeString.split(':').map(Number);
              const isPM = hour >= 12;
              const displayHour = hour % 12 || 12;
              return `${displayHour}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
            };
            
            // Safe way to get doctor's name
            const doctorName = appointment.doctorName || (() => {
              return 'Unknown Doctor';
            })();
            
            return (
              <div 
                key={appointment.id}
                className={`p-4 flex cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors`}
                onClick={() => appointment.id && handleAppointmentClick(appointment.id)}
              >
                {/* Left: Timeline indicator */}
                <div className="flex flex-col items-center mr-6">
                  <div className={`w-10 h-10 rounded-full ${statusInfo.bgColor} flex items-center justify-center`}>
                    <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                  </div>
                  <div className="flex-grow border-l border-gray-300 dark:border-gray-700 mx-auto mt-1"></div>
                </div>
                
                {/* Right: Appointment details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {doctorName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {appointment.doctorSpecialty || 'Doctor'}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                      {statusInfo.statusText}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {isDateValid ? format(appointmentDate, 'MMM d, yyyy') : 'Unknown Date'}
                      </span>
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                        ({isDateValid ? getRelativeTimeText(appointmentDate) : 'Unknown'})
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {timeFormat(appointment.startTime || '')}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {appointment.appointmentType}
                      </span>
                    </div>
                  </div>
                  
                  {appointment.reason && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      <span className="font-medium">Reason:</span> {appointment.reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AppointmentTimeline; 