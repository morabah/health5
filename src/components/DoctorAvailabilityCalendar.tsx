import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { getDoctorAvailabilityFromFirestore } from '@/data/doctorLoaders';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import type { DoctorAvailabilitySlot } from '@/types/doctor';

interface Doctor {
  id?: string;
  userId: string;
  specialty?: string;
  availability?: DoctorAvailabilitySlot[];
  blockedDates?: string[];
}

interface DoctorAvailabilityCalendarProps {
  doctor: Doctor;
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  disablePastDates?: boolean;
}

/**
 * A component that displays a calendar with days marked based on doctor availability
 */
export function DoctorAvailabilityCalendar({
  doctor,
  selectedDate,
  onDateSelect,
  disablePastDates = true
}: DoctorAvailabilityCalendarProps) {
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set<string>());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Function to fetch available days for a month
  const fetchAvailableDaysForMonth = async (month: Date) => {
    if (!doctor || !doctor.userId) return new Set<string>();
    try {
      // Get first and last day of the month
      const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      // Fetch availability from Firestore
      const { availability, blockedDates } = await getDoctorAvailabilityFromFirestore(doctor.userId);
      const doctorAvailability = availability || [];
      const blockedDatesList = blockedDates || [];
      // Get the days of week where the doctor is available
      const availableDaysOfWeek = doctorAvailability
        .filter((slot: DoctorAvailabilitySlot) => slot.isAvailable)
        .map((slot: DoctorAvailabilitySlot) => slot.dayOfWeek);
      if (availableDaysOfWeek.length === 0) {
        return new Set<string>();
      }
      // Loop through all days in the month
      const availableDays = new Set<string>();
      const today = new Date();
      let currentDay = new Date(firstDay);
      while (currentDay <= lastDay) {
        const dateStr = format(currentDay, 'yyyy-MM-dd');
        if (
          availableDaysOfWeek.includes(currentDay.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6) &&
          (!disablePastDates || currentDay > today) &&
          !blockedDatesList.includes(dateStr)
        ) {
          availableDays.add(dateStr);
        }
        currentDay.setDate(currentDay.getDate() + 1);
      }
      return availableDays;
    } catch (error) {
      console.error('Error fetching available days:', error);
      return new Set<string>();
    }
  };

  // Handler for month change in calendar
  const handleMonthChange = (month: Date) => {
    if (!month) return;
    console.log(`Month changed to ${month.toLocaleDateString()}`);
    setCurrentMonth(month);
    // Fetch available days for the new month
    setLoading(true);
    fetchAvailableDaysForMonth(month)
      .then(days => setAvailableDays(days))
      .catch(error => console.error('Error handling month change:', error))
      .finally(() => setLoading(false));
  };

  // Handler for date selection to check if date is available
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onDateSelect(undefined);
      return;
    }
    try {
      // Format the selected date
      const dateStr = format(date, 'yyyy-MM-dd');
      // Check if the day is available
      if (!availableDays.has(dateStr)) {
        console.log(`Date ${dateStr} is not available`);
        toast.error("This day is not available for appointments");
        return;
      }
      // Call parent's onDateSelect with the valid date
      onDateSelect(date);
    } catch (error) {
      console.error("Error selecting date:", error);
    }
  };

  // Effect to load available days when doctor changes
  useEffect(() => {
    let isMounted = true;
    if (doctor && doctor.userId) {
      setLoading(true);
      fetchAvailableDaysForMonth(currentMonth)
        .then(days => { if (isMounted) setAvailableDays(days); })
        .catch(error => console.error('Error loading availability:', error))
        .finally(() => { if (isMounted) setLoading(false); });
    }
    return () => { isMounted = false; };
  }, [doctor, currentMonth]);

  // Safe check function for modifiers
  const isDateAvailable = (date: Date) => {
    try {
      return availableDays.has(format(date, 'yyyy-MM-dd'));
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="flex justify-center relative">
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-10 flex items-center justify-center">
          <Spinner size="md" />
        </div>
      )}
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        disabled={[
          ...(disablePastDates ? [{ before: new Date() }] : []),
          (date: Date) => !isDateAvailable(date)
        ]}
        modifiers={{
          available: isDateAvailable,
          today: new Date()
        }}
        modifiersClassNames={{
          today: 'ring-2 ring-blue-500 text-blue-700',
          available: 'bg-green-50 text-green-700 font-medium hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/40',
          disabled: 'text-gray-400 dark:text-gray-600 line-through'
        }}
        className="border rounded-lg bg-white dark:bg-gray-800 p-4"
        onMonthChange={handleMonthChange}
        footer={
          <div className="pt-2 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-2">
            <div className="flex items-center justify-center space-x-3 mt-1">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-50 dark:bg-green-900/30 rounded-sm mr-1"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded-sm mr-1"></div>
                <span>Unavailable</span>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}

export default DoctorAvailabilityCalendar;