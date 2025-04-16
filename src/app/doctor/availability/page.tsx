"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { mockSetDoctorAvailability } from "@/lib/mockApiService";
import { loadDoctorAvailability } from '@/data/loadDoctorAvailability';
import ApiModeIndicator from "@/components/ui/ApiModeIndicator";
import { format, addDays, parseISO } from "date-fns";
import { DayPicker } from "react-day-picker";
import 'react-day-picker/dist/style.css';
import Link from "next/link";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface WeeklySchedule {
  [key: number]: TimeSlot[]; // 0-6 for Sunday-Saturday
}

export default function DoctorAvailabilityPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    0: [], // Sunday
    1: [], // Monday
    2: [], // Tuesday
    3: [], // Wednesday
    4: [], // Thursday
    5: [], // Friday
    6: [], // Saturday
  });
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  // Time slots from 8AM to 6PM in 30-minute increments
  useEffect(() => {
    const times = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute of ['00', '30']) {
        times.push(`${hour.toString().padStart(2, '0')}:${minute}`);
      }
    }
    setAvailableTimes(times);
  }, []);

  // Load existing availability on component mount
  useEffect(() => {
    async function fetchAvailability() {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      try {
        // For now, we'll populate with sample data - in a real implementation,
        // this would retrieve the doctor's current availability settings
        const items = await loadDoctorAvailability();
        
        // Initialize schedule with sample data
        const schedule: WeeklySchedule = {
          0: [], // Sunday
          1: [{ startTime: '09:00', endTime: '09:30' }, { startTime: '10:00', endTime: '10:30' }], // Monday
          2: [{ startTime: '14:00', endTime: '14:30' }, { startTime: '15:00', endTime: '15:30' }], // Tuesday
          3: [{ startTime: '11:00', endTime: '11:30' }, { startTime: '12:00', endTime: '12:30' }], // Wednesday
          4: [{ startTime: '13:00', endTime: '13:30' }, { startTime: '16:00', endTime: '16:30' }], // Thursday
          5: [{ startTime: '09:00', endTime: '09:30' }, { startTime: '14:00', endTime: '14:30' }], // Friday
          6: [], // Saturday
        };
        
        setWeeklySchedule(schedule);
        
        // Set some sample blocked dates
        const blocked = [
          addDays(new Date(), 2),
          addDays(new Date(), 5),
          addDays(new Date(), 10)
        ];
        setBlockedDates(blocked);
        
      } catch (err) {
        setError('Failed to load availability settings.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAvailability();
  }, [user]);

  const toggleTimeSlot = (day: number, time: string) => {
    console.log('Toggling time slot:', { day, time });
    
    setWeeklySchedule(prevSchedule => {
      const newSchedule = {...prevSchedule};
      
      // Check if this time slot is already selected
      const timeIndex = newSchedule[day].findIndex(
        slot => slot.startTime === time
      );
      
      // Calculate end time (30 minutes later)
      const [hours, minutes] = time.split(':');
      const endTimeMinutes = (parseInt(minutes) + 30) % 60;
      const endTimeHours = parseInt(hours) + (endTimeMinutes === 0 ? 1 : 0);
      const endTime = `${endTimeHours.toString().padStart(2, '0')}:${endTimeMinutes.toString().padStart(2, '0')}`;
      
      if (timeIndex >= 0) {
        // If found, remove it (toggle off)
        console.log('Removing slot', { day, time, index: timeIndex });
        newSchedule[day] = [
          ...newSchedule[day].slice(0, timeIndex),
          ...newSchedule[day].slice(timeIndex + 1)
        ];
      } else {
        // If not found, add it (toggle on)
        console.log('Adding slot', { day, time, endTime });
        newSchedule[day] = [
          ...newSchedule[day],
          { startTime: time, endTime }
        ];
      }
      
      return newSchedule;
    });
  };

  const isTimeSlotSelected = (day: number, time: string): boolean => {
    if (!weeklySchedule || !weeklySchedule[day]) {
      console.warn(`No schedule found for day ${day}`, weeklySchedule);
      return false;
    }
    
    const isSelected = weeklySchedule[day].some(slot => slot.startTime === time);
    return isSelected;
  };

  const handleBlockDate = (dateToToggle: Date) => {
    console.log('Toggling blocked date:', format(dateToToggle, 'yyyy-MM-dd'));
    
    setBlockedDates(prevDates => {
      // Check if this date is already blocked
      const dateIndex = prevDates.findIndex(d => 
        format(d, 'yyyy-MM-dd') === format(dateToToggle, 'yyyy-MM-dd')
      );
      
      if (dateIndex >= 0) {
        // Remove date from blocked dates
        console.log('Removing date from blocked dates');
        return [
          ...prevDates.slice(0, dateIndex),
          ...prevDates.slice(dateIndex + 1)
        ];
      } else {
        // Add date to blocked dates
        console.log('Adding date to blocked dates');
        return [...prevDates, dateToToggle];
      }
    });
  };

  const handleSaveAvailability = async () => {
    if (!user) {
      toast.error('You must be logged in to save availability settings');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      console.log('Saving availability settings:', {
        weeklySchedule,
        blockedDates: blockedDates.map(d => format(d, 'yyyy-MM-dd'))
      });
      
      // Convert weekly schedule to the format expected by the API
      const formattedSlots = Object.entries(weeklySchedule).flatMap(([day, slots]: [string, TimeSlot[]]) => 
        slots.map((slot: TimeSlot, index: number) => ({
          id: `slot_${day}_${index}`,
          doctorId: user.uid,
          dayOfWeek: parseInt(day) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: true,
        }))
      );
      
      // Format blocked dates to strings
      const formattedBlockedDates = blockedDates.map(date => 
        format(date, 'yyyy-MM-dd')
      );
      
      // Save to the API
      const result = await mockSetDoctorAvailability({
        doctorId: user.uid,
        slots: formattedSlots,
        blockedDates: formattedBlockedDates
      });
      
      if (result.success) {
        toast.success('Availability settings saved successfully');
        console.log('Availability saved successfully');
      } else {
        throw new Error('Failed to save availability');
      }
    } catch (err) {
      console.error('Error saving availability:', err);
      toast.error('Failed to save availability settings');
      setError('There was a problem saving your availability settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <main className="bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Availability</h1>
          <div className="flex items-center gap-2">
            <Link href="/doctor/dashboard">
              <Button 
                variant="secondary" 
                label="Back to Dashboard" 
                pageName="DoctorAvailabilityPage"
              >
                Back to Dashboard
              </Button>
            </Link>
            <ApiModeIndicator />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Card className="p-6">
            <div className="text-red-500">{error}</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Weekly Schedule Section */}
            <Card className="md:col-span-8 p-6">
              <h2 className="text-xl font-semibold mb-4">Weekly Schedule</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Set your recurring weekly availability to let patients know when you&apos;re generally available.
                Click on time slots to toggle them as available or unavailable.
              </p>
              
              {/* Weekly Schedule Grid */}
              <div className="mb-6 overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="py-2 px-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Time</th>
                      {[1, 2, 3, 4, 5].map((day) => (
                        <th key={day} className="py-2 px-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          {getDayName(day)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {availableTimes.map(time => (
                      <tr key={time} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {time}
                        </td>
                        {[1, 2, 3, 4, 5].map((day) => (
                          <td key={day} className="py-2 px-3 text-center">
                            <button
                              onClick={() => toggleTimeSlot(day, time)}
                              className={`w-full py-1 px-2 text-sm rounded-md transition-colors ${
                                isTimeSlotSelected(day, time)
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                              }`}
                              aria-label={`Toggle ${time} on ${getDayName(day)}`}
                            >
                              {isTimeSlotSelected(day, time) ? 'Available' : 'Unavailable'}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            
            {/* Blocked Dates Section */}
            <Card className="md:col-span-4 p-6">
              <h2 className="text-xl font-semibold mb-4">Block Specific Dates</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Select dates when you&apos;re unavailable regardless of your weekly schedule.
              </p>
              
              <div className="mb-4">
                <DayPicker
                  mode="multiple"
                  selected={blockedDates}
                  onSelect={setBlockedDates}
                  className="mx-auto"
                  required
                />
              </div>
              
              {blockedDates.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Blocked Dates:</h3>
                  <div className="flex flex-wrap gap-2">
                    {blockedDates.map((date, index) => (
                      <div key={index} className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 py-1 px-3 rounded-full text-sm flex items-center">
                        {format(date, 'MMM d, yyyy')}
                        <button 
                          onClick={() => handleBlockDate(date)}
                          className="ml-2 text-red-500 hover:text-red-700"
                          aria-label={`Remove blocked date ${format(date, 'MMM d, yyyy')}`}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
            
            {/* Save Button */}
            <div className="md:col-span-12 flex justify-end">
              <Button
                variant="primary"
                onClick={handleSaveAvailability}
                disabled={saving}
                isLoading={saving}
                label="Save Availability Settings"
                pageName="DoctorAvailabilityPage"
              >
                Save Availability Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
