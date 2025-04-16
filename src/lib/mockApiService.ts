/**
 * Simulates backend API calls by operating on in-memory mock data stores.
 * Use for all mock CRUD and query operations in dev/test mode.
 */
import { logInfo } from "@/lib/logger";
import type { UserProfile } from "@/types/user";
import type { DoctorProfile } from "@/types/doctor";
import type { PatientProfile } from "@/types/patient";
import type { Appointment } from "@/types/appointment";
import type { Notification } from "@/types/notification";
import { getUsersStore, getDoctorProfilesStore, getPatientProfilesStore, getAppointmentsStore, getNotificationsStore } from "@/data/mockDataStore";
import { UserType, VerificationStatus, AppointmentStatus } from "@/types/enums";
import { v4 as uuidv4 } from "uuid";
import { Timestamp } from "firebase/firestore";
import { getDateObject } from "@/utils/dateUtils";

// Mutable stores (for direct mutation)
import * as dataStore from "@/data/mockDataStore";

/** Simulates a random network delay (100-300ms) */
function simulateDelay() {
  return new Promise(res => setTimeout(res, 100 + Math.random() * 200));
}

/**
 * Registers a new user (patient/doctor). Checks for email conflict, creates user/profile, adds to stores.
 * @throws Error('already-exists') if email taken.
 */
export async function mockRegisterUser(data: Partial<UserProfile> & { userType: UserType }): Promise<{ success: boolean; userId: string }> {
  logInfo("[mockApiService] mockRegisterUser", { data });
  await simulateDelay();
  const { email, userType } = data;
  if (!email) throw new Error("missing-email");
  const existing = dataStore.getUsersStore().find(u => u.email === email);
  if (existing) throw new Error("already-exists");
  const id = uuidv4();
  const now = Timestamp.now();
  const user: UserProfile = {
    id,
    email,
    phone: data.phone || null,
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    userType,
    isActive: true,
    emailVerified: false,
    phoneVerified: false,
    createdAt: now,
    updatedAt: now,
  };
  // Mutate usersStore
  (dataStore as any).usersStore.push(user);
  if (userType === UserType.PATIENT) {
    (dataStore as any).patientProfilesStore.push({ userId: id, dateOfBirth: null, gender: null, bloodType: null, medicalHistory: null });
  } else if (userType === UserType.DOCTOR) {
    (dataStore as any).doctorProfilesStore.push({
      userId: id,
      specialty: (data as any).specialty || "General",
      licenseNumber: (data as any).licenseNumber || "",
      yearsOfExperience: 0,
      education: "",
      bio: "",
      verificationStatus: VerificationStatus.PENDING,
      location: "",
      languages: [],
      consultationFee: 0,
      profilePictureUrl: null,
      licenseDocumentUrl: null,
      certificateUrl: null,
      createdAt: now,
      updatedAt: now,
    });
  }
  logInfo("[mockApiService] Registered user", { user });
  return { success: true, userId: id };
}

/**
 * Simulates mock sign-in by email (ignores password). Returns user and profile or throws.
 * @throws Error('invalid-credential') if not found.
 */
export async function mockSignIn(email: string, password: string): Promise<{ user: { uid: string; email: string }; userProfile: UserProfile }> {
  logInfo("[mockApiService] mockSignIn", { email });
  await simulateDelay();
  const user = dataStore.getUsersStore().find(u => u.email === email);
  if (!user) throw new Error("invalid-credential");
  return { user: { uid: user.id, email: user.email! }, userProfile: user };
}

/**
 * Gets the current user's UserProfile and Patient/Doctor profile.
 */
export async function mockGetMyUserProfileData(userId: string): Promise<{ user: UserProfile | null; profile: PatientProfile | DoctorProfile | null }> {
  logInfo("[mockApiService] mockGetMyUserProfileData", { userId });
  await simulateDelay();
  const user = dataStore.getUsersStore().find(u => u.id === userId) || null;
  if (!user) return { user: null, profile: null };
  let profile: PatientProfile | DoctorProfile | null = null;
  if (user.userType === UserType.PATIENT) {
    profile = dataStore.getPatientProfilesStore().find(p => p.userId === userId) || null;
  } else if (user.userType === UserType.DOCTOR) {
    profile = dataStore.getDoctorProfilesStore().find(d => d.userId === userId) || null;
  }
  return { user, profile };
}

