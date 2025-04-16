/**
 * Provides access to mock data for use in data loaders and tests.
 * @module mockDataService
 */
import {
  mockAppointmentsArray,
  mockDoctorProfiles,
  mockDoctorUser,
  mockDoctorProfileData1,
  mockDoctorProfileData2,
  mockDoctorProfileData3,
  mockDoctorProfileData4,
  mockDoctorProfileData5,
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
    if (!mockDoctorProfiles || !Array.isArray(mockDoctorProfiles)) {
      console.error('[mockDataService] mockDoctorProfiles is not available or not an array', { mockDoctorProfiles });
      
      // Fallback to constructing the array directly from individual mock objects
      const fallbackProfiles = [
        mockDoctorProfileData1,
        mockDoctorProfileData2,
        mockDoctorProfileData3,
        mockDoctorProfileData4,
        mockDoctorProfileData5
      ].filter(Boolean);
      
      console.log(`[mockDataService] Using ${fallbackProfiles.length} fallback profiles`);
      return [...fallbackProfiles];
    }
    
    console.log(`[mockDataService] Returning ${mockDoctorProfiles.length} mock doctor profiles`);
    return [...mockDoctorProfiles];
  } catch (error) {
    console.error('[mockDataService] Error in getMockDoctorProfiles:', error);
    
    // Last resort fallback - return at least one profile if available
    if (mockDoctorProfileData1) {
      return [mockDoctorProfileData1];
    }
    
    return [];
  }
};

/**
 * Returns a mock doctor profile by user ID.
 */
export const getMockDoctorProfile = (id: string): DoctorProfile | undefined => mockDoctorProfiles.find(d => d.userId === id);

/**
 * Placeholder functions for doctor availability and forms
 */
export const getMockDoctorAvailability = () => {
  console.warn('[mockDataService] getMockDoctorAvailability is not fully implemented');
  return [];
};

export const getMockDoctorForms = () => {
  console.warn('[mockDataService] getMockDoctorForms is not fully implemented');
  return [];
};

export const getMockDoctorAppointments = () => {
  console.warn('[mockDataService] getMockDoctorAppointments is not fully implemented');
  return [];
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
