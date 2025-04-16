import { UserType } from "@/types/enums";
import { mockPatientUser, mockDoctorUser, mockAdminUser, mockPatientProfileData1, mockDoctorProfileData1, mockDoctorProfileData2, mockDoctorProfileData3, mockDoctorProfileData4, mockDoctorProfileData5, mockAppointmentsArray } from "@/types/mockData";
import type { UserProfile } from "@/types/user";
import type { DoctorProfile } from "@/types/doctor";
import type { PatientProfile } from "@/types/patient";
import type { Appointment } from "@/types/appointment";
import type { Notification } from "@/types/notification";

// Import the actual store variables, not just the accessors
import {
  usersStore,
  doctorProfilesStore,
  patientProfilesStore,
  appointmentsStore,
  notificationsStore
} from "@/data/mockDataStore";

/**
 * Resets and seeds all mock data stores for a given user role.
 * Ensures user, appointments, and notifications are present for the logged-in user.
 * @param role - The user role to seed for ('patient', 'doctor', 'admin')
 */
export function resetMockDataStoresForUser(role: UserType | 'patient' | 'doctor' | 'admin') {
  // Defensive: ensure stores exist
  if (!usersStore || !doctorProfilesStore || !patientProfilesStore || !appointmentsStore || !notificationsStore) {
    throw new Error("Mock data stores are not properly initialized.");
  }

  // Check if we have stored profile data to preserve
  let storedProfile: any = null;
  let storedUser: any = null;
  
  if (typeof window !== 'undefined') {
    try {
      const profileData = localStorage.getItem('auth_profile');
      const userData = localStorage.getItem('auth_user');
      
      if (profileData && userData) {
        storedProfile = JSON.parse(profileData);
        storedUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error("Error loading stored profile data:", error);
    }
  }

  // Create base users for the stores
  let basePatientUser = { ...mockPatientUser };
  let baseDoctorUser = { ...mockDoctorUser };
  let baseAdminUser = { ...mockAdminUser };
  
  // If we have a stored profile and it matches the current role, use it instead
  if (storedProfile && storedUser && storedUser.userType === role) {
    if (role === 'patient' && storedUser.uid === mockPatientUser.id) {
      basePatientUser = {
        ...mockPatientUser,
        ...storedProfile
      };
    } else if (role === 'doctor' && storedUser.uid === mockDoctorUser.id) {
      baseDoctorUser = {
        ...mockDoctorUser,
        ...storedProfile
      };
    } else if (role === 'admin' && storedUser.uid === mockAdminUser.id) {
      baseAdminUser = {
        ...mockAdminUser,
        ...storedProfile
      };
    }
  }

  // Clear all stores IN-PLACE using .splice to preserve references
  usersStore.splice(0, usersStore.length, basePatientUser, baseDoctorUser, baseAdminUser);
  
  // Update the appropriate profile stores
  if (role === 'patient') {
    // If we have a stored patient profile, update the patientProfileData1
    const updatedPatientProfile = { 
      ...mockPatientProfileData1
    };
    
    // If stored profile exists and is for the current user, merge the changes
    if (storedProfile && storedUser && storedUser.uid === mockPatientUser.id) {
      // Using type assertion to avoid linter errors
      const patientStoredProfile = storedProfile as any;
      
      Object.assign(updatedPatientProfile, {
        userId: mockPatientUser.id,
        dateOfBirth: patientStoredProfile.dateOfBirth || mockPatientProfileData1.dateOfBirth,
        gender: patientStoredProfile.gender || mockPatientProfileData1.gender,
        bloodType: patientStoredProfile.bloodType || mockPatientProfileData1.bloodType,
        medicalHistory: patientStoredProfile.medicalHistory || mockPatientProfileData1.medicalHistory
      });
    }
    
    patientProfilesStore.splice(0, patientProfilesStore.length, updatedPatientProfile);
    
  } else if (role === 'doctor') {
    // If we have a stored doctor profile, update the doctorProfileData1
    const updatedDoctorProfile = { 
      ...mockDoctorProfileData1
    };
    
    // If stored profile exists and is for the current user, merge the changes
    if (storedProfile && storedUser && storedUser.uid === mockDoctorUser.id) {
      // Using type assertion to avoid linter errors
      const doctorStoredProfile = storedProfile as any;
      
      // Preserve any fields that were updated in the profile
      if (doctorStoredProfile.firstName && doctorStoredProfile.lastName) {
        updatedDoctorProfile.specialty = doctorStoredProfile.specialty || mockDoctorProfileData1.specialty;
        updatedDoctorProfile.bio = doctorStoredProfile.bio || mockDoctorProfileData1.bio;
        updatedDoctorProfile.location = doctorStoredProfile.location || mockDoctorProfileData1.location;
      }
    }
    
    doctorProfilesStore.splice(0, doctorProfilesStore.length,
      updatedDoctorProfile, mockDoctorProfileData2, mockDoctorProfileData3, mockDoctorProfileData4, mockDoctorProfileData5);
  } else {
    // For admin or other roles, use the default profile data
    doctorProfilesStore.splice(0, doctorProfilesStore.length,
      mockDoctorProfileData1, mockDoctorProfileData2, mockDoctorProfileData3, mockDoctorProfileData4, mockDoctorProfileData5);
    patientProfilesStore.splice(0, patientProfilesStore.length, mockPatientProfileData1);
  }
  
  appointmentsStore.splice(0, appointmentsStore.length);
  notificationsStore.splice(0, notificationsStore.length);

  if (role === 'patient') {
    appointmentsStore.push(...mockAppointmentsArray.filter(a => a.patientId === mockPatientUser.id || a.doctorId === mockDoctorUser.id));
  } else if (role === 'doctor') {
    appointmentsStore.push(...mockAppointmentsArray.filter(a => a.doctorId === mockDoctorUser.id || a.patientId === mockPatientUser.id));
  } else if (role === 'admin') {
    appointmentsStore.push(...mockAppointmentsArray);
  }
}