/**
 * Gets appointments for a user, with optional filters.
 */
export async function mockGetMyAppointments(userId: string, userType: UserType, statusFilter?: AppointmentStatus[], dateFilter?: Date): Promise<Appointment[]> {
  logInfo("[mockApiService] mockGetMyAppointments", { userId, userType, statusFilter, dateFilter });
  await simulateDelay();
  let appts = dataStore.getAppointmentsStore().filter(a =>
    (userType === UserType.PATIENT ? a.patientId === userId : a.doctorId === userId)
  );
  if (statusFilter) appts = appts.filter(a => statusFilter.includes(a.status));
  if (dateFilter) {
    appts = appts.filter(a => {
      if (a.appointmentDate instanceof Date) {
        return a.appointmentDate.toDateString() === dateFilter.toDateString();
      } else if (typeof a.appointmentDate.toDate === 'function') {
        return a.appointmentDate.toDate().toDateString() === dateFilter.toDateString();
      }
      return false;
    });
  }
  return appts;
}

/**
 * Cancels an appointment if user is patient and owns it. Updates status, adds reason.
 */
export async function mockCancelAppointment({ appointmentId, reason, userId }: { appointmentId: string; reason: string; userId: string }): Promise<{ success: boolean }> {
  logInfo("[mockApiService] mockCancelAppointment", { appointmentId, reason, userId });
  await simulateDelay();
  const appt = (dataStore as any).appointmentsStore.find((a: any) => a.id === appointmentId);
  if (!appt) throw new Error("not-found");
  if (appt.patientId !== userId) throw new Error("permission-denied");
  appt.status = AppointmentStatus.CANCELLED; // Fix: Use AppointmentStatus enum for appointment logic
  appt.notes = reason;
  appt.updatedAt = Timestamp.now();
  return { success: true };
}

/**
 * Sets doctor availability (slots/blockedDates) for a doctor.
 */
export async function mockSetDoctorAvailability({ doctorId, slots, blockedDates }: { doctorId: string; slots: any[]; blockedDates: string[] }): Promise<{ success: boolean }> {
  logInfo("[mockApiService] mockSetDoctorAvailability", { doctorId, slots, blockedDates });
  await simulateDelay();
  // For demo, attach to doctor profile as .mockAvailability
  const doctor = (dataStore as any).doctorProfilesStore.find((d: any) => d.userId === doctorId);
  if (!doctor) throw new Error("not-found");
  doctor.mockAvailability = { slots, blockedDates };
  return { success: true };
}

/**
 * Finds doctors by specialty/location. Only VERIFIED doctors returned.
 */
export async function mockFindDoctors({ specialty, location }: { specialty?: string; location?: string }): Promise<DoctorProfile[]> {
  logInfo("[mockApiService] mockFindDoctors", { specialty, location });
  await simulateDelay();
  let docs = dataStore.getDoctorProfilesStore().filter(d => d.verificationStatus === VerificationStatus.VERIFIED); // Fix: Use correct VerificationStatus enum values
  if (specialty) docs = docs.filter(d => d.specialty === specialty);
  if (location) docs = docs.filter(d => d.location === location);
  return docs;
}

/**
 * Gets a doctor's public profile.
 */
export async function mockGetDoctorPublicProfile({ doctorId }: { doctorId: string }): Promise<Partial<DoctorProfile> | null> {
  logInfo("[mockApiService] mockGetDoctorPublicProfile", { doctorId });
  await simulateDelay();
  const doc = dataStore.getDoctorProfilesStore().find(d => d.userId === doctorId);
  if (!doc) return null;
  // Return only public fields
  const { userId, specialty, bio, location, languages, consultationFee, profilePictureUrl } = doc;
  return { userId, specialty, bio, location, languages, consultationFee, profilePictureUrl };
}

/**
 * Gets available slots for a doctor on a given date.
 */
