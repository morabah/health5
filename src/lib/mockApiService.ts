/**
 * Simulates backend API calls by operating on in-memory mock data stores.
 * Use for all mock CRUD and query operations in dev/test mode.
 */
import { logInfo, logError } from "@/lib/logger";
import type { UserProfile } from "@/types/user";
import type { DoctorProfile, DoctorVerificationData } from "@/types/doctor";
import type { PatientProfile } from "@/types/patient";
import type { Appointment } from "@/types/appointment";
import type { Notification } from "@/types/notification";
import { getUsersStore, getDoctorProfilesStore, getPatientProfilesStore, getAppointmentsStore, getNotificationsStore } from "@/data/mockDataStore";
import { UserType, VerificationStatus, AppointmentStatus } from "@/types/enums";
import { v4 as uuidv4 } from "uuid";
import { Timestamp } from "firebase/firestore";
import { getDateObject } from "@/utils/dateUtils";
import { generateId, generateUuid } from "@/utils/idGenerator";
import { formatDate, formatDateTime } from "@/utils/dateFormatter";

// Import persistence module
import { 
  syncAppointmentCreated,
  syncAppointmentUpdated,
  syncAppointmentCancelled,
  syncNotificationAdded,
  syncNotificationMarkedRead,
  syncNotificationUpdated,
  syncUserAdded,
  syncUserDeactivated,
  syncUserUpdated,
  syncDoctorProfileUpdated,
  persistAllData,
  initDataPersistence
} from "./mockDataPersistence";

// Mutable stores (for direct mutation)
import * as dataStore from "@/data/mockDataStore";

// Helper utilities for consistent API mocking
const logApiCall = (functionName: string, params: any) => {
  logInfo(`[mockApiService] ${functionName}`, params);
};

const delay = () => simulateDelay();

// Initialize data persistence if we're in the browser
if (typeof window !== 'undefined') {
  initDataPersistence();
}

/** Simulates a random network delay (100-300ms) */
function simulateDelay() {
  return new Promise(res => setTimeout(res, 100 + Math.random() * 200));
}

// Initialize doctor availability slots on module load
(function initializeDoctorAvailability() {
  logInfo("[mockApiService] Initializing doctor availability slots");
  
  // Get all doctor profiles
  const doctorProfiles = getDoctorProfilesStore();
  
  // For each doctor profile, set up default availability if not already set
  doctorProfiles.forEach(doctor => {
    // Skip if already has availability
    if ((doctor as any).mockAvailability) {
      return;
    }
    
    // Generate dates for the next 30 days
    const availableDates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends for some doctors to create variation
      const dayOfWeek = date.getDay();
      if ((doctor.userId === 'user_doctor_002' || doctor.userId === 'user_doctor_004') && (dayOfWeek === 0 || dayOfWeek === 6)) {
        continue;
      }
      
      availableDates.push(date.toISOString().split('T')[0]);
    }
    
    // Generate time slots
    const timeSlots = [
      { startTime: '09:00', endTime: '09:30' },
      { startTime: '09:30', endTime: '10:00' },
      { startTime: '10:00', endTime: '10:30' },
      { startTime: '10:30', endTime: '11:00' },
      { startTime: '11:00', endTime: '11:30' },
      { startTime: '11:30', endTime: '12:00' },
      { startTime: '13:00', endTime: '13:30' },
      { startTime: '13:30', endTime: '14:00' },
      { startTime: '14:00', endTime: '14:30' },
      { startTime: '14:30', endTime: '15:00' },
      { startTime: '15:00', endTime: '15:30' },
      { startTime: '15:30', endTime: '16:00' },
    ];
    
    // Randomly block some dates to create variation
    const blockedDates: string[] = [];
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * availableDates.length);
      const dateToBlock = availableDates[randomIndex];
      if (!blockedDates.includes(dateToBlock)) {
        blockedDates.push(dateToBlock);
      }
    }
    
    // Assign availability to doctor profile
    (doctor as any).mockAvailability = {
      slots: timeSlots,
      blockedDates: blockedDates
    };
    
    logInfo(`[mockApiService] Set up availability for doctor ${doctor.userId}`);
  });
})();

// Define missing DoctorVerification interface
interface DoctorVerification {
  id: string;
  name?: string;
  status: VerificationStatus;
  dateSubmitted: Date | string;
  specialty?: string;
}

/**
 * Registers a new user (patient/doctor). Checks for email conflict, creates user/profile, adds to stores.
 * @throws Error('already-exists') if email taken.
 */
