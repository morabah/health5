/**
 * Provides access to mock data for use in data loaders and tests.
 * @module mockDataService
 */
import {
  mockAppointmentsArray,
  mockDoctorUser,
  mockPatientUser,
  mockPatientProfileData1,
  mockPatientProfileData2,
  mockPatientProfileData3
} from '@/types/mockData';
import type { Appointment } from '@/types/appointment';
import type { DoctorProfile } from '@/types/doctor';
import type { UserProfile } from '@/types/user';
import type { PatientProfile } from '@/types/patient';

/**
 * Returns a copy of the mock appointments array.
 */
export const getMockAppointments = (): Appointment[] => [...mockAppointmentsArray];

/**
 * Returns a copy of the mock doctor profiles array.
 */
export const getMockDoctorProfiles = (): DoctorProfile[] => {
  try {
    return [];
  } catch (error) {
    console.error('[mockDataService] Error in getMockDoctorProfiles:', error);
    return [];
  }
};

/**
 * Returns a mock doctor profile by user ID.
 */
export const getMockDoctorProfile = (id: string): DoctorProfile | undefined => undefined;

/**
 * Placeholder functions for doctor availability and forms
 */
export const getMockDoctorAvailability = (doctorId?: string) => {
  console.log('[mockDataService] Getting mock doctor availability', { doctorId });
  
  // Import the getDoctorProfilesStore function to get the latest data from store
  const { getDoctorProfilesStore } = require('@/data/mockDataStore');
  
  // Default slots to return if no doctor-specific data is found
  const defaultSlots: any[] = [];
  
  // If a specific doctorId is provided, check if custom availability exists
  if (doctorId) {
    try {
      // Get all doctor profiles from the store to ensure we have the latest data
      const doctorProfiles = getDoctorProfilesStore();
      
      // Find the specific doctor profile
      const doctorProfile = doctorProfiles.find((p: DoctorProfile) => p.userId === doctorId);
      
      if (doctorProfile && (doctorProfile as any).mockAvailability) {
        const mockAvailability = (doctorProfile as any).mockAvailability;
        if (mockAvailability.slots && Array.isArray(mockAvailability.slots) && mockAvailability.slots.length > 0) {
          console.log(`[mockDataService] Found custom availability for doctor ${doctorId} with ${mockAvailability.slots.length} slots`);
          return mockAvailability.slots;
        }
      }
      
      // If no custom data, return default slots filtered for this doctor
      console.log(`[mockDataService] No custom availability found for doctor ${doctorId}, using defaults`);
      return defaultSlots.filter(slot => slot.doctorId === doctorId);
    } catch (error) {
      console.error(`[mockDataService] Error getting availability for doctor ${doctorId}:`, error);
      return defaultSlots.filter(slot => slot.doctorId === doctorId);
    }
  }
  
  // Otherwise, return all default slots
  return defaultSlots;
};

export const getMockDoctorForms = () => {
  console.log('[mockDataService] Getting mock doctor forms');
  return [];
};

export const getMockDoctorAppointments = (doctorId?: string) => {
  console.log('[mockDataService] Getting mock doctor appointments', { doctorId });
  
  try {
    // Get all appointments
    const allAppointments = getMockAppointments();
    
    // If a specific doctorId is provided, filter appointments for that doctor
    if (doctorId) {
      return allAppointments.filter(appointment => appointment.doctorId === doctorId);
    }
    
    // Otherwise, return all appointments
    return allAppointments;
  } catch (error) {
    console.error('[mockDataService] Error in getMockDoctorAppointments:', error);
    return [];
  }
};

/**
 * Returns mock patient user data
 */
export const getMockPatientUser = (): UserProfile => {
  console.log('[mockDataService] Returning mockPatientUser');
  return { ...mockPatientUser };
};

/**
 * Returns a mock doctor user data
 */
export const getMockDoctorUser = (): UserProfile => {
  return { ...mockDoctorUser };
};

// Patient profile accessors
export const getMockPatientProfileData1 = (): PatientProfile => ({ ...mockPatientProfileData1 });
export const getMockPatientProfileData2 = (): PatientProfile => ({ ...mockPatientProfileData2 });
export const getMockPatientProfileData3 = (): PatientProfile => ({ ...mockPatientProfileData3 });

/**
 * Gets available time slots for a specific doctor on a given date
 * @param doctorId The doctor's ID
 * @param date The date to check for availability
 * @returns Array of available time slots in format "HH:MM"
 */
export const getAvailableSlots = (doctorId: string, date: Date): string[] => {
  console.log(`Getting available slots for doctor ${doctorId} on ${date}`);
  
  // Generate slots between 9 AM and 5 PM at 30-minute intervals
  const slots: string[] = [];
  const appointmentDuration = 30; // minutes
  
  // Start at 9:00 AM
  const startHour = 9;
  const endHour = 17; // 5:00 PM
  
  // Get existing appointments for this doctor on this date to exclude those times
  const existingAppointments = getMockDoctorAppointments(doctorId).filter(appt => {
    const apptDate = appt.appointmentDate instanceof Date 
      ? appt.appointmentDate 
      : appt.appointmentDate.toDate();
      
    return apptDate.getDate() === date.getDate() &&
           apptDate.getMonth() === date.getMonth() &&
           apptDate.getFullYear() === date.getFullYear();
  });
  
  // Map existing appointments to their time slots
  const bookedSlots = existingAppointments.map(appt => appt.startTime);
  
  // Generate all possible slots
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += appointmentDuration) {
      const timeSlot = `${hour}:${minute.toString().padStart(2, '0')}`;
      // Add the slot if it's not already booked
      if (!bookedSlots.includes(timeSlot)) {
        slots.push(timeSlot);
      }
    }
  }
  
  return slots;
};
