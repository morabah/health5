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

  // Clear all stores IN-PLACE using .splice to preserve references
  usersStore.splice(0, usersStore.length, mockPatientUser, mockDoctorUser, mockAdminUser);
  doctorProfilesStore.splice(0, doctorProfilesStore.length,
    mockDoctorProfileData1, mockDoctorProfileData2, mockDoctorProfileData3, mockDoctorProfileData4, mockDoctorProfileData5);
  patientProfilesStore.splice(0, patientProfilesStore.length, mockPatientProfileData1);
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