export async function mockRegisterUser(data: Partial<UserProfile> & { 
  userType: UserType, 
  // Additional fields not in UserProfile
  password?: string,
  patientData?: Partial<PatientProfile> 
}): Promise<{ success: boolean; userId: string }> {
  logInfo("[mockApiService] mockRegisterUser", { data });
  await simulateDelay();
  const { email, userType } = data;
  if (!email) throw new Error("missing-email");
  const existing = dataStore.getUsersStore().find(u => u.email === email);
  if (existing) throw new Error("already-exists");
  const id = uuidv4();
  const now = new Date();
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
    const patientProfile: PatientProfile = {
      userId: id,
      dateOfBirth: data.patientData?.dateOfBirth || null,
      gender: data.patientData?.gender || null,
      bloodType: data.patientData?.bloodType || null,
      medicalHistory: data.patientData?.medicalHistory || null
    };
    (dataStore as any).patientProfilesStore.push(patientProfile);
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
  
  // Find user by email
  const user = dataStore.getUsersStore().find(u => u.email === email);
  if (!user) throw new Error("invalid-credential");
  
  // Check if user is active
  if (user.isActive === false) throw new Error("user-disabled");
  
  // For demo, we don't actually check the password
  // In a real app, we would validate the password here
  
  return { 
    user: { uid: user.id, email: user.email! }, 
    userProfile: user 
  };
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
  appt.updatedAt = new Date();

  // Sync appointment cancellation across tabs
  syncAppointmentCancelled(appointmentId, reason);
  
  return { success: true };
}

/**
 * Retrieves an appointment by its ID
 * @param appointmentId - The ID of the appointment to retrieve
 * @returns The appointment object if found, null otherwise
 */
export async function mockGetAppointmentById(appointmentId: string): Promise<Appointment | null> {
  logInfo("[mockApiService] mockGetAppointmentById", { appointmentId });
  
  // Simulate network delay
  await simulateDelay();
  
  try {
    // Get appointments from the data store
    const appointments = dataStore.getAppointmentsStore();
    
    // Find the appointment with the matching ID
    const appointment = appointments.find(appt => appt.id === appointmentId);
    
    if (appointment) {
      return appointment;
    } else {
      logInfo("[mockApiService] Appointment not found", { appointmentId });
      return null;
    }
  } catch (error) {
    logError("[mockApiService] Error getting appointment by ID", { appointmentId, error });
    throw error;
  }
}

/**
 * Updates an existing appointment with new data.
 * @param appointment The updated appointment object
 * @returns Object indicating success
 */
export async function mockUpdateAppointment(appointment: Appointment): Promise<{ success: boolean }> {
  logInfo("[mockApiService] mockUpdateAppointment", { appointmentId: appointment.id });
  await simulateDelay();
  
  const appointments = (dataStore as any).appointmentsStore;
  const index = appointments.findIndex((a: any) => a.id === appointment.id);
  
  if (index === -1) {
    throw new Error("not-found");
  }
  
  // Update the appointment in the store
  appointments[index] = {
    ...appointments[index],
    ...appointment,
    updatedAt: new Date()
  };
  
  // Sync the updated appointment across tabs
  syncAppointmentUpdated(appointments[index]);
  
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
  
  // Get approved doctors
  let docs = dataStore.getDoctorProfilesStore().filter(d => d.verificationStatus === VerificationStatus.APPROVED);
  
  // Apply filters if provided
  if (specialty) docs = docs.filter(d => d.specialty === specialty);
  if (location) docs = docs.filter(d => d.location === location);
  
  // Add name field to each doctor by looking up their user profile
  return docs.map(doc => {
    // Find the user profile for this doctor
    const userProfile = dataStore.getUsersStore().find(u => u.id === doc.userId);
    
    // Create a copy of the doctor profile with the name added
    return {
      ...doc,
      name: userProfile ? `Dr. ${userProfile.firstName} ${userProfile.lastName}` : undefined
    };
  });
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
  
  // If doctor has no availability data, initialize with default slots
  if (!doctor || !doctor.mockAvailability) {
    if (doctor) {
      // Create default availability if needed
      const defaultTimeSlots = [
        { startTime: '09:00', endTime: '09:30' },
        { startTime: '10:00', endTime: '10:30' },
        { startTime: '11:00', endTime: '11:30' },
        { startTime: '13:00', endTime: '13:30' },
        { startTime: '14:00', endTime: '14:30' },
        { startTime: '15:00', endTime: '15:30' },
      ];
      
      doctor.mockAvailability = {
        slots: defaultTimeSlots,
        blockedDates: []
      };
      
      logInfo(`[mockApiService] Created default availability for doctor ${doctorId}`);
    } else {
      return [];
    }
  }
  
  // For demo, just return all slots not blocked
  return doctor.mockAvailability.slots
    .filter((slot: any) => !doctor.mockAvailability.blockedDates.includes(dateString))
    .map((slot: any) => slot.startTime);
}

/**
 * Books an appointment if slot available. Adds to store, notifies doctor/patient.
 */
export async function mockBookAppointment(appointmentData: Partial<Appointment> & { patientId: string; doctorId: string; appointmentDate: Timestamp; startTime: string; endTime: string }): Promise<{ success: boolean; appointmentId: string }> {
  logInfo("[mockApiService] mockBookAppointment", { appointmentData });
  await simulateDelay();
  // For demo, assume slot is available
  const id = uuidv4();
  const now = new Date();
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
  
  // Sync the new appointment across tabs
  syncAppointmentCreated(appt);
  
  // Add notification to doctor and patient
  const doctorNotification = {
    id: uuidv4(),
    userId: appointmentData.doctorId,
    title: "New Appointment Booked",
    message: `You have a new appointment booked by a patient.`,
    isRead: false,
    createdAt: now,
    type: "appointment_booked",
    relatedId: id,
  };
  
  const patientNotification = {
    id: uuidv4(),
    userId: appointmentData.patientId,
    title: "Appointment Confirmed",
    message: `Your appointment has been booked.`,
    isRead: false,
    createdAt: now,
    type: "appointment_booked",
    relatedId: id,
  };
  
  (dataStore as any).notificationsStore.push(doctorNotification);
  (dataStore as any).notificationsStore.push(patientNotification);
  
  // Sync notifications across tabs
  syncNotificationAdded(doctorNotification);
  syncNotificationAdded(patientNotification);
  
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
  appt.updatedAt = new Date();
  return { success: true };
}

/**
 * Gets all notifications for a user.
 */
export async function mockGetNotifications(userId: string): Promise<Notification[]> {
  logApiCall('mockGetNotifications', { userId });
  
  // Simulate network delay
  await simulateDelay();
  
  const notifications = dataStore.getNotificationsStore();
  return notifications
    .filter(notification => notification.userId === userId)
    .sort((a, b) => {
      // Handle different date formats - Date object, Timestamp object, or ISO string
      const getTime = (date: any) => {
        if (date instanceof Date) return date.getTime();
        if (date && typeof date === 'object' && 'toDate' in date) return date.toDate().getTime();
        if (typeof date === 'string') return new Date(date).getTime();
        return 0;
      };
      
      return getTime(b.createdAt) - getTime(a.createdAt);
    });
}

/**
 * Marks a notification as read.
 */
export async function mockMarkNotificationAsRead(notificationId: string): Promise<boolean> {
  logApiCall('mockMarkNotificationAsRead', { notificationId });
  
  // Simulate network delay
  await simulateDelay();
  
  const notifications = dataStore.getNotificationsStore();
  const notificationIndex = notifications.findIndex(n => n.id === notificationId);
  if (notificationIndex === -1) {
    return false;
  }
  
  const updatedNotification = {
    ...notifications[notificationIndex],
    isRead: true,
    updatedAt: new Date()
  };
  
  dataStore.notificationsStore[notificationIndex] = updatedNotification;
  syncNotificationUpdated(updatedNotification);
  
  return true;
}

/**
 * Marks all notifications as read for a user.
 */
export async function mockMarkAllNotificationsAsRead(userId: string): Promise<boolean> {
  logApiCall('mockMarkAllNotificationsAsRead', { userId });
  
  // Simulate network delay
  await simulateDelay();
  
  let updatedCount = 0;
  const notifications = dataStore.getNotificationsStore();
  
  notifications.forEach((notification, index) => {
    if (notification.userId === userId && !notification.isRead) {
      const updatedNotification = {
        ...notification,
        isRead: true,
        updatedAt: new Date()
      };
      
      dataStore.notificationsStore[index] = updatedNotification;
      syncNotificationUpdated(updatedNotification);
      updatedCount++;
    }
  });
  
  return updatedCount > 0;
}

/**
 * Creates a new notification and adds it to the store.
 */
export async function mockCreateNotification(
  userId: string, 
  title: string, 
  message: string, 
  type: string,
  relatedId?: string
): Promise<Notification> {
  logApiCall('mockCreateNotification', { userId, title, message, type, relatedId });
  
  // Simulate network delay
  await simulateDelay();
  
  const newNotification: Notification = {
    id: uuidv4(),
    userId,
    title,
    message,
    isRead: false,
    createdAt: new Date(),
    type,
    relatedId
  };
  
  dataStore.notificationsStore.push(newNotification);
  syncNotificationAdded(newNotification);
  
  return newNotification;
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
  createdAt: new Date(),
  updatedAt: new Date()
};

// Add stub exports for missing admin mocks
export async function mockGetDoctorVerifications(): Promise<DoctorVerification[]> {
  logApiCall('mockGetDoctorVerifications', {});
  
  // Simulate network delay
  await delay();
  
  return getDoctorProfilesStore()
    .filter(profile => profile.verificationStatus !== VerificationStatus.APPROVED)
    .map(profile => {
      const user = getUsersStore().find(u => u.id === profile.userId);
      return {
        id: profile.userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown Doctor',
        status: profile.verificationStatus,
        dateSubmitted: profile.createdAt || new Date(),
        specialty: profile.specialty
      };
    });
}

export async function mockGetDoctorVerificationDetails(doctorId: string): Promise<DoctorVerificationData | null> {
  logApiCall('mockGetDoctorVerificationDetails', { doctorId });
  
  // Simulate network delay
  await delay();
  
  const doctorProfile = getDoctorProfilesStore().find(profile => profile.userId === doctorId);
  if (!doctorProfile) {
    console.error(`Doctor profile not found for ID: ${doctorId}`);
    return null;
  }
  
  const userProfile = getUsersStore().find(user => user.id === doctorId);
  if (!userProfile) {
    console.error(`User profile not found for ID: ${doctorId}`);
    return null;
  }
  
  return {
    id: doctorId,
    name: `${userProfile.firstName} ${userProfile.lastName}`,
    email: userProfile.email,
    phone: userProfile.phone || '',
    specialty: doctorProfile.specialty || 'General Medicine',
    licenseNumber: doctorProfile.licenseNumber || '',
    education: doctorProfile.education || [],
    experience: doctorProfile.experience || [],
    status: doctorProfile.verificationStatus,
    applicationDate: doctorProfile.createdAt || new Date(),
    documents: doctorProfile.verificationDocuments || [],
    adminNotes: doctorProfile.adminNotes || ''
  };
}

export async function mockSetDoctorVerificationStatus(
  doctorId: string, 
  status: VerificationStatus, 
  adminNotes?: string
): Promise<boolean> {
  logApiCall('mockSetDoctorVerificationStatus', { doctorId, status, adminNotes });
  
  // Simulate network delay
  await delay();
  
  const doctorProfileIndex = getDoctorProfilesStore().findIndex(profile => profile.userId === doctorId);
  if (doctorProfileIndex === -1) {
    console.error(`Doctor profile not found for ID: ${doctorId}`);
    return false;
  }
  
  // Update the doctor's profile with the new status
  const updatedProfile = {
    ...getDoctorProfilesStore()[doctorProfileIndex],
    verificationStatus: status,
    adminNotes: adminNotes || getDoctorProfilesStore()[doctorProfileIndex].adminNotes,
    updatedAt: new Date()
  };
  
  getDoctorProfilesStore()[doctorProfileIndex] = updatedProfile;
  syncDoctorProfileUpdated(updatedProfile);
  
  // Create a notification for the doctor
  let notificationTitle = 'Verification Status Update';
  let notificationMessage = '';
  
  switch (status) {
    case VerificationStatus.APPROVED:
      notificationTitle = 'Account Verification Approved';
      notificationMessage = 'Congratulations! Your account has been verified. You can now start accepting appointments.';
      break;
    case VerificationStatus.REJECTED:
      notificationTitle = 'Account Verification Rejected';
      notificationMessage = 'Your account verification has been rejected. Please review the admin notes for more information.';
      break;
    case VerificationStatus.MORE_INFO_REQUIRED:
      notificationTitle = 'Additional Information Required';
      notificationMessage = 'Please provide additional information for your account verification.';
      break;
    default:
      notificationMessage = `Your verification status has been updated to ${status}.`;
  }
  
  if (adminNotes) {
    notificationMessage += ` Admin Notes: ${adminNotes}`;
  }
  
  await mockCreateNotification(
    doctorId,
    notificationTitle,
    notificationMessage,
    'VERIFICATION_UPDATE',
    doctorId
  );
  
  return true;
}

export async function mockGetSystemLogs() {
  // TODO: Replace with real mock logs
  return [];
}

/**
 * Updates a doctor profile with the provided data
 * @param profileData The updated doctor profile data
 * @returns The updated doctor profile
 */
export async function mockUpdateDoctorProfile(profileData: any): Promise<any> {
  console.log('[MOCK API] Updating doctor profile', profileData);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Save data to localStorage for persistence in mock environment
  try {
    const storedUser = localStorage.getItem('auth_user');
    const storedProfile = localStorage.getItem('auth_profile');
    
    if (storedUser && storedProfile) {
      const parsedUser = JSON.parse(storedUser);
      const parsedProfile = JSON.parse(storedProfile);
      
      // Check if stored profile is for the same user
      if (parsedUser.uid === profileData.id || parsedUser.userType === 'doctor') {
        // Update the stored profile with new data
        const updatedProfile = {
          ...parsedProfile,
          firstName: profileData.name.replace('Dr. ', '').split(' ')[0],
          lastName: profileData.name.replace('Dr. ', '').split(' ').slice(1).join(' '),
          email: profileData.email,
          phone: profileData.phone,
          specialty: profileData.specialty,
          location: profileData.location,
          bio: profileData.bio,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('auth_profile', JSON.stringify(updatedProfile));
        console.log('[MOCK API] Profile data persisted to localStorage', updatedProfile);
      }
    }
  } catch (error) {
    console.error('[MOCK API] Error persisting profile data to localStorage', error);
  }
  
  // In a real implementation, this would update the database
  return {
    ...profileData,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Updates a patient profile with the provided data
 * @param userId The user ID of the patient
 * @param profileData The updated patient profile data
 * @returns The updated patient profile
 */
export async function mockUpdatePatientProfile(userId: string, profileData: any): Promise<any> {
  console.log('[MOCK API] Updating patient profile', { userId, profileData });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Save data to localStorage for persistence in mock environment
  try {
    const storedUser = localStorage.getItem('auth_user');
    const storedProfile = localStorage.getItem('auth_profile');
    
    if (storedUser && storedProfile) {
      const parsedUser = JSON.parse(storedUser);
      const parsedProfile = JSON.parse(storedProfile);
      
      // Ensure we're updating the right user
      if (parsedUser.uid === userId || parsedUser.userType === 'patient') {
        // Update the stored profile with new data
        const updatedProfile = {
          ...parsedProfile,
          ...profileData,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('auth_profile', JSON.stringify(updatedProfile));
        console.log('[MOCK API] Patient profile data persisted to localStorage', updatedProfile);
      }
    }
  } catch (error) {
    console.error('[MOCK API] Error persisting patient profile data to localStorage', error);
  }
  
  // In a real implementation, this would update the database
  return {
    ...profileData,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Gets a list of all users in the system
 * @returns Array of user objects
 */
export async function mockGetAllUsers(): Promise<any[]> {
  console.log('[MOCK API] Getting all users');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Get actual users from the data store instead of hardcoded mock data
  return getUsersStore().map(user => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    userType: user.userType,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt
  }));
}

/**
 * Adds a new user to the system
 * @param userData User data to add
 * @returns Created user object with ID
 */
export async function mockAddUser(userData: {
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  password?: string;
  phone?: string;
}): Promise<any> {
  logInfo("[mockApiService] mockAddUser", { userData });
  await simulateDelay();
  
  // Check if email already exists
  const existing = getUsersStore().find(u => u.email === userData.email);
  if (existing) throw new Error("email-already-exists");
  
  // Create a new user ID
  const id = uuidv4();
  const now = new Date();
  
  // Convert user type string to enum
  let userType: UserType;
  switch (userData.userType.toLowerCase()) {
    case 'admin':
      userType = UserType.ADMIN;
      break;
    case 'doctor':
      userType = UserType.DOCTOR;
      break;
    case 'patient':
      userType = UserType.PATIENT;
      break;
    default:
      throw new Error("invalid-user-type");
  }
  
  // Create the new user object
  const newUser: UserProfile = {
    id,
    email: userData.email,
    phone: userData.phone || null,
    firstName: userData.firstName,
    lastName: userData.lastName,
    userType,
    isActive: true,
    emailVerified: false,
    phoneVerified: false,
    createdAt: now,
    updatedAt: now
  };
  
  // Add user to the users store
  (dataStore as any).usersStore.push(newUser);
  
  // Create corresponding profile based on user type
  let profile = null;
  if (userType === UserType.PATIENT) {
    const patientProfile: PatientProfile = {
      userId: id,
      dateOfBirth: null,
      gender: null,
      bloodType: null,
      medicalHistory: null
    };
    (dataStore as any).patientProfilesStore.push(patientProfile);
    profile = patientProfile;
  } else if (userType === UserType.DOCTOR) {
    (dataStore as any).doctorProfilesStore.push({
      userId: id,
      specialty: "",
      licenseNumber: "",
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
      updatedAt: now
    });
    profile = (dataStore as any).doctorProfilesStore[getDoctorProfilesStore().length - 1];
  }
  
  // Persist user data to localStorage
  syncUserAdded(newUser, profile);
  
  logInfo("[mockApiService] User added successfully", { id, userType });
  
  // Return the created user
  return { 
    id, 
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    userType: userData.userType,
    isActive: true,
    emailVerified: false,
    createdAt: now.toISOString()
  };
}

/**
 * Toggles a user's active status
 * @param userId ID of the user to activate/deactivate
 * @returns Success indicator
 */
export async function mockDeactivateUser(userId: string): Promise<boolean> {
  console.log('[MOCK API] Toggling user active status', userId);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Find the user in the data store
  const userIndex = getUsersStore().findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return false;
  }
  
  // Toggle the user's active status
  const user = getUsersStore()[userIndex];
  user.isActive = !user.isActive;
  user.updatedAt = new Date();
  
  // Persist the change to localStorage
  syncUserDeactivated(userId, user.isActive);
  
  // Update localStorage if it's the current user
  try {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.uid === userId) {
        // If this is the current user, update their status
        const storedProfile = localStorage.getItem('auth_profile');
        if (storedProfile) {
          const parsedProfile = JSON.parse(storedProfile);
          parsedProfile.isActive = user.isActive;
          localStorage.setItem('auth_profile', JSON.stringify(parsedProfile));
        }
      }
    }
  } catch (error) {
    console.error('[MOCK API] Error updating user status in localStorage', error);
  }
  
  return true;
}

/**
 * Initiates password reset for a user
 * @param userId ID of the user to reset password
 * @returns Success indicator
 */
export async function mockResetUserPassword(userId: string): Promise<boolean> {
  console.log('[MOCK API] Sending password reset email', userId);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real implementation, this would send a password reset email
  return true;
}

/**
 * Retrieves admin settings
 * @returns Admin settings object
 */
export async function mockGetAdminSettings(): Promise<any> {
  console.log('[MOCK API] Getting admin settings');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Mock settings
  return {
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true
  };
}

/**
 * Updates admin settings
 * @param settings Updated settings object
 * @returns Success indicator
 */
export async function mockUpdateAdminSettings(settings: any): Promise<boolean> {
  console.log('[MOCK API] Updating admin settings', settings);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real implementation, this would save the settings to the database
  return true;
}

/**
 * Gets a detailed user profile by ID
 * @param userId ID of the user to fetch
 * @returns User profile object
 */
export async function mockGetUserProfile(userId: string): Promise<any> {
  logInfo("[mockApiService] mockGetUserProfile", { userId });
  await simulateDelay();
  
  // Find the user in the data store
  const user = getUsersStore().find(u => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Get additional profile data based on user type
  let additionalData = {};
  if (user.userType === UserType.PATIENT) {
    const patientProfile = getPatientProfilesStore().find(p => p.userId === userId);
    if (patientProfile) {
      additionalData = {
        dateOfBirth: patientProfile.dateOfBirth,
        gender: patientProfile.gender,
        bloodType: patientProfile.bloodType,
        medicalHistory: patientProfile.medicalHistory
      };
    }
  } else if (user.userType === UserType.DOCTOR) {
    const doctorProfile = getDoctorProfilesStore().find(d => d.userId === userId);
    if (doctorProfile) {
      additionalData = {
        specialty: doctorProfile.specialty,
        licenseNumber: doctorProfile.licenseNumber,
        yearsOfExperience: doctorProfile.yearsOfExperience,
        education: doctorProfile.education,
        bio: doctorProfile.bio,
        location: doctorProfile.location,
        languages: doctorProfile.languages,
        consultationFee: doctorProfile.consultationFee,
        profilePictureUrl: doctorProfile.profilePictureUrl,
        verificationStatus: doctorProfile.verificationStatus
      };
    }
  }
  
  // Format date fields
  const createdAt = user.createdAt instanceof Date 
    ? user.createdAt.toISOString() 
    : typeof user.createdAt === 'object' && user.createdAt !== null && 'toDate' in user.createdAt 
      ? user.createdAt.toDate().toISOString() 
      : String(user.createdAt);
  
  // Return combined data
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    userType: user.userType,
    isActive: user.isActive ?? true,
    emailVerified: user.emailVerified ?? false,
    phoneVerified: user.phoneVerified ?? false,
    createdAt,
    ...additionalData
  };
}

/**
 * Updates user profile fields
 * @param userId ID of the user to update
 * @param updates Updated profile fields
 * @returns Success object
 */
export async function mockUpdateUserProfile(userId: string, updates: any): Promise<{ success: boolean }> {
  logInfo("[mockApiService] mockUpdateUserProfile", { userId, updates });
  await simulateDelay();
  
  // Find the user in the data store
  const userIndex = getUsersStore().findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false };
  }
  
  // Update basic user fields
  const user = getUsersStore()[userIndex];
  if (updates.firstName) user.firstName = updates.firstName;
  if (updates.lastName) user.lastName = updates.lastName;
  if (updates.email) user.email = updates.email;
  if (updates.phone !== undefined) user.phone = updates.phone;
  user.updatedAt = new Date();
  
  // Update profile-specific fields if needed
  let profile = null;
  if (user.userType === UserType.PATIENT) {
    const patientProfile = getPatientProfilesStore().find(p => p.userId === userId);
    if (patientProfile) {
      if (updates.dateOfBirth !== undefined) patientProfile.dateOfBirth = updates.dateOfBirth;
      if (updates.gender !== undefined) patientProfile.gender = updates.gender;
      if (updates.bloodType !== undefined) patientProfile.bloodType = updates.bloodType;
      if (updates.medicalHistory !== undefined) patientProfile.medicalHistory = updates.medicalHistory;
      profile = patientProfile;
    }
  } else if (user.userType === UserType.DOCTOR) {
    const doctorProfile = getDoctorProfilesStore().find(d => d.userId === userId);
    if (doctorProfile) {
      if (updates.specialty !== undefined) doctorProfile.specialty = updates.specialty;
      if (updates.licenseNumber !== undefined) doctorProfile.licenseNumber = updates.licenseNumber;
      if (updates.yearsOfExperience !== undefined) doctorProfile.yearsOfExperience = updates.yearsOfExperience;
      if (updates.education !== undefined) doctorProfile.education = updates.education;
      if (updates.bio !== undefined) doctorProfile.bio = updates.bio;
      if (updates.location !== undefined) doctorProfile.location = updates.location;
      if (updates.languages !== undefined) doctorProfile.languages = updates.languages;
      if (updates.consultationFee !== undefined) doctorProfile.consultationFee = updates.consultationFee;
      profile = doctorProfile;
    }
  }
  
  // Persist the changes to localStorage
  syncUserUpdated(user, profile);
  
  return { success: true };
}

export async function mockCreateAppointment(
  patientId: string,
  doctorId: string,
  appointmentDate: Date,
  appointmentType: string
): Promise<Appointment> {
  logApiCall('mockCreateAppointment', { patientId, doctorId, appointmentDate, appointmentType });
  
  // Simulate network delay
  await delay();
  
  // Get patient and doctor data for denormalized fields
  const doctor = getUsersStore().find(u => u.id === doctorId);
  const patient = getUsersStore().find(u => u.id === patientId);
  const doctorProfile = getDoctorProfilesStore().find(p => p.userId === doctorId);
  
  // Calculate default start/end times if not provided
  const startTime = "09:00";
  const endTime = "09:30";
  
  const newAppointment: Appointment = {
    id: generateId('appointment'),
    patientId,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined,
    doctorId,
    doctorName: doctor ? `${doctor.firstName} ${doctor.lastName}` : undefined,
    doctorSpecialty: doctorProfile?.specialty,
    appointmentDate,
    startTime,
    endTime,
    status: AppointmentStatus.PENDING,
    reason: "General consultation",
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    appointmentType: appointmentType as "In-person" | "Video" || "In-person",
  };
  
  // Add to store and persist
  getAppointmentsStore().push(newAppointment);
  syncAppointmentCreated(newAppointment);
  
  // Create notifications for both patient and doctor
  if (doctor) {
    const doctorNotification: Notification = {
      id: generateId('notification'),
      userId: doctorId,
      title: 'New Appointment Scheduled',
      message: `You have a new appointment with ${patient?.firstName} ${patient?.lastName} on ${formatDate(appointmentDate)}`,
      isRead: false,
      createdAt: new Date(),
      type: 'appointment_created',
      relatedId: newAppointment.id
    };
    getNotificationsStore().push(doctorNotification);
    syncNotificationAdded(doctorNotification);
  }
  
  if (patient) {
    const patientNotification: Notification = {
      id: generateId('notification'),
      userId: patientId,
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${doctor?.firstName} ${doctor?.lastName} on ${formatDate(appointmentDate)} has been confirmed`,
      isRead: false,
      createdAt: new Date(),
      type: 'appointment_created',
      relatedId: newAppointment.id
    };
    getNotificationsStore().push(patientNotification);
    syncNotificationAdded(patientNotification);
  }
  
  return newAppointment;
}

export async function mockUpdateAppointmentDetails(
  appointmentId: string,
  updates: Partial<Appointment>
): Promise<Appointment | null> {
  logApiCall('mockUpdateAppointment', { appointmentId, updates });
  
  // Simulate network delay
  await delay();
  
  const appointmentIndex = getAppointmentsStore().findIndex(a => a.id === appointmentId);
  if (appointmentIndex === -1) {
    return null;
  }
  
  const updatedAppointment = {
    ...getAppointmentsStore()[appointmentIndex],
    ...updates,
    updatedAt: new Date()
  };
  
  getAppointmentsStore()[appointmentIndex] = updatedAppointment;
  syncAppointmentUpdated(updatedAppointment);
  
  // Create notification for status update if applicable
  if (updates.status) {
    const doctor = getMockDoctorUser(updatedAppointment.doctorId);
    const patient = getMockPatientUser(updatedAppointment.patientId);
    
    // Notify the patient about the status change
    if (patient) {
      const statusMessage = getStatusChangeMessage(updates.status, doctor);
      const patientNotification: Notification = {
        id: generateId('notification'),
        userId: updatedAppointment.patientId,
        title: 'Appointment Status Updated',
        message: statusMessage,
        isRead: false,
        createdAt: new Date(),
        type: 'appointment_updated',
        relatedId: appointmentId
      };
      getNotificationsStore().push(patientNotification);
      syncNotificationAdded(patientNotification);
    }
  }
  
  return updatedAppointment;
}

/**
 * Cancels an appointment with optional reason
 */
export async function mockCancelAppointmentDetails(
  appointmentId: string,
  cancelledBy: 'patient' | 'doctor',
  cancelReason?: string
): Promise<boolean> {
  logApiCall('mockCancelAppointmentDetails', { appointmentId, cancelledBy, cancelReason });
  
  // Simulate network delay
  await delay();
  
  const appointmentIndex = getAppointmentsStore().findIndex(a => a.id === appointmentId);
  if (appointmentIndex === -1) {
    return false;
  }
  
  const appointment = getAppointmentsStore()[appointmentIndex];
  const updatedAppointment = {
    ...appointment,
    status: cancelledBy === 'patient' ? AppointmentStatus.CANCELLED_BY_PATIENT : AppointmentStatus.CANCELLED_BY_DOCTOR,
    notes: cancelReason ? `${appointment.notes}\nCancellation reason: ${cancelReason}` : appointment.notes,
    updatedAt: new Date()
  };
  
  getAppointmentsStore()[appointmentIndex] = updatedAppointment;
  syncAppointmentCancelled(updatedAppointment.id, cancelReason);
  
  // Create notifications for both parties
  const doctor = getUsersStore().find(u => u.id === appointment.doctorId);
  const patient = getUsersStore().find(u => u.id === appointment.patientId);
  
  // Notify doctor if cancelled by patient
  if (cancelledBy === 'patient' && doctor) {
    const doctorNotification: Notification = {
      id: generateId('notification'),
      userId: appointment.doctorId,
      title: 'Appointment Cancelled',
      message: `${patient?.firstName} ${patient?.lastName} has cancelled their appointment on ${formatDate(appointment.appointmentDate)}${cancelReason ? `. Reason: ${cancelReason}` : ''}`,
      isRead: false,
      createdAt: new Date(),
      type: 'appointment_cancelled',
      relatedId: appointmentId
    };
    getNotificationsStore().push(doctorNotification);
    syncNotificationAdded(doctorNotification);
  }
  
  // Notify patient if cancelled by doctor
  if (cancelledBy === 'doctor' && patient) {
    const patientNotification: Notification = {
      id: generateId('notification'),
      userId: appointment.patientId,
      title: 'Appointment Cancelled',
      message: `Dr. ${doctor?.firstName} ${doctor?.lastName} has cancelled your appointment on ${formatDate(appointment.appointmentDate)}${cancelReason ? `. Reason: ${cancelReason}` : ''}`,
      isRead: false,
      createdAt: new Date(),
      type: 'appointment_cancelled',
      relatedId: appointmentId
    };
    getNotificationsStore().push(patientNotification);
    syncNotificationAdded(patientNotification);
  }
  
  return true;
}

// Helper function to generate appropriate status change messages
function getStatusChangeMessage(status: AppointmentStatus, doctor: UserProfile | null): string {
  switch (status) {
    case AppointmentStatus.COMPLETED:
      return `Your appointment with Dr. ${doctor?.firstName} ${doctor?.lastName} has been marked as completed.`;
    case AppointmentStatus.NO_SHOW:
      return `You missed your appointment with Dr. ${doctor?.firstName} ${doctor?.lastName}. Please reschedule if needed.`;
    case AppointmentStatus.RESCHEDULED:
      return `Your appointment with Dr. ${doctor?.firstName} ${doctor?.lastName} has been rescheduled.`;
    default:
      return `Your appointment status has been updated to ${status}.`;
  }
}

export async function mockSaveDoctorAvailability(
  doctorId: string,
  weeklySchedule: WeeklySchedule
): Promise<boolean> {
  logApiCall('mockSaveDoctorAvailability', { doctorId, weeklySchedule });
  
  // Simulate network delay
  await delay();
  
  const doctorProfileIndex = getDoctorProfilesStore().findIndex(profile => profile.userId === doctorId);
  if (doctorProfileIndex === -1) {
    console.error(`Doctor profile not found for ID: ${doctorId}`);
    return false;
  }
  
  // Update the doctor's profile with the new weekly schedule
  const updatedProfile = {
    ...getDoctorProfilesStore()[doctorProfileIndex],
    weeklySchedule,
    updatedAt: new Date()
  };
  
  getDoctorProfilesStore()[doctorProfileIndex] = updatedProfile;
  syncDoctorProfileUpdated(updatedProfile);
  
  console.log(`Doctor availability updated for ${doctorId}:`, weeklySchedule);
  return true;
}

export async function mockLoadDoctorAvailability(doctorId: string): Promise<WeeklySchedule | null> {
  logApiCall('mockLoadDoctorAvailability', { doctorId });
  
  // Simulate network delay
  await delay();
  
  const doctorProfile = getDoctorProfilesStore().find(profile => profile.userId === doctorId);
  if (!doctorProfile) {
    console.error(`Doctor profile not found for ID: ${doctorId}`);
    return null;
  }
  
  // Return the doctor's weekly schedule or an empty schedule if none exists
  return doctorProfile.weeklySchedule || {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  };
}

export async function mockBlockDoctorDate(
  doctorId: string,
  date: Date
): Promise<boolean> {
  logApiCall('mockBlockDoctorDate', { doctorId, date });
  
  // Simulate network delay
  await delay();
  
  const doctorProfileIndex = getDoctorProfilesStore().findIndex(profile => profile.userId === doctorId);
  if (doctorProfileIndex === -1) {
    console.error(`Doctor profile not found for ID: ${doctorId}`);
    return false;
  }
  
  // Update the doctor's profile to add this date to blocked dates
  const updatedProfile = {
    ...getDoctorProfilesStore()[doctorProfileIndex],
    blockedDates: [
      ...(getDoctorProfilesStore()[doctorProfileIndex].blockedDates || []),
      date
    ],
    updatedAt: new Date()
  };
  
  getDoctorProfilesStore()[doctorProfileIndex] = updatedProfile;
  syncDoctorProfileUpdated(updatedProfile);
  
  console.log(`Date blocked for doctor ${doctorId}:`, date);
  return true;
}

export async function mockUnblockDoctorDate(
  doctorId: string,
  date: Date
): Promise<boolean> {
  logApiCall('mockUnblockDoctorDate', { doctorId, date });
  
  // Simulate network delay
  await delay();
  
  const doctorProfileIndex = getDoctorProfilesStore().findIndex(profile => profile.userId === doctorId);
  if (doctorProfileIndex === -1) {
    console.error(`Doctor profile not found for ID: ${doctorId}`);
    return false;
  }
  
  const dateString = date.toISOString().split('T')[0];
  
  // Update the doctor's profile to remove this date from blocked dates
  const blockedDates = getDoctorProfilesStore()[doctorProfileIndex].blockedDates || [];
  const updatedBlockedDates = blockedDates.filter(d => {
    const blockedDateString = d instanceof Date 
      ? d.toISOString().split('T')[0] 
      : (d as any).toDate?.().toISOString().split('T')[0] || '';
    
    return blockedDateString !== dateString;
  });
  
  const updatedProfile = {
    ...getDoctorProfilesStore()[doctorProfileIndex],
    blockedDates: updatedBlockedDates,
    updatedAt: new Date()
  };
  
  getDoctorProfilesStore()[doctorProfileIndex] = updatedProfile;
  syncDoctorProfileUpdated(updatedProfile);
  
  console.log(`Date unblocked for doctor ${doctorId}:`, date);
  return true;
}

export async function mockGetDoctorBlockedDates(doctorId: string): Promise<Date[]> {
  logApiCall('mockGetDoctorBlockedDates', { doctorId });
  
  // Simulate network delay
  await delay();
  
  const doctorProfile = getDoctorProfilesStore().find(profile => profile.userId === doctorId);
  if (!doctorProfile) {
    console.error(`Doctor profile not found for ID: ${doctorId}`);
    return [];
  }
  
  // Convert any Timestamp objects to Date objects
  return (doctorProfile.blockedDates || []).map(date => {
    if (date instanceof Date) {
      return date;
    }
    // Handle Firestore Timestamp objects
    if ((date as any).toDate) {
      return (date as any).toDate();
    }
    return new Date(date);
  });
}
