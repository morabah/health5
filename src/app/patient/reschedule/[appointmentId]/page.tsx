'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Appointment } from '@/types/appointments';
import { mockGetAppointmentById, mockUpdateAppointment } from '@/lib/mockApiService';
import { getAvailableSlots } from '@/data/mockDataService';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import 'react-day-picker/dist/style.css';

const ReschedulePage = () => {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const result = await mockGetAppointmentById(appointmentId);
        setAppointment(result);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching appointment:', error);
        toast.error('Failed to load appointment details');
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  useEffect(() => {
    if (selectedDate && appointment?.doctorId) {
      // Get available slots for the selected date and doctor
      const slots = getAvailableSlots(appointment.doctorId, selectedDate);
      setAvailableSlots(slots);
      setSelectedSlot(null); // Reset selected slot when date changes
    }
  }, [selectedDate, appointment?.doctorId]);

  const handleReschedule = async () => {
    if (!appointment || !selectedDate || !selectedSlot) {
      toast.error('Please select a date and time slot');
      return;
    }

    setSubmitting(true);
    try {
      // Create the new appointment date by combining selectedDate with the time from selectedSlot
      const [hours, minutes] = selectedSlot.split(':').map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);

      // Update the appointment with the new date
      await mockUpdateAppointment({
        ...appointment,
        date: newDate,
        lastUpdated: new Date()
      });

      toast.success('Appointment rescheduled successfully');
      router.push('/patient/appointments');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast.error('Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Appointment Not Found</h1>
        <p>The appointment you're trying to reschedule could not be found.</p>
        <Button 
          variant="primary" 
          onClick={() => router.push('/patient/appointments')}
          className="mt-4"
        >
          Back to Appointments
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reschedule Appointment</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current Appointment Details</h2>
        <p><span className="font-medium">Doctor:</span> {appointment.doctorName}</p>
        <p><span className="font-medium">Date/Time:</span> {format(new Date(appointment.date), 'PPPP')} at {format(new Date(appointment.date), 'h:mm a')}</p>
        <p><span className="font-medium">Reason:</span> {appointment.reason}</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Select New Date</h2>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={[
              { before: new Date() },
              { dayOfWeek: [0, 6] } // Disable weekends
            ]}
            className="mx-auto"
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Select New Time</h2>
          
          {!selectedDate ? (
            <p className="text-gray-500">Please select a date first</p>
          ) : availableSlots.length === 0 ? (
            <p className="text-gray-500">No available slots for this date</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2 rounded text-center ${
                    selectedSlot === slot
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end mt-8 space-x-4">
        <Button
          variant="secondary"
          onClick={() => router.push('/patient/appointments')}
          label="Cancel"
          pageName="ReschedulePage"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleReschedule}
          disabled={!selectedDate || !selectedSlot || submitting}
          isLoading={submitting}
          label="Confirm Reschedule"
          pageName="ReschedulePage"
        >
          Confirm Reschedule
        </Button>
      </div>
    </div>
  );
};

export default ReschedulePage; 