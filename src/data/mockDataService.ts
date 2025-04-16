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
  mockPatientProfileData3,
  mockPatientProfileData4,
  mockPatientProfileData5,
  mockDoctorForms,
  mockDoctorAvailability,
  mockDoctorAppointments
} from '@/types/mockData';
import type { Appointment } from '@/types/appointment';
import type { DoctorProfile } from '@/types/doctor';

/**
 * Returns a copy of the mock appointments array.
 */
export const getMockAppointments = (): Appointment[] => [...mockAppointmentsArray];

/**
 * Returns a copy of the mock doctor profiles array.
 */
export const getMockDoctorProfiles = (): DoctorProfile[] => [...mockDoctorProfiles];

/**
 * Returns a mock doctor profile by user ID.
 */
export const getMockDoctorProfile = (id: string): DoctorProfile | undefined => mockDoctorProfiles.find(d => d.userId === id);

// Additional mock data accessors as needed
export const getMockDoctorUser = () => ({ ...mockDoctorUser });
export const getMockDoctorProfileData1 = () => ({ ...mockDoctorProfileData1 });
export const getMockDoctorProfileData2 = () => ({ ...mockDoctorProfileData2 });
export const getMockDoctorProfileData3 = () => ({ ...mockDoctorProfileData3 });
export const getMockDoctorProfileData4 = () => ({ ...mockDoctorProfileData4 });
export const getMockDoctorProfileData5 = () => ({ ...mockDoctorProfileData5 });
export const getMockPatientUser = () => ({ ...mockPatientUser });
export const getMockPatientProfileData1 = () => ({ ...mockPatientProfileData1 });
export const getMockPatientProfileData2 = () => ({ ...mockPatientProfileData2 });
export const getMockPatientProfileData3 = () => ({ ...mockPatientProfileData3 });
export const getMockPatientProfileData4 = () => ({ ...mockPatientProfileData4 });
export const getMockPatientProfileData5 = () => ({ ...mockPatientProfileData5 });
export const getMockDoctorForms = () => [...mockDoctorForms];
export const getMockDoctorAvailability = () => [...mockDoctorAvailability];
export const getMockDoctorAppointments = () => [...mockDoctorAppointments];
