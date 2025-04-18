"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { mockSetDoctorAvailability } from "@/lib/mockApiService";
import { getMockDoctorAvailability } from '@/data/mockDataService';
import ApiModeIndicator from "@/components/ui/ApiModeIndicator";
import { format, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import 'react-day-picker/dist/style.css';
import Link from "next/link";
import { Disclosure } from "@headlessui/react";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface WeeklySchedule {
  [key: number]: TimeSlot[]; // 0-6 for Sunday-Saturday
}

interface AvailabilitySlot {
  id?: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
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
  const [dataChanged, setDataChanged] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragModeRef = useRef<'add'|'remove'|null>(null);
  const [lastSaved, setLastSaved] = useState<string|null>(null);
  // Undo refs, filter state & insights
  const prevScheduleRef = useRef<WeeklySchedule>(weeklySchedule);
  const prevBlockedRef = useRef<Date[]>(blockedDates);
  const [showWeekends, setShowWeekends] = useState(true);
  // Insights & timezone
  const daysToRender = showWeekends ? [0,1,2,3,4,5,6] : [1,2,3,4,5];
  const currentDay = new Date().getDay();
  const totalSlots = Object.values(weeklySchedule).flat().length;
  const totalHours = (totalSlots * 0.5).toFixed(1);
  const weekendSlots = (weeklySchedule[0]?.length || 0) + (weeklySchedule[6]?.length || 0);

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
        // Get current doctor's availability settings
        let availabilityData = await getMockDoctorAvailability(user.uid);
        
        // Fallback: Try to load directly from localStorage if no data was returned
        if (!availabilityData || !Array.isArray(availabilityData) || availabilityData.length === 0) {
          console.log('No availability data returned from API, trying localStorage directly');
          
          try {
            const STORAGE_KEY = 'health_app_data_doctor_profiles';
            const storedProfilesStr = localStorage.getItem(STORAGE_KEY);
            
            if (storedProfilesStr) {
              const storedProfiles = JSON.parse(storedProfilesStr);
              const profile = storedProfiles.find((p: any) => p.userId === user.uid);
              
              if (profile && profile.mockAvailability && profile.mockAvailability.slots) {
                console.log('Found availability data in localStorage:', profile.mockAvailability.slots.length, 'slots');
                availabilityData = profile.mockAvailability.slots;
              }
            }
          } catch (localStorageErr) {
            console.error('Error reading from localStorage:', localStorageErr);
          }
        }
        
        // Initialize schedule based on doctor's availability
        const schedule: WeeklySchedule = {
          0: [], // Sunday
          1: [], // Monday
          2: [], // Tuesday
          3: [], // Wednesday
          4: [], // Thursday
          5: [], // Friday
          6: [], // Saturday
        };
        
        // Process availability data
        if (availabilityData && Array.isArray(availabilityData) && availabilityData.length > 0) {
          console.log(`Found ${availabilityData.length} availability slots for doctor ${user.uid}`);
          
          // It's an array of slots
          availabilityData.forEach((slot: AvailabilitySlot) => {
            if (slot.dayOfWeek >= 0 && slot.dayOfWeek <= 6 && slot.isAvailable) {
              schedule[slot.dayOfWeek].push({
                startTime: slot.startTime,
                endTime: slot.endTime
              });
            }
          });
          
          setWeeklySchedule(schedule);
          
          // Check for blocked dates in localStorage
          try {
            const STORAGE_KEY = 'health_app_data_doctor_profiles';
            const storedProfilesStr = localStorage.getItem(STORAGE_KEY);
            
            if (storedProfilesStr) {
              const storedProfiles = JSON.parse(storedProfilesStr);
              const profile = storedProfiles.find((p: any) => p.userId === user.uid);
              
              if (profile && profile.mockAvailability && profile.mockAvailability.blockedDates) {
                const blockDates = profile.mockAvailability.blockedDates
                  .map((dateStr: string) => new Date(dateStr));
                
                if (blockDates.length > 0) {
                  console.log(`Found ${blockDates.length} blocked dates in localStorage`);
                  setBlockedDates(blockDates);
                }
              }
            }
          } catch (err) {
            console.error('Error loading blocked dates:', err);
          }
        } else {
          // Set default schedule if no availability data
          const defaultSchedule: WeeklySchedule = {
            0: [], // Sunday
            1: [{ startTime: '09:00', endTime: '09:30' }, { startTime: '10:00', endTime: '10:30' }], // Monday
            2: [{ startTime: '14:00', endTime: '14:30' }, { startTime: '15:00', endTime: '15:30' }], // Tuesday
            3: [{ startTime: '11:00', endTime: '11:30' }, { startTime: '12:00', endTime: '12:30' }], // Wednesday
            4: [{ startTime: '13:00', endTime: '13:30' }, { startTime: '16:00', endTime: '16:30' }], // Thursday
            5: [{ startTime: '09:00', endTime: '09:30' }, { startTime: '14:00', endTime: '14:30' }], // Friday
            6: [], // Saturday
          };
          
          setWeeklySchedule(defaultSchedule);
        }
        setDataChanged(false); // Reset the change tracker after loading
        
      } catch (err) {
        console.error('Error loading availability data:', err);
        setError('Failed to load availability settings. Please try again.');
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
      
      setDataChanged(true); // Mark data as changed
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
      
      let newDates;
      if (dateIndex >= 0) {
        // Remove date from blocked dates
        console.log('Removing date from blocked dates');
        newDates = [
          ...prevDates.slice(0, dateIndex),
          ...prevDates.slice(dateIndex + 1)
        ];
      } else {
        // Add date to blocked dates
        console.log('Adding date to blocked dates');
        newDates = [...prevDates, dateToToggle];
      }
      
      setDataChanged(true); // Mark data as changed
      return newDates;
    });
  };

  // Function to add a preset schedule (e.g., 9-5 for weekdays)
  const applyPresetSchedule = (preset: string) => {
    let newSchedule = {...weeklySchedule};
    
    if (preset === 'weekdays-9-5') {
      // Create 9-5 schedule for Monday-Friday
      [1, 2, 3, 4, 5].forEach(day => {
        const daySlots = [];
        for (let hour = 9; hour < 17; hour++) {
          for (let minute of ['00', '30']) {
            const startTime = `${hour.toString().padStart(2, '0')}:${minute}`;
            const endTimeMinutes = (parseInt(minute) + 30) % 60;
            const endTimeHours = hour + (endTimeMinutes === 0 ? 1 : 0);
            const endTime = `${endTimeHours.toString().padStart(2, '0')}:${endTimeMinutes.toString().padStart(2, '0')}`;
            daySlots.push({ startTime, endTime });
          }
        }
        newSchedule[day] = daySlots;
      });
      
      // Clear weekend slots
      newSchedule[0] = [];
      newSchedule[6] = [];
    } else if (preset === 'clear-all') {
      // Clear all slots
      for (let day = 0; day <= 6; day++) {
        newSchedule[day] = [];
      }
    } else if (preset === 'morning-only') {
      [0,1,2,3,4,5,6].forEach(day => {
        const slots = availableTimes
          .filter(t => Number(t.split(':')[0]) >= 8 && Number(t.split(':')[0]) < 12)
          .map(time => { const [h,m] = time.split(':'); const dt=new Date(); dt.setHours(+h); dt.setMinutes(+m+30); return { startTime: time, endTime: format(dt,'HH:mm') }; });
        newSchedule[day] = slots;
      });
    } else if (preset === 'afternoon-only') {
      [0,1,2,3,4,5,6].forEach(day => {
        const slots = availableTimes
          .filter(t => Number(t.split(':')[0]) >= 12 && Number(t.split(':')[0]) < 18)
          .map(time => { const [h,m] = time.split(':'); const dt=new Date(); dt.setHours(+h); dt.setMinutes(+m+30); return { startTime: time, endTime: format(dt,'HH:mm') }; });
        newSchedule[day] = slots;
      });
    } else if (preset === 'weekends-only') {
      [0,6].forEach(day => {
        const slots = availableTimes.map(time => { const [h,m] = time.split(':'); const dt=new Date(); dt.setHours(+h); dt.setMinutes(+m+30); return { startTime: time, endTime: format(dt,'HH:mm') }; });
        newSchedule[day] = slots;
      });
      [1,2,3,4,5].forEach(day => { newSchedule[day] = []; });
    }
    
    setWeeklySchedule(newSchedule);
    setDataChanged(true);
    toast.success(`Applied ${preset.replace('-', ' ')}`);
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
        // Force direct localStorage update as a fallback in case the mockSetDoctorAvailability
        // is not persisting properly to localStorage
        try {
          const STORAGE_KEY = 'health_app_data_doctor_profiles';
          const storedProfilesStr = localStorage.getItem(STORAGE_KEY);
          
          if (storedProfilesStr) {
            const storedProfiles = JSON.parse(storedProfilesStr);
            const profileIndex = storedProfiles.findIndex((p: any) => p.userId === user.uid);
            
            if (profileIndex !== -1) {
              // Update the profile with availability data
              storedProfiles[profileIndex] = {
                ...storedProfiles[profileIndex],
                mockAvailability: {
                  slots: formattedSlots,
                  blockedDates: formattedBlockedDates
                },
                updatedAt: new Date()
              };
              
              // Save back to localStorage
              localStorage.setItem(STORAGE_KEY, JSON.stringify(storedProfiles));
              console.log('Direct localStorage update successful');
            } else {
              console.warn('Doctor profile not found in localStorage');
            }
          }
        } catch (localStorageErr) {
          console.error('Error with direct localStorage update:', localStorageErr);
        }
        
        toast.success('Availability settings saved successfully');
        console.log('Availability saved successfully');
        setDataChanged(false); // Reset the change tracker after saving
        setLastSaved(format(new Date(), 'yyyy-MM-dd HH:mm'));
        prevScheduleRef.current = weeklySchedule;
        prevBlockedRef.current = blockedDates;
        // auto-dismiss undo after 10s
        setTimeout(() => setLastSaved(null), 10000);
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

  // Drag handlers
  const handleSlotMouseDown = (day: number, time: string) => {
    const selected = isTimeSlotSelected(day, time);
    dragModeRef.current = selected ? 'remove' : 'add';
    setDragging(true);
    if ((dragModeRef.current === 'add' && !selected) || (dragModeRef.current === 'remove' && selected)) {
      toggleTimeSlot(day, time);
    }
  };
  const handleSlotMouseEnter = (day: number, time: string) => {
    if (!dragging) return;
    const selected = isTimeSlotSelected(day, time);
    if ((dragModeRef.current === 'add' && !selected) || (dragModeRef.current === 'remove' && selected)) {
      toggleTimeSlot(day, time);
    }
  };
  useEffect(() => {
    const onUp = () => setDragging(false);
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  // Bulk per-day controls
  const selectAllDay = (day: number) => {
    setWeeklySchedule(prev => {
      const slots = availableTimes.map(time => {
        const [h, m] = time.split(':').map(Number);
        const dt = new Date(); dt.setHours(h); dt.setMinutes(m + 30);
        return { startTime: time, endTime: format(dt, 'HH:mm') };
      });
      return { ...prev, [day]: slots };
    });
    setDataChanged(true);
  };
  const clearAllDay = (day: number) => {
    setWeeklySchedule(prev => ({ ...prev, [day]: [] }));
    setDataChanged(true);
  };

  // Persist draft to localStorage
  useEffect(() => {
    if (!user) return;
    const key = `doctor_avail_draft_${user.uid}`;
    localStorage.setItem(key, JSON.stringify({
      weeklySchedule,
      blockedDates: blockedDates.map(d => d.toISOString())
    }));
  }, [weeklySchedule, blockedDates, user]);

  // Load draft on mount
  useEffect(() => {
    if (!user) return;
    const key = `doctor_avail_draft_${user.uid}`;
    const d = localStorage.getItem(key);
    if (d) {
      try {
        const { weeklySchedule: ws, blockedDates: bd } = JSON.parse(d);
        setWeeklySchedule(ws);
        setBlockedDates(bd.map((s: string) => new Date(s)));
        setDataChanged(true);
      } catch {}
    }
  }, [user]);

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
            {/* Presets Section */}
            <Card className="md:col-span-12 p-6 mb-4">
              <h2 className="text-xl font-semibold mb-4">Quick Settings</h2>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => applyPresetSchedule('weekdays-9-5')} 
                  label="Apply 9-5 Weekday Schedule"
                  pageName="DoctorAvailabilityPage"
                >
                  Apply 9-5 Weekday Schedule
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => applyPresetSchedule('clear-all')} 
                  label="Clear All Slots"
                  pageName="DoctorAvailabilityPage"
                >
                  Clear All Slots
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => applyPresetSchedule('morning-only')} 
                  label="Morning Only"
                  pageName="DoctorAvailabilityPage"
                >
                  Morning Only
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => applyPresetSchedule('afternoon-only')} 
                  label="Afternoon Only"
                  pageName="DoctorAvailabilityPage"
                >
                  Afternoon Only
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => applyPresetSchedule('weekends-only')} 
                  label="Weekends Only"
                  pageName="DoctorAvailabilityPage"
                >
                  Weekends Only
                </Button>
                <label className="flex items-center gap-1 ml-4">
                  <input type="checkbox" checked={showWeekends} onChange={() => setShowWeekends(!showWeekends)} className="h-4 w-4" />
                  <span>Show Weekends</span>
                </label>
              </div>
            </Card>
            
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
                      {daysToRender.map((day) => (
                        <th key={day} className={`py-2 px-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 ${day === currentDay ? 'bg-yellow-200 dark:bg-yellow-700' : ''}`}>
                          <div className="flex flex-col items-center">
                            <span>{getDayName(day)}</span>
                            <div className="mt-1 flex gap-1">
                              <button onClick={() => selectAllDay(day)} className="text-xs text-blue-600">All</button>
                              <button onClick={() => clearAllDay(day)} className="text-xs text-red-600">None</button>
                            </div>
                          </div>
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
                        {daysToRender.map((day) => (
                          <td key={day} className="py-2 px-3 text-center">
                            <button
                              onMouseDown={() => handleSlotMouseDown(day, time)}
                              onMouseEnter={() => handleSlotMouseEnter(day, time)}
                              onClick={(e) => e.preventDefault()}
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
                Click on a date to block or unblock it.
              </p>
              
              <div className="mb-4">
                <DayPicker
                  mode="multiple"
                  selected={blockedDates}
                  onSelect={(dates) => {
                    if (dates) {
                      setBlockedDates(dates);
                      setDataChanged(true);
                    }
                  }}
                  className="mx-auto"
                  fromDate={new Date()} // Only allow selecting current or future dates
                />
              </div>
              
              {blockedDates.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Blocked Dates:</h3>
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
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
            
            {/* Mobile accordion view */}
            <div className="md:hidden mt-6">
              {Object.keys(weeklySchedule).map(day => (
                <Disclosure key={day}>
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="w-full text-left py-2 px-4 bg-gray-100 dark:bg-gray-800 mb-1">
                        {getDayName(Number(day))}
                      </Disclosure.Button>
                      <Disclosure.Panel className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded mb-4">
                        {availableTimes.map(time => (
                          <button
                            key={time}
                            onClick={() => toggleTimeSlot(Number(day), time)}
                            className={`py-1 px-2 text-sm rounded ${isTimeSlotSelected(Number(day), time) ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                            aria-label={`${getDayName(Number(day))} ${time}`}
                          >
                            {time}
                          </button>
                        ))}
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              ))}
            </div>
            
            {/* Save Button */}
            <div className="md:col-span-12 flex justify-end">
              {dataChanged && (
                <div role="status" aria-live="polite" className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 p-2 rounded mb-4 text-center">
                  You have unsaved changes
                </div>
              )}
              <Button
                variant="primary"
                onClick={handleSaveAvailability}
                disabled={saving || !dataChanged}
                isLoading={saving}
                label="Save Availability Settings"
                pageName="DoctorAvailabilityPage"
              >
                {dataChanged ? 'Save Changes' : 'No Changes to Save'}
              </Button>
              {lastSaved && (
                <div role="status" aria-live="polite" className="mt-2 flex items-center gap-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last saved: {lastSaved}</p>
                  <button onClick={() => {
                    setWeeklySchedule(prevScheduleRef.current);
                    setBlockedDates(prevBlockedRef.current);
                    setDataChanged(true);
                    setLastSaved(null);
                  }} className="text-sm text-blue-600">Undo</button>
                </div>
              )}
            </div>
            
            {/* Insights Panel */}
            <Card className="md:col-span-12 p-6 mb-4">
              <h2 className="text-lg font-medium mb-2">Insights</h2>
              <p>Total availability: {totalHours} hrs/week</p>
              {weekendSlots === 0 && <p className="text-yellow-600 dark:text-yellow-300">You have no weekend availability</p>}
            </Card>
            
            {/* Timezone Display */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
          </div>
        )}
      </div>
    </main>
  );
}
