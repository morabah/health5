/**
 * Simulates backend API calls by operating on in-memory mock data stores.
 * Use for all mock CRUD and query operations in dev/test mode.
 */
import { logInfo, logError } from "@/lib/logger";
import type { UserProfile } from "@/types/user";
import type { DoctorProfile, DoctorVerificationData, DoctorVerification } from "@/types/doctor";
import { WeeklySchedule, isValidWeeklySchedule } from "@/types/doctor";
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
import { getMockDoctorUser, getMockPatientUser } from "@/data/mockDataService";
import { initDataPersistence, persistAllData, persistDoctorProfiles, syncUserUpdated, syncUserAdded, syncUserDeactivated } from '@/lib/mockDataPersistence';
import { syncDoctorProfileUpdated, syncPatientProfileUpdated, syncAvailabilityUpdated } from './mockDataPersistence';
import { STORAGE_KEYS } from '@/lib/mockDataPersistence';

// Mutable stores (for direct mutation)
import * as dataStore from "@/data/mockDataStore";

// Helper utilities for consistent API mocking
const logApiCall = (functionName: string, params: any) => {
  logInfo(`[mockApiService] ${functionName}`, params);
};

const delay = () => simulateDelay();

// Initialize data persistence on client (hydrate stores from localStorage)
if (typeof window !== 'undefined') initDataPersistence();

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

/**
 * Registers a new user (patient/doctor). Checks for email conflict, creates user/profile, adds to stores.
 * @throws Error('already-exists') if email taken.
 */
export async function mockRegisterUser(data: Partial<UserProfile> & { 
  userType: UserType, 
  // Additional fields not in UserProfile
  password?: string,
  patientData?: Partial<PatientProfile>,
  isFromAdmin?: boolean
}): Promise<{ success: boolean; userId: string }> {
  logInfo("[mockApiService] mockRegisterUser", { data });
  await simulateDelay();
  const { email, userType } = data;
  if (!email) throw new Error("missing-email");
  const existing = dataStore.usersStore.find(u => u.email === email);
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
    // Check if registration is coming from admin by checking for an 'isFromAdmin' flag or based on data format
    const isFromAdmin = data.isFromAdmin || 
                       (data.hasOwnProperty('userType') && !data.hasOwnProperty('password'));
    
    (dataStore as any).doctorProfilesStore.push({
      userId: id,
      specialty: (data as any).specialty || "General",
      licenseNumber: (data as any).licenseNumber || "",
      yearsOfExperience: 0,
      education: "",
      bio: "",
      // Auto-approve doctors registered via admin
      verificationStatus: isFromAdmin ? VerificationStatus.APPROVED : VerificationStatus.PENDING,
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
  // Persist new user to localStorage
  try {
    persistAllData();
  } catch (error) {
    console.error('[mockApiService] Error persisting data in mockRegisterUser:', error);
    throw error;
  }
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
  const user = dataStore.usersStore.find(u => u.email === email);
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
  const user = dataStore.usersStore.find(u => u.id === userId) || null;
  if (!user) return { user: null, profile: null };
  let profile: PatientProfile | DoctorProfile | null = null;
  if (user.userType === UserType.PATIENT) {
    profile = dataStore.patientProfilesStore.find(p => p.userId === userId) || null;
  } else if (user.userType === UserType.DOCTOR) {
    profile = dataStore.doctorProfilesStore.find(d => d.userId === userId) || null;
  }
  return { user, profile };
}

/**
 * Gets appointments for a user, with optional filters.
 */
export async function mockGetMyAppointments(userId: string, userType: UserType, statusFilter?: AppointmentStatus[], dateFilter?: Date): Promise<Appointment[]> {
  logInfo("[mockApiService] mockGetMyAppointments", { userId, userType, statusFilter, dateFilter });
  await simulateDelay();
  let appts = dataStore.appointmentsStore.filter(a =>
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
    const appointments = dataStore.appointmentsStore;
    
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
  
  try {
    const doctorProfileIndex = dataStore.doctorProfilesStore.findIndex(profile => profile.userId === doctorId);
    if (doctorProfileIndex === -1) {
      console.error(`Doctor profile not found for ID: ${doctorId}`);
      return { success: false };
    }
    
    // Get the current doctor profile
    const doctorProfile = dataStore.doctorProfilesStore[doctorProfileIndex];
    
    // Create updated profile object with availability data
    const updatedProfile = {
      ...doctorProfile,
      mockAvailability: { slots, blockedDates },
      updatedAt: new Date()
    } as any; // Use type assertion to avoid TypeScript errors
    
    // Update store
    dataStore.doctorProfilesStore[doctorProfileIndex] = updatedProfile;
    
    // Sync changes using the availability-specific sync function
    syncAvailabilityUpdated(doctorId, { 
      weeklySchedule: slots, 
      blockedDates 
    });
    
    console.log(`[mockApiService] Successfully updated availability for doctor ${doctorId}`, {
      slotsCount: slots.length,
      blockedDatesCount: blockedDates.length
    });
    
    return { success: true };
  } catch (error) {
    console.error(`[mockApiService] Error updating doctor availability: ${error}`);
    return { success: false };
  }
}

/**
 * Finds doctors by specialty/location. Only VERIFIED doctors returned.
 */
export async function mockFindDoctors({ specialty, location }: { specialty?: string; location?: string }): Promise<DoctorProfile[]> {
  logInfo("[mockApiService] mockFindDoctors", { specialty, location });
  await simulateDelay();
  
  // Get approved doctors
  let docs = dataStore.doctorProfilesStore.filter(d => d.verificationStatus === VerificationStatus.APPROVED);
  
  // Apply filters if provided
  if (specialty) docs = docs.filter(d => d.specialty === specialty);
  if (location) docs = docs.filter(d => d.location === location);
  
  // Add name field to each doctor by looking up their user profile
  return docs.map(doc => {
    // Find the user profile for this doctor
    const userProfile = dataStore.usersStore.find(u => u.id === doc.userId);
    
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
  const doc = dataStore.doctorProfilesStore.find(d => d.userId === doctorId);
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
  
  // Use type assertion to avoid linter errors with the mockAvailability property
  const doctor = (dataStore.doctorProfilesStore.find(d => d.userId === doctorId) as any);
  
  if (!doctor) {
    console.error(`[mockApiService] Doctor not found for ID: ${doctorId}`);
    return [];
  }
  
  // If doctor has no availability data, initialize with default slots
  if (!doctor.mockAvailability) {
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
  }
  
  // Check if the date is blocked
  if (doctor.mockAvailability.blockedDates && doctor.mockAvailability.blockedDates.includes(dateString)) {
    console.log(`[mockApiService] Date ${dateString} is blocked for doctor ${doctorId}`);
    return [];
  }
  
  console.log(`[mockApiService] Returning available slots for doctor ${doctorId} on ${dateString}`, {
    slotCount: doctor.mockAvailability.slots.length
  });
  
  // Generate time slots in 30-minute increments based on availability windows
  return doctor.mockAvailability.slots.flatMap((slot: any) => {
    const slots: string[] = [];
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    let current = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    while (current < end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      current += 30;
    }
    return slots;
  });
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
  
  try {
    const appointmentIndex = getAppointmentsStore().findIndex(a => a.id === appointmentId);
    
    if (appointmentIndex === -1) {
      throw new Error("not-found");
    }
    
    const appointment = getAppointmentsStore()[appointmentIndex];
    
    if (appointment.doctorId !== doctorId) {
      throw new Error("permission-denied");
    }
    
    // Create updated appointment object
    const updatedAppointment = {
      ...appointment,
      status: AppointmentStatus.COMPLETED,
      notes: notes,
      updatedAt: new Date()
    };
    
    // Update store
    getAppointmentsStore()[appointmentIndex] = updatedAppointment;
    
    // Sync changes
    syncAppointmentUpdated(updatedAppointment);
    
    // Create notification for the patient
    const patient = getUsersStore().find(u => u.id === appointment.patientId);
    if (patient) {
      const doctor = getUsersStore().find(u => u.id === doctorId);
      const patientNotification = {
        id: generateId('notification'),
        userId: appointment.patientId,
        title: 'Appointment Completed',
        message: `Your appointment with Dr. ${doctor?.firstName || ''} ${doctor?.lastName || ''} has been marked as completed.`,
        isRead: false,
        createdAt: new Date(),
        type: 'appointment_completed',
        relatedId: appointmentId
      };
      
      getNotificationsStore().push(patientNotification);
      syncNotificationAdded(patientNotification);
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error completing appointment ${appointmentId}:`, error);
    return { success: false };
  }
}

/**
 * Gets all notifications for a user.
 */
export async function mockGetNotifications(userId: string): Promise<Notification[]> {
  logApiCall('mockGetNotifications', { userId });
  
  // Simulate network delay
  await delay();
  
  const notifications = dataStore.notificationsStore;
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
  await delay();
  
  const notifications = dataStore.notificationsStore;
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
 * Alternative version of marking a notification as read
 * (with a different parameter structure)
 */
export async function mockMarkNotificationRead({ notificationId, userId }: { notificationId: string; userId: string }): Promise<boolean> {
  logApiCall('mockMarkNotificationRead', { notificationId, userId });
  // Simply delegate to the existing implementation
  return mockMarkNotificationAsRead(notificationId);
}

/**
 * Marks all notifications as read for a user.
 */
export async function mockMarkAllNotificationsAsRead(userId: string): Promise<boolean> {
  logApiCall('mockMarkAllNotificationsAsRead', { userId });
  
  // Simulate network delay
  await delay();
  
  let updatedCount = 0;
  const notifications = dataStore.notificationsStore;
  
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
  await delay();
  
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
  
  const doctorProfileIndex = dataStore.doctorProfilesStore.findIndex(profile => profile.userId === doctorId);
  if (doctorProfileIndex === -1) {
    throw new Error("not-found");
  }
  
  // Create updated profile object
  const updatedProfile = {
    ...dataStore.doctorProfilesStore[doctorProfileIndex],
    verificationStatus: status,
    verificationNotes: notes,
    updatedAt: new Date()
  };
  
  // Update store
  dataStore.doctorProfilesStore[doctorProfileIndex] = updatedProfile;
  
  // Sync changes
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
  
  if (notes) {
    notificationMessage += ` Admin Notes: ${notes}`;
  }
  
  await mockCreateNotification(
    doctorId,
    notificationTitle,
    notificationMessage,
    'VERIFICATION_UPDATE',
    doctorId
  );
  
  return { success: true };
}

/**
 * Updates a doctor profile with the provided data
 * @param profileData The updated doctor profile data
 * @returns The updated doctor profile
 */
export async function mockUpdateDoctorProfile(profileData: any): Promise<any> {
  console.log('[MOCK API] Updating doctor profile', profileData);
  logApiCall('mockUpdateDoctorProfile', profileData);
  
  // Simulate API delay
  await simulateDelay();
  
  // First find the doctor profile in the data store
  // Use the userId from profileData directly if passed, otherwise use id
  const targetDoctorId = profileData.userId || profileData.id;
  if (!targetDoctorId) {
      console.error("Doctor ID missing in profileData");
      return { success: false, error: "Doctor ID missing" };
  }

  const doctorProfileIndex = dataStore.doctorProfilesStore.findIndex(profile => profile.userId === targetDoctorId);
  if (doctorProfileIndex === -1) {
    console.error(`Doctor profile not found for ID: ${targetDoctorId}`);
    // Optionally try to find user first, then profile
    const user = dataStore.usersStore.find(u => u.id === targetDoctorId);
    if (user && user.userType === UserType.DOCTOR) {
        // If user exists but profile doesn't, maybe create it? Or return error.
        console.warn(`User ${targetDoctorId} exists but DoctorProfile not found. Consider adding logic to create one.`);
    }
    return { success: false, error: "Doctor profile not found" };
  }

  // Find the user record as well - needed for name updates if provided separately
  const userIndex = dataStore.usersStore.findIndex(user => user.id === targetDoctorId);
  if (userIndex === -1) {
    // This case should ideally not happen if profile exists, but handle defensively
    console.error(`User record not found for ID: ${targetDoctorId} despite profile existing.`);
    // Depending on requirements, you might proceed without user update or return error
  }

  // Update user record only if userIndex is valid and profileData contains user fields
  if (userIndex !== -1 && (profileData.firstName || profileData.lastName || profileData.email || profileData.phone !== undefined)) {
    const updatedUser = {
      ...dataStore.usersStore[userIndex],
      firstName: profileData.firstName || dataStore.usersStore[userIndex].firstName,
      lastName: profileData.lastName || dataStore.usersStore[userIndex].lastName,
      email: profileData.email || dataStore.usersStore[userIndex].email,
      phone: profileData.phone !== undefined ? profileData.phone : dataStore.usersStore[userIndex].phone,
      updatedAt: new Date()
    };
    dataStore.usersStore[userIndex] = updatedUser;
    // syncUserUpdated calls persistUsers internally
    syncUserUpdated(updatedUser); 
  }

  // Update the doctor profile with all relevant fields from profileData
  const updatedProfile = {
    ...dataStore.doctorProfilesStore[doctorProfileIndex],
    specialty: profileData.specialty !== undefined ? profileData.specialty : dataStore.doctorProfilesStore[doctorProfileIndex].specialty,
    licenseNumber: profileData.licenseNumber !== undefined ? profileData.licenseNumber : dataStore.doctorProfilesStore[doctorProfileIndex].licenseNumber,
    yearsOfExperience: profileData.yearsOfExperience !== undefined ? profileData.yearsOfExperience : dataStore.doctorProfilesStore[doctorProfileIndex].yearsOfExperience,
    education: profileData.education !== undefined ? profileData.education : dataStore.doctorProfilesStore[doctorProfileIndex].education,
    bio: profileData.bio !== undefined ? profileData.bio : dataStore.doctorProfilesStore[doctorProfileIndex].bio,
    location: profileData.location !== undefined ? profileData.location : dataStore.doctorProfilesStore[doctorProfileIndex].location,
    languages: profileData.languages !== undefined ? profileData.languages : dataStore.doctorProfilesStore[doctorProfileIndex].languages,
    consultationFee: profileData.consultationFee !== undefined ? profileData.consultationFee : dataStore.doctorProfilesStore[doctorProfileIndex].consultationFee,
    profilePictureUrl: profileData.profilePictureUrl !== undefined ? profileData.profilePictureUrl : dataStore.doctorProfilesStore[doctorProfileIndex].profilePictureUrl,
    // Keep existing verification status unless explicitly changed elsewhere
    // verificationStatus: profileData.verificationStatus || getDoctorProfilesStore()[doctorProfileIndex].verificationStatus,
    updatedAt: new Date()
  };

  // Update doctor profile store
  dataStore.doctorProfilesStore[doctorProfileIndex] = updatedProfile;

  // syncDoctorProfileUpdated calls persistDoctorProfiles internally
  syncDoctorProfileUpdated(updatedProfile); 

  console.log(`[MOCK API] Successfully updated doctor profile for ${targetDoctorId}`);
  // Return success and the updated profile data structure
  return { success: true, profile: updatedProfile };
}

/**
 * Updates a patient profile with the provided data
 * @param userId The user ID of the patient
 * @param profileData The updated patient profile data
 * @returns The updated patient profile
 */
export async function mockUpdatePatientProfile(userId: string, profileData: any): Promise<any> {
  console.log('[MOCK API] Updating patient profile', { userId, profileData });
  logApiCall('mockUpdatePatientProfile', { userId, profileData });
  
  // Simulate API delay
  await simulateDelay();
  
  // Find the patient profile in the data store
  const patientProfileIndex = dataStore.patientProfilesStore.findIndex(profile => profile.userId === userId);
  if (patientProfileIndex === -1) {
    console.error(`Patient profile not found for ID: ${userId}`);
    return { success: false };
  }
  
  // Find the user record as well
  const userIndex = dataStore.usersStore.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    console.error(`User not found for ID: ${userId}`);
    return { success: false };
  }
  
  // Update user record if we have user information
  if (profileData.firstName || profileData.lastName || profileData.email || profileData.phone !== undefined) {
    const updatedUser = {
      ...dataStore.usersStore[userIndex],
      firstName: profileData.firstName || dataStore.usersStore[userIndex].firstName,
      lastName: profileData.lastName || dataStore.usersStore[userIndex].lastName,
      email: profileData.email || dataStore.usersStore[userIndex].email,
      phone: profileData.phone !== undefined ? profileData.phone : dataStore.usersStore[userIndex].phone,
      updatedAt: new Date()
    };
    
    // Update user store
    dataStore.usersStore[userIndex] = updatedUser;
    
    // Sync user changes
    syncUserUpdated(updatedUser);
  }
  
  // Update the patient profile
  const updatedProfile = {
    ...dataStore.patientProfilesStore[patientProfileIndex],
    ...profileData,
    updatedAt: new Date()
  };
  
  // Update patient profile store
  dataStore.patientProfilesStore[patientProfileIndex] = updatedProfile;
  
  // Sync patient profile changes
  syncPatientProfileUpdated(updatedProfile);
  
  // Maintain localStorage update for backward compatibility
  try {
    const storedUser = localStorage.getItem('auth_user');
    const storedProfile = localStorage.getItem('auth_profile');
    
    if (storedUser && storedProfile) {
      const parsedUser = JSON.parse(storedUser);
      const parsedProfile = JSON.parse(storedProfile);
      
      // Ensure we're updating the right user
      if (parsedUser.uid === userId || parsedUser.userType === 'patient') {
        // Update the stored profile with new data
        const updatedLocalProfile = {
          ...parsedProfile,
          ...profileData,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('auth_profile', JSON.stringify(updatedLocalProfile));
        console.log('[MOCK API] Patient profile data persisted to localStorage', updatedLocalProfile);
      }
    }
  } catch (error) {
    console.error('[MOCK API] Error persisting patient profile data to localStorage', error);
  }
  
  // Return the merged updated data
  return {
    ...profileData,
    id: userId,
    updatedAt: new Date().toISOString()
  };
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
  isFromAdmin?: boolean;
}): Promise<any> {
  logInfo("[mockApiService] mockAddUser", { userData });
  await simulateDelay();
  
  // Check if email already exists
  const existing = dataStore.usersStore.find(u => u.email === userData.email);
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
  
  // Register the user with the system
  // For doctor type, pass the isFromAdmin flag to control verification status
  if (userType === UserType.DOCTOR) {
    const result = await mockRegisterUser({
      ...newUser,
      isFromAdmin: userData.isFromAdmin
    });
    
    if (!result.success) {
      throw new Error("registration-failed");
    }
    
    return newUser;
  } else {
    // Use the existing flow for non-doctor users
    dataStore.usersStore.push(newUser);
    
    // If it's a patient, initialize an empty patient profile
    if (userType === UserType.PATIENT) {
      const patientProfile: PatientProfile = {
        userId: id,
        dateOfBirth: null,
        gender: null,
        bloodType: null,
        medicalHistory: null
      };
      dataStore.patientProfilesStore.push(patientProfile);
    }
    
    // Persist changes
    try {
      persistAllData();
    } catch (error) {
      console.error('[mockApiService] Error persisting data in mockAddUser:', error);
      throw error;
    }
    
    // Return the created user
    return newUser;
  }
}

/**
 * Deactivates a user account
 * @param userId ID of the user to deactivate
 * @returns Success indicator
 */
export async function mockDeactivateUser(userId: string): Promise<boolean> {
  logInfo("[mockApiService] mockDeactivateUser", { userId });
  await simulateDelay();
  
  try {
    const userIndex = dataStore.usersStore.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      console.error(`User not found for ID: ${userId}`);
      return false;
    }
    
    // Create updated user object
    const updatedUser = {
      ...dataStore.usersStore[userIndex],
      isActive: false,
      updatedAt: new Date()
    };
    
    // Update store
    dataStore.usersStore[userIndex] = updatedUser;
    
    // Sync changes
    syncUserDeactivated(userId, false);
    
    // Persist deactivation to localStorage
    try {
      persistAllData();
    } catch (error) {
      console.error('[mockApiService] Error persisting data in mockDeactivateUser:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Error deactivating user ${userId}:`, error);
    return false;
  }
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
  const user = dataStore.usersStore.find(u => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Get additional profile data based on user type
  let additionalData = {};
  if (user.userType === UserType.PATIENT) {
    const patientProfile = dataStore.patientProfilesStore.find(p => p.userId === userId);
    if (patientProfile) {
      additionalData = {
        dateOfBirth: patientProfile.dateOfBirth,
        gender: patientProfile.gender,
        bloodType: patientProfile.bloodType,
        medicalHistory: patientProfile.medicalHistory
      };
    }
  } else if (user.userType === UserType.DOCTOR) {
    const doctorProfile = dataStore.doctorProfilesStore.find(d => d.userId === userId);
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
    : user.createdAt && typeof (user.createdAt as any).toDate === 'function' 
      ? (user.createdAt as any).toDate().toISOString() 
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
  console.log('[MOCK API] Updating user profile', { userId, updates });
  logApiCall('mockUpdateUserProfile', { userId, updates });

  // Simulate API delay
  await simulateDelay();

  // Find the user record
  const userIndex = dataStore.usersStore.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    console.error(`User not found for ID: ${userId}`);
    return { success: false };
  }

  // Get the current user object
  const currentUser = dataStore.usersStore[userIndex];

  // Determine the correct phone number from the updates object
  let phoneUpdateValue: string | null | undefined = undefined;
  if (updates.phone !== undefined) {
    phoneUpdateValue = updates.phone;
  } else if (updates.phoneNumber !== undefined) {
    // If updates contains 'phoneNumber' instead of 'phone', use that value
    phoneUpdateValue = updates.phoneNumber;
  }

  // Update user record fields, falling back to current value if update is not provided
  const updatedUser: UserProfile = {
    ...currentUser,
    firstName: updates.firstName !== undefined ? updates.firstName : currentUser.firstName,
    lastName: updates.lastName !== undefined ? updates.lastName : currentUser.lastName,
    email: updates.email !== undefined ? updates.email : currentUser.email,
    // Use the determined phone update value, or fallback to current user's phone
    phone: phoneUpdateValue !== undefined ? phoneUpdateValue : currentUser.phone,
    // Add any other fields that might be updated from the 'updates' object
    // Example: isActive: updates.isActive !== undefined ? updates.isActive : currentUser.isActive,
    updatedAt: new Date()
  };

  // Update the user in the store
  dataStore.usersStore[userIndex] = updatedUser;

  // syncUserUpdated calls persistUsers internally
  syncUserUpdated(updatedUser);

  // If necessary, update associated DoctorProfile (e.g., name) and call syncDoctorProfileUpdated
  if (updatedUser.userType === UserType.DOCTOR) {
    const doctorProfileIndex = dataStore.doctorProfilesStore.findIndex(p => p.userId === userId);
    if (doctorProfileIndex !== -1) {
      const currentDoctorProfile = dataStore.doctorProfilesStore[doctorProfileIndex];
      const updatedDoctorProfileFields: Partial<DoctorProfile> = {};
      let doctorProfileNeedsUpdate = false;
      // Example: Update name if user name changed
      const newName = `Dr. ${updatedUser.firstName} ${updatedUser.lastName}`;
      if ((currentDoctorProfile as any).name !== newName) { // Assuming name is added dynamically elsewhere or needs adding
         // We might not store 'name' directly, but if we did:
         // updatedDoctorProfileFields.name = newName;
         // doctorProfileNeedsUpdate = true; 
         // More likely, no update needed here unless other shared fields changed
      }
      // Add checks for other fields if user updates should affect DoctorProfile

      if (doctorProfileNeedsUpdate) {
         dataStore.doctorProfilesStore[doctorProfileIndex] = { ...currentDoctorProfile, ...updatedDoctorProfileFields, updatedAt: new Date() };
         // syncDoctorProfileUpdated calls persistDoctorProfiles internally
         syncDoctorProfileUpdated(dataStore.doctorProfilesStore[doctorProfileIndex]);
      }
    }
  }

  console.log(`[MOCK API] Successfully updated user profile for ${userId}`);
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
  const doctor = dataStore.usersStore.find(u => u.id === doctorId);
  const patient = dataStore.usersStore.find(u => u.id === patientId);
  const doctorProfile = dataStore.doctorProfilesStore.find(p => p.userId === doctorId);
  
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
  dataStore.appointmentsStore.push(newAppointment);
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
    dataStore.notificationsStore.push(doctorNotification);
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
    dataStore.notificationsStore.push(patientNotification);
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
  
  const appointmentIndex = dataStore.appointmentsStore.findIndex(a => a.id === appointmentId);
  if (appointmentIndex === -1) {
    return null;
  }
  
  const updatedAppointment = {
    ...dataStore.appointmentsStore[appointmentIndex],
    ...updates,
    updatedAt: new Date()
  };
  
  dataStore.appointmentsStore[appointmentIndex] = updatedAppointment;
  syncAppointmentUpdated(updatedAppointment);
  
  // Create notification for status update if applicable
  if (updates.status) {
    // Get user information from dataStore directly instead of calling mocks
    const doctor = dataStore.usersStore.find(u => u.id === updatedAppointment.doctorId);
    const patient = dataStore.usersStore.find(u => u.id === updatedAppointment.patientId);
    
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
      dataStore.notificationsStore.push(patientNotification);
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
  
  const appointmentIndex = dataStore.appointmentsStore.findIndex(a => a.id === appointmentId);
  if (appointmentIndex === -1) {
    return false;
  }
  
  const appointment = dataStore.appointmentsStore[appointmentIndex];
  const updatedAppointment = {
    ...appointment,
    status: cancelledBy === 'patient' ? AppointmentStatus.CANCELLED_BY_PATIENT : AppointmentStatus.CANCELLED_BY_DOCTOR,
    notes: cancelReason ? `${appointment.notes}\nCancellation reason: ${cancelReason}` : appointment.notes,
    updatedAt: new Date()
  };
  
  dataStore.appointmentsStore[appointmentIndex] = updatedAppointment;
  
  // Fix the issue with potentially undefined cancelReason parameter
  const reason = cancelReason || '';
  syncAppointmentCancelled(updatedAppointment.id!, reason);
  
  // Create notifications for both parties
  const doctor = dataStore.usersStore.find(u => u.id === appointment.doctorId);
  const patient = dataStore.usersStore.find(u => u.id === appointment.patientId);
  
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
    dataStore.notificationsStore.push(doctorNotification);
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
    dataStore.notificationsStore.push(patientNotification);
    syncNotificationAdded(patientNotification);
  }
  
  return true;
}

// Helper function to generate appropriate status change messages
function getStatusChangeMessage(status: AppointmentStatus, doctor: UserProfile | undefined | null): string {
  const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'your doctor';
  
  switch (status) {
    case AppointmentStatus.COMPLETED:
      return `Your appointment with ${doctorName} has been marked as completed.`;
    case AppointmentStatus.NO_SHOW:
      return `You missed your appointment with ${doctorName}. Please reschedule if needed.`;
    case AppointmentStatus.RESCHEDULED:
      return `Your appointment with ${doctorName} has been rescheduled.`;
    default:
      return `Your appointment status has been updated to ${status}.`;
  }
}

export async function mockSaveDoctorAvailability(
  doctorId: string,
  weeklySchedule: WeeklySchedule
): Promise<boolean> {
  logApiCall('mockSaveDoctorAvailability', { doctorId, weeklySchedule });
  
  try {
    // Validate input
    if (!doctorId) {
      console.error('Missing doctorId parameter');
      return false;
    }
    
    // Validate weekly schedule
    if (!isValidWeeklySchedule(weeklySchedule)) {
      console.error('Invalid weekly schedule format');
      return false;
    }
    
    // Simulate network delay
    await delay();
    
    const doctorProfileIndex = dataStore.doctorProfilesStore.findIndex(profile => profile.userId === doctorId);
    if (doctorProfileIndex === -1) {
      console.error(`Doctor profile not found for ID: ${doctorId}`);
      return false;
    }
    
    // Update the doctor's profile with the new weekly schedule
    const updatedProfile = {
      ...dataStore.doctorProfilesStore[doctorProfileIndex],
      weeklySchedule,
      updatedAt: new Date()
    };
    
    dataStore.doctorProfilesStore[doctorProfileIndex] = updatedProfile;
    syncDoctorProfileUpdated(updatedProfile);
    
    console.log(`Doctor availability updated for ${doctorId}:`, weeklySchedule);
    return true;
  } catch (error) {
    console.error(`Error saving doctor availability for ${doctorId}:`, error);
    return false;
  }
}

export async function mockLoadDoctorAvailability(doctorId: string): Promise<WeeklySchedule | null> {
  logApiCall('mockLoadDoctorAvailability', { doctorId });
  
  // Simulate network delay
  await delay();
  
  const doctorProfile = dataStore.doctorProfilesStore.find(profile => profile.userId === doctorId);
  if (!doctorProfile) {
    console.error(`Doctor profile not found for ID: ${doctorId}`);
    return null;
  }
  
  // Check if the doctor has mockAvailability data
  const mockAvailability = (doctorProfile as any).mockAvailability;
  if (mockAvailability && mockAvailability.slots && Array.isArray(mockAvailability.slots) && mockAvailability.slots.length > 0) {
    console.log(`Found mockAvailability data for doctor ${doctorId} with ${mockAvailability.slots.length} slots`);
    
    // Convert slots to WeeklySchedule format
    const weeklySchedule: WeeklySchedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };
    
    // Map day number to day name
    const dayMapping: Record<number, keyof WeeklySchedule> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };
    
    // Convert each slot to the appropriate day array
    mockAvailability.slots.forEach((slot: any) => {
      if (typeof slot.dayOfWeek === 'number' && slot.dayOfWeek >= 0 && slot.dayOfWeek <= 6) {
        const day = dayMapping[slot.dayOfWeek];
        weeklySchedule[day].push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable
        });
      }
    });
    
    console.log(`Converted availability data to weekly schedule format for doctor ${doctorId}`);
    return weeklySchedule;
  }
  
  // If no mockAvailability, return the weeklySchedule if it exists
  if (doctorProfile.weeklySchedule) {
    console.log(`Using existing weeklySchedule for doctor ${doctorId}`);
    return doctorProfile.weeklySchedule;
  }
  
  // Return an empty schedule if none exists
  console.log(`No availability data found for doctor ${doctorId}, returning empty schedule`);
  return {
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
  
  const doctorProfileIndex = dataStore.doctorProfilesStore.findIndex(profile => profile.userId === doctorId);
  if (doctorProfileIndex === -1) {
    console.error(`Doctor profile not found for ID: ${doctorId}`);
    return false;
  }
  
  // Get current blocked dates or initialize empty array
  const currentBlockedDates = dataStore.doctorProfilesStore[doctorProfileIndex].blockedDates || [];
  
  // Update the doctor's profile to add this date to blocked dates
  const updatedBlockedDates: Date[] = [
    ...currentBlockedDates,
    date
  ];
  
  const updatedProfile = {
    ...dataStore.doctorProfilesStore[doctorProfileIndex],
    blockedDates: updatedBlockedDates,
    updatedAt: new Date()
  };
  
  dataStore.doctorProfilesStore[doctorProfileIndex] = updatedProfile;
  
  // Sync blocked dates changes
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
  
  const doctorProfileIndex = dataStore.doctorProfilesStore.findIndex(profile => profile.userId === doctorId);
  if (doctorProfileIndex === -1) {
    console.error(`Doctor profile not found for ID: ${doctorId}`);
    return false;
  }
  
  const dateString = date.toISOString().split('T')[0];
  
  // Get current blocked dates or initialize empty array
  const currentBlockedDates = dataStore.doctorProfilesStore[doctorProfileIndex].blockedDates || [];
  
  // Update the doctor's profile to remove this date from blocked dates
  const updatedBlockedDates: Date[] = currentBlockedDates.filter(d => {
    const blockedDateString = d instanceof Date 
      ? d.toISOString().split('T')[0] 
      : (d as any).toDate?.().toISOString().split('T')[0] || '';
    
    return blockedDateString !== dateString;
  });
  
  const updatedProfile = {
    ...dataStore.doctorProfilesStore[doctorProfileIndex],
    blockedDates: updatedBlockedDates,
    updatedAt: new Date()
  };
  
  dataStore.doctorProfilesStore[doctorProfileIndex] = updatedProfile;
  
  // Sync blocked dates changes
  syncDoctorProfileUpdated(updatedProfile);
  
  console.log(`Date unblocked for doctor ${doctorId}:`, date);
  return true;
}

export async function mockGetDoctorBlockedDates(doctorId: string): Promise<Date[]> {
  logApiCall('mockGetDoctorBlockedDates', { doctorId });
  
  // Simulate network delay
  await delay();
  
  try {
    const doctorProfile = dataStore.doctorProfilesStore.find(profile => profile.userId === doctorId);
    if (!doctorProfile) {
      console.error(`Doctor profile not found for ID: ${doctorId}`);
      return [];
    }
    
    // Return blocked dates or empty array if none exist
    const blockedDates = doctorProfile.blockedDates || [];
    
    // Convert any Timestamp objects to Date objects
    return blockedDates.map(date => {
      if (date instanceof Date) {
        return date;
      }
      // Handle Firestore Timestamp objects
      if ((date as any).toDate) {
        return (date as any).toDate();
      }
      return new Date(date);
    });
  } catch (error) {
    console.error(`Error getting blocked dates for doctor ${doctorId}:`, error);
    return [];
  }
}

/**
 * Gets count of unread notifications for a user
 */
export const mockGetUnreadNotificationCount = async (userId: string): Promise<number> => {
  logInfo("[mockApiService] Getting unread notification count", { userId });
  
  // Simulate network delay
  await delay();
  
  try {
    const notifications = await mockGetNotifications(userId);
    return notifications.filter(notification => !notification.isRead).length;
  } catch (error) {
    logError("[mockApiService] Error getting unread notification count", { userId, error });
    throw error;
  }
};

export async function mockVerifyEmail(token: string): Promise<{ success: boolean; userId: string }> {
  logApiCall("mockVerifyEmail", { token });
  await simulateDelay();
  const users = dataStore.usersStore;
  const user = users.find(u => u.id === token);
  if (!user) throw new Error("invalid-token");
  user.emailVerified = true;
  user.updatedAt = new Date();
  syncUserUpdated(token);
  persistAllData();
  return { success: true, userId: token };
}

/**
 * Fetch all users from in-memory store (reflects localStorage)
 */
export async function mockGetAllUsers(): Promise<UserProfile[]> {
  return dataStore.usersStore;
}

/**
 * Fetch all appointments from in-memory store
 */
export async function mockGetAllAppointments(): Promise<Appointment[]> {
  return dataStore.appointmentsStore;
}

// Doctor Verification API Exports
export function mockGetDoctorVerifications() {
  try {
    console.log('[mockApiService] Getting doctor verifications');
    
    // First try to get from localStorage
    const storedVerifications = localStorage.getItem('health_app_data_doctor_verifications');
    if (storedVerifications) {
      console.log('[mockApiService] Found stored doctor verifications in localStorage');
      return JSON.parse(storedVerifications);
    }
    
    // If not in localStorage, generate from doctor profiles
    console.log('[mockApiService] Generating doctor verifications from profiles');
    const doctorProfiles = dataStore.doctorProfilesStore;
    const users = dataStore.usersStore;
    
    const verifications = doctorProfiles.map(profile => {
      const user = users.find(u => u.id === profile.userId);
      return {
        id: profile.userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown Doctor',
        status: profile.verificationStatus || VerificationStatus.PENDING,
        dateSubmitted: profile.verificationData?.submissionDate || profile.updatedAt || new Date(),
        specialty: profile.specialty || 'General',
        experience: profile.yearsOfExperience || 0,
        location: profile.location || ''
      };
    });
    
    // Save for future use
    localStorage.setItem('health_app_data_doctor_verifications', JSON.stringify(verifications));
    persistDoctorProfiles();
    
    console.log(`[mockApiService] Returning ${verifications.length} doctor verifications`);
    return verifications;
  } catch (error) {
    console.error('[mockApiService] Error getting doctor verifications:', error);
    return [];
  }
}

export function mockGetDoctorVerificationDetails(doctorId: string) {
  try {
    console.log(`[mockApiService] Getting verification details for doctor: ${doctorId}`);
    
    if (!doctorId) {
      console.error('[mockApiService] No doctorId provided to mockGetDoctorVerificationDetails');
      return null;
    }
    
    // Debug stores before retrieval
    console.log('[mockApiService] LocalStorage doctor profiles key:', localStorage.getItem(STORAGE_KEYS.DOCTOR_PROFILES));
    console.log('[mockApiService] In-memory doctorProfiles store:', dataStore.doctorProfilesStore);
    
    const doctorProfiles = dataStore.doctorProfilesStore;
    console.log(`[mockApiService] doctorProfiles count: ${doctorProfiles.length}`);
    const users = dataStore.usersStore;
    console.log(`[mockApiService] users count: ${users.length}`);
    
    const profile = doctorProfiles.find(p => p.userId === doctorId);
    console.log('[mockApiService] Retrieved profile object:', profile);
    if (!profile) {
      console.error(`[mockApiService] Doctor profile not found for ID: ${doctorId}`);
      return null;
    }
    
    const user = users.find(u => u.id === doctorId);
    console.log('[mockApiService] Retrieved user object:', user);
    if (!user) {
      console.error(`[mockApiService] User not found for doctor ID: ${doctorId}`);
      // If user not found, we cannot provide complete details
      const basicSubmissionData = {
        specialty: profile.specialty || 'General',
        experience: profile.yearsOfExperience || 0,
        education: profile.education || [],
        licenseNumber: profile.licenseNumber || '',
        location: profile.location || '',
        bio: profile.bio || '',
        languages: profile.languages || [],
        fee: profile.consultationFee || 0
      };
      return {
        id: doctorId,
        name: 'Doctor Profile (User Missing)',
        status: profile.verificationStatus || VerificationStatus.PENDING,
        verificationNotes: profile.verificationNotes || '',
        dateSubmitted: profile.verificationData?.submissionDate || profile.updatedAt || new Date(),
        submissionData: basicSubmissionData
      };
    }
    
    console.log(`[mockApiService] Found verification details for ${user.firstName} ${user.lastName}`);
    
    return {
      id: doctorId,
      name: `${user.firstName} ${user.lastName}`,
      status: profile.verificationStatus || VerificationStatus.PENDING,
      verificationNotes: profile.verificationNotes || '',
      dateSubmitted: profile.verificationData?.submissionDate || profile.updatedAt || new Date(),
      submissionData: {
        specialty: profile.specialty || 'General',
        experience: profile.yearsOfExperience || 0,
        education: profile.education || [],
        licenseNumber: profile.licenseNumber || '',
        location: profile.location || '',
        bio: profile.bio || '',
        languages: profile.languages || [],
        fee: profile.consultationFee || 0,
        contactEmail: user.email, // Use email from user object
        contactPhone: user.phone || '', // Use phone from user object
        documents: profile.verificationData?.documents || [
          { id: '1', name: 'Medical License', url: '/mock/license.pdf' },
          { id: '2', name: 'Board Certification', url: '/mock/certification.pdf' }
        ]
      }
    };
  } catch (error) {
    console.error(`[mockApiService] Error getting doctor verification details for ${doctorId}:`, error);
    return null;
  }
}

export function mockSetDoctorVerificationStatus(doctorId: string, status: VerificationStatus, notes?: string) {
  try {
    console.log(`[mockApiService] Setting verification status for doctor ${doctorId} to ${status}`);
    
    if (!doctorId) {
      console.error('[mockApiService] No doctorId provided to mockSetDoctorVerificationStatus');
      return false;
    }
    
    const doctorProfilesStore = dataStore.doctorProfilesStore;
    const profileIndex = doctorProfilesStore.findIndex(p => p.userId === doctorId);
    
    if (profileIndex === -1) {
      console.error(`[mockApiService] Doctor profile not found for ID: ${doctorId}`);
      return false; // Doctor profile must exist
    }
    
    // Check if status is actually changing
    if (doctorProfilesStore[profileIndex].verificationStatus === status && (notes === undefined || doctorProfilesStore[profileIndex].verificationNotes === notes)) {
        console.log(`[mockApiService] Verification status for ${doctorId} already set to ${status}. No update needed.`);
        return true; // No change, but operation is successful
    }

    // Update the doctor profile directly in the array
    doctorProfilesStore[profileIndex].verificationStatus = status;
    if (notes !== undefined) {
      doctorProfilesStore[profileIndex].verificationNotes = notes;
    }
    doctorProfilesStore[profileIndex].updatedAt = new Date(); // Update timestamp

    // Trigger sync/persistence for the updated profile
    // syncDoctorProfileUpdated calls persistDoctorProfiles internally
    syncDoctorProfileUpdated(doctorProfilesStore[profileIndex]);

    console.log(`[mockApiService] Successfully updated verification status for doctor ${doctorId}`);
    return true;
  } catch (error) {
    console.error(`[mockApiService] Error setting doctor verification status for ${doctorId}:`, error);
    return false;
  }
}

/**
 * System Logs API Export
 */
export async function mockGetSystemLogs(): Promise<{ id: string; timestamp: string; level: string; message: string; user?: string; context?: string }[]> {
  await simulateDelay();
  return []; // stub: no logs
}

/**
 * STUBS for missing sync* functions to prevent reference errors
 */
function syncAppointmentCancelled(..._args: any[]) {}
function syncAppointmentUpdated(..._args: any[]) {}
function syncAppointmentCreated(..._args: any[]) {}
function syncNotificationAdded(..._args: any[]) {}
function syncNotificationUpdated(..._args: any[]) {}

/**
 * Utility function to directly approve a doctor by email
 * This is a helper for development/testing
 */
export function mockApproveDoctor(email: string): boolean {
  try {
    console.log(`[mockApiService] Directly approving doctor with email: ${email}`);
    
    // Find the user with this email
    const user = dataStore.usersStore.find(u => u.email === email);
    if (!user) {
      console.error(`[mockApiService] No user found with email: ${email}`);
      return false;
    }
    
    // Make sure it's a doctor
    if (user.userType !== UserType.DOCTOR) {
      console.error(`[mockApiService] User with email ${email} is not a doctor`);
      return false;
    }
    
    // Find the doctor profile
    const doctorIndex = dataStore.doctorProfilesStore.findIndex(d => d.userId === user.id);
    if (doctorIndex === -1) {
      console.error(`[mockApiService] No doctor profile found for user ID: ${user.id}`);
      return false;
    }
    
    // Directly update verification status to APPROVED
    dataStore.doctorProfilesStore[doctorIndex].verificationStatus = VerificationStatus.APPROVED;
    
    // Persist changes
    persistDoctorProfiles();
    persistAllData();
    
    console.log(`[mockApiService] Successfully approved doctor with email: ${email}`);
    return true;
  } catch (error) {
    console.error(`[mockApiService] Error approving doctor: ${error}`);
    return false;
  }
}