export async function mockGetAvailableSlots({ doctorId, dateString }: { doctorId: string; dateString: string }): Promise<string[]> {
  logInfo("[mockApiService] mockGetAvailableSlots", { doctorId, dateString });
  await simulateDelay();
  const doctor = (dataStore as any).doctorProfilesStore.find((d: any) => d.userId === doctorId);
  if (!doctor || !doctor.mockAvailability) return [];
  // For demo, just return all slots not blocked
  return doctor.mockAvailability.slots.filter((slot: any) => !doctor.mockAvailability.blockedDates.includes(dateString)).map((slot: any) => slot.startTime);
}

/**
 * Books an appointment if slot available. Adds to store, notifies doctor/patient.
 */
export async function mockBookAppointment(appointmentData: Partial<Appointment> & { patientId: string; doctorId: string; appointmentDate: Timestamp; startTime: string; endTime: string }): Promise<{ success: boolean; appointmentId: string }> {
  logInfo("[mockApiService] mockBookAppointment", { appointmentData });
  await simulateDelay();
  // For demo, assume slot is available
  const id = uuidv4();
  const now = Timestamp.now();
  const appt: Appointment = {
    ...appointmentData,
    id,
    status: AppointmentStatus.PENDING, // Fix: Use AppointmentStatus enum for appointment logic
    createdAt: now,
    updatedAt: now,
    reason: appointmentData.reason || "",
    notes: "",
  } as Appointment;
  (dataStore as any).appointmentsStore.push(appt);
  // Add notification to doctor and patient
  (dataStore as any).notificationsStore.push({
    id: uuidv4(),
    userId: appointmentData.doctorId,
    title: "New Appointment Booked",
    message: `You have a new appointment booked by a patient.`,
    isRead: false,
    createdAt: now,
    type: "appointment_booked",
    relatedId: id,
  });
  (dataStore as any).notificationsStore.push({
    id: uuidv4(),
    userId: appointmentData.patientId,
    title: "Appointment Confirmed",
    message: `Your appointment has been booked.`,
    isRead: false,
    createdAt: now,
    type: "appointment_booked",
    relatedId: id,
  });
  return { success: true, appointmentId: id };
}

/**
 * Marks an appointment as completed by doctor, adds notes.
 */
export async function mockCompleteAppointment({ appointmentId, notes, doctorId }: { appointmentId: string; notes: string; doctorId: string }): Promise<{ success: boolean }> {
  logInfo("[mockApiService] mockCompleteAppointment", { appointmentId, notes, doctorId });
  await simulateDelay();
  const appt = (dataStore as any).appointmentsStore.find((a: any) => a.id === appointmentId);
  if (!appt) throw new Error("not-found");
  if (appt.doctorId !== doctorId) throw new Error("permission-denied");
  appt.status = AppointmentStatus.COMPLETED; // Fix: Use AppointmentStatus enum for appointment logic
  appt.notes = notes;
  appt.updatedAt = Timestamp.now();
  return { success: true };
}

/**
 * Updates user profile fields.
 */
export async function mockUpdateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean }> {
  logInfo("[mockApiService] mockUpdateUserProfile", { userId, updates });
  await simulateDelay();
  const user = (dataStore as any).usersStore.find((u: any) => u.id === userId);
  if (!user) throw new Error("not-found");
  Object.assign(user, updates, { updatedAt: Timestamp.now() });
  return { success: true };
}

/**
 * Gets all notifications for a user.
 */
export async function mockGetNotifications(userId: string): Promise<Notification[]> {
  logInfo("[mockApiService] mockGetNotifications", { userId });
  await simulateDelay();
  return dataStore.getNotificationsStore().filter(n => n.userId === userId);
}

/**
 * Marks a notification as read.
 */
export async function mockMarkNotificationRead({ notificationId, userId }: { notificationId: string; userId: string }): Promise<{ success: boolean }> {
  logInfo("[mockApiService] mockMarkNotificationRead", { notificationId, userId });
  await simulateDelay();
  const notif = (dataStore as any).notificationsStore.find((n: any) => n.id === notificationId && n.userId === userId);
  if (!notif) throw new Error("not-found");
  notif.isRead = true;
  return { success: true };
}

/**
 * Admin verifies a doctor (updates status/notes).
 */
export async function mockAdminVerifyDoctor({ doctorId, status, notes }: { doctorId: string; status: VerificationStatus; notes: string }): Promise<{ success: boolean }> {
  logInfo("[mockApiService] mockAdminVerifyDoctor", { doctorId, status, notes });
  await simulateDelay();
  const doc = (dataStore as any).doctorProfilesStore.find((d: any) => d.userId === doctorId);
  if (!doc) throw new Error("not-found");
  doc.verificationStatus = status;
  doc.verificationNotes = notes;
  return { success: true };
}

/**
 * Example: Fetch all users (future: add CRUD, filtering, etc.)
 */
export function fetchAllUsers(): UserProfile[] {
  logInfo("[mockApiService] fetchAllUsers");
  return getUsersStore();
}

/**
 * Example: Fetch all appointments
 */
export function fetchAllAppointments(): Appointment[] {
  logInfo("[mockApiService] fetchAllAppointments");
  return getAppointmentsStore();
}

// Add more mock API methods as needed for your app's needs.

/**
 * Example: Mock doctor user for testing
 */
export const mockDoctorUser: UserProfile = {
  id: 'DOC-12345',
  email: 'doctor@example.com',
  phone: '123-456-7890',
  firstName: 'John',
  lastName: 'Doe',
  userType: UserType.DOCTOR,
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

// Add stub exports for missing admin mocks
export async function mockGetDoctorVerifications() {
  // TODO: Replace with real mock data
  return [];
}

/**
 * Gets verification data for a specific doctor
 * @param doctorId The doctor's user ID
 * @returns Doctor verification data including documents and status
 */
export async function mockGetDoctorVerificationData(doctorId: string) {
  logInfo("[mockApiService] mockGetDoctorVerificationData", { doctorId });
  await simulateDelay();
  
  const doctor = dataStore.getDoctorProfilesStore().find(d => d.userId === doctorId);
  if (!doctor) throw new Error("not-found");
  
  const user = dataStore.getUsersStore().find(u => u.id === doctorId);
  
  // Omit the timestamp fields that are causing issues
  return {
    doctorId,
    name: `${user?.firstName || ''} ${user?.lastName || ''}`,
    specialty: doctor.specialty,
    licenseNumber: doctor.licenseNumber,
    verificationStatus: doctor.verificationStatus,
    verificationNotes: doctor.verificationNotes || '',
    licenseDocumentUrl: doctor.licenseDocumentUrl,
    certificateUrl: doctor.certificateUrl
  };
}

/**
 * Updates the verification status of a doctor
 * @param doctorId The doctor's user ID
 * @param status The new verification status
 * @param notes Admin notes about the verification decision
 * @returns Success indicator
 */
export async function mockSetDoctorVerificationStatus({ doctorId, status, notes }: { doctorId: string; status: VerificationStatus; notes: string }): Promise<{ success: boolean }> {
  logInfo("[mockApiService] mockSetDoctorVerificationStatus", { doctorId, status, notes });
  await simulateDelay();
  
  // Find the doctor profile in the doctor profiles store
  const doctorProfilesStore = dataStore.getDoctorProfilesStore();
  const docIndex = doctorProfilesStore.findIndex(d => d.userId === doctorId);
  if (docIndex === -1) throw new Error("not-found");
  
  // Update the doctor profile
  doctorProfilesStore[docIndex].verificationStatus = status;
  doctorProfilesStore[docIndex].verificationNotes = notes;
  doctorProfilesStore[docIndex].updatedAt = Timestamp.now();
  
  // Add notification to the doctor about their verification status change
  dataStore.getNotificationsStore().push({
    id: uuidv4(),
    userId: doctorId,
    title: "Verification Status Updated",
    message: `Your verification status has been updated to ${status}.`,
    isRead: false,
    createdAt: Timestamp.now(),
    type: "verification_update",
    relatedId: doctorId,
  });
  
  return { success: true };
}

export async function mockGetSystemLogs() {
  // TODO: Replace with real mock logs
  return [];
}
