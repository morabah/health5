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
import { format, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import 'react-day-picker/dist/style.css';

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
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday by default
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
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
        setTimeSlots(schedule[selectedDay] || []);
        
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

  // Update time slots when selected day changes
  useEffect(() => {
    setTimeSlots(weeklySchedule[selectedDay] || []);
  }, [selectedDay, weeklySchedule]);

  const handleDaySelection = (day: number) => {
    setSelectedDay(day);
  };

  const handleAddTimeSlot = (startTime: string) => {
    // Calculate end time (30 min after start time)
    const [hours, minutes] = startTime.split(':').map(Number);
    let endHour = hours;
    let endMinute = minutes + 30;
    
    if (endMinute >= 60) {
      endHour += 1;
      endMinute -= 60;
    }
    
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    // Add new time slot
    const newSlot = { startTime, endTime };
    const updatedSlots = [...timeSlots, newSlot];
    
    // Update the time slots for the selected day
    setTimeSlots(updatedSlots);
    
    // Update the weekly schedule
    setWeeklySchedule(prev => ({
      ...prev,
      [selectedDay]: updatedSlots
    }));
  };

  const handleRemoveTimeSlot = (index: number) => {
    const updatedSlots = timeSlots.filter((_, i) => i !== index);
    
    // Update the time slots for the selected day
    setTimeSlots(updatedSlots);
    
    // Update the weekly schedule
    setWeeklySchedule(prev => ({
      ...prev,
      [selectedDay]: updatedSlots
    }));
  };

  const handleBlockDate = (date: Date) => {
    // Toggle date selection
    const isAlreadyBlocked = blockedDates.some(
      blockedDate => blockedDate.toDateString() === date.toDateString()
    );
    
    if (isAlreadyBlocked) {
      setBlockedDates(blockedDates.filter(
        blockedDate => blockedDate.toDateString() !== date.toDateString()
      ));
    } else {
      setBlockedDates([...blockedDates, date]);
    }
  };

  const handleSaveAvailability = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Convert weekly schedule to the format expected by the API
      const formattedSlots = Object.entries(weeklySchedule).flatMap(([day, slots]: [string, TimeSlot[]]) => 
        slots.map((slot: TimeSlot, index: number) => ({
          id: `slot_${day}_${index}`,
          doctorId: user.uid,
          dayOfWeek: parseInt(day),
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
      await mockSetDoctorAvailability({
        doctorId: user.uid,
        slots: formattedSlots,
        blockedDates: formattedBlockedDates
      });
      
      toast.success('Availability settings saved successfully');
    } catch (err) {
      console.error('Error saving availability:', err);
      toast.error('Failed to save availability settings');
    } finally {
      setSaving(false);
    }
  };

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  // Determine if a time slot is already selected for the current day
  const isTimeSlotSelected = (time: string): boolean => {
    return timeSlots.some(slot => slot.startTime === time);
  };

  return (
    <main className="bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Availability</h1>
          <ApiModeIndicator />
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Weekly Schedule Section */}
            <Card className="md:col-span-8 p-6">
              <h2 className="text-xl font-semibold mb-4">Weekly Schedule</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Set your recurring weekly availability to let patients know when you're generally available.
              </p>
              
              {/* Day selector tabs */}
              <div className="flex flex-wrap border-b border-gray-200 mb-4">
                {[1, 2, 3, 4, 5].map((day) => (
                  <button
                    key={day}
                    onClick={() => handleDaySelection(day)}
                    className={`py-2 px-4 text-sm font-medium ${
                      selectedDay === day
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {getDayName(day)}
                  </button>
                ))}
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Available Time Slots for {getDayName(selectedDay)}</h3>
                
                {timeSlots.length === 0 ? (
                  <p className="text-gray-500 italic mb-4">No time slots set for this day.</p>
                ) : (
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {timeSlots.map((slot, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded"
                      >
                        <span>{slot.startTime} - {slot.endTime}</span>
                        <button 
                          onClick={() => handleRemoveTimeSlot(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <h3 className="font-medium mt-4 mb-2">Add New Time Slot</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mb-4">
                  {availableTimes.map(time => (
                    <button
                      key={time}
                      onClick={() => handleAddTimeSlot(time)}
                      disabled={isTimeSlotSelected(time)}
                      className={`py-1 px-2 text-sm rounded-md ${
                        isTimeSlotSelected(time)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
            
            {/* Blocked Dates Section */}
            <Card className="md:col-span-4 p-6">
              <h2 className="text-xl font-semibold mb-4">Block Specific Dates</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Select dates when you're unavailable regardless of your weekly schedule.
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
