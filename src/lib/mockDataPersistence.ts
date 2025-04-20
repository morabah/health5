/**
 * Mock Data Persistence Module
 * 
 * This module provides utilities for persisting mock data changes across browser windows
 * using localStorage and BroadcastChannel API.
 */
import * as dataStore from "@/data/mockDataStore";
import { v4 as uuidv4 } from "uuid";
import { logInfo } from "@/lib/logger";
import { AppointmentStatus, UserType, VerificationStatus } from "@/types/enums";
import type { UserProfile } from "@/types/user";
import type { DoctorProfile } from "@/types/doctor";
import type { PatientProfile } from "@/types/patient";
import type { Appointment } from "@/types/appointment";
import type { Notification } from "@/types/notification";

// Storage keys for localStorage
export const STORAGE_KEYS = {
  USERS: 'health_app_data_users',
  DOCTOR_PROFILES: 'health_app_data_doctor_profiles',
  PATIENT_PROFILES: 'health_app_data_patient_profiles',
  APPOINTMENTS: 'health_app_data_appointments',
  NOTIFICATIONS: 'health_app_data_notifications'
};

// Unique channel name for broadcasts
const CHANNEL_NAME = 'health-appointment-system-data-sync';

// Event types
export enum SyncEventType {
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_UPDATED = 'appointment_updated',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  DOCTOR_PROFILE_UPDATED = 'doctor_profile_updated',
  PATIENT_PROFILE_UPDATED = 'patient_profile_updated',
  NOTIFICATION_ADDED = 'notification_added',
  NOTIFICATION_MARKED_READ = 'notification_marked_read',
  AVAILABILITY_UPDATED = 'availability_updated',
  USER_ADDED = 'user_added',
  USER_UPDATED = 'user_updated',
  USER_DEACTIVATED = 'user_deactivated',
  NOTIFICATION_UPDATED = 'notification_updated',
}

// Interface for sync events
interface SyncEvent {
  type: SyncEventType;
  timestamp: number;
  payload: any;
  sourceId: string;
}

// Create a unique ID for this browser tab
const TAB_ID = uuidv4();

// BroadcastChannel for cross-tab communication
let broadcastChannel: BroadcastChannel | null = null;

/**
 * Initialize the data persistence mechanism
 */
export function initDataPersistence(): void {
  if (typeof window === 'undefined') return;

  logInfo('[mockDataPersistence] Initializing data persistence');
  
  try {
    // Initialize broadcast channel
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        if (event.data) {
          handleSyncEvent(event.data);
        }
      };
      logInfo('[mockDataPersistence] BroadcastChannel initialized');
    } else {
      logInfo('[mockDataPersistence] BroadcastChannel not supported in this browser');
    }
    
    // Load persisted user data
    loadUsers();
    loadDoctorProfiles();
    loadPatientProfiles();
    
    // Load other persisted data
    loadAppointments();
    loadNotifications();
    
    // Set up listener for sync events across tabs
    window.addEventListener('storage', handleStorageChange);
    
    // Set up a timer to automatically save all data every 30 seconds
    const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
    setInterval(persistAllData, AUTO_SAVE_INTERVAL);
    logInfo('[mockDataPersistence] Auto-save timer set up');
    
    logInfo('[mockDataPersistence] Data persistence initialized successfully');
  } catch (error) {
    console.error('[mockDataPersistence] Error initializing data persistence:', error);
  }
}

/**
 * Clean up resources when the component is unmounted
 */
export function cleanupDataPersistence() {
  if (broadcastChannel) {
    broadcastChannel.close();
    broadcastChannel = null;
  }
}

/**
 * Load persisted data from localStorage
 */
export function loadUsers(): void {
  try {
    const persistedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (persistedUsers) {
      const parsedUsers = JSON.parse(persistedUsers) as UserProfile[];
      if (parsedUsers.length > 0) {
        // Use only persisted users as source of truth
        dataStore.usersStore.length = 0;
        parsedUsers.forEach(user => dataStore.usersStore.push(user));
        logInfo(`[mockDataPersistence] Loaded ${parsedUsers.length} persisted users`);
      }
    }
  } catch (error) {
    console.error('[mockDataPersistence] Error loading persisted users:', error);
  }
}

export function loadDoctorProfiles(): void {
  try {
    const persistedProfiles = localStorage.getItem(STORAGE_KEYS.DOCTOR_PROFILES);
    if (persistedProfiles) {
      const parsedProfiles = JSON.parse(persistedProfiles) as DoctorProfile[];
      // Only replace the store if we have data
      if (parsedProfiles.length > 0) {
        // Clear the current store
        dataStore.doctorProfilesStore.length = 0;
        // Add all persisted profiles
        parsedProfiles.forEach(profile => {
          // Make sure any mockAvailability property is properly maintained
          const profileWithAvailability = { 
            ...profile,
            // Ensure mockAvailability is properly typed as any
            mockAvailability: (profile as any).mockAvailability || undefined
          };
          dataStore.doctorProfilesStore.push(profileWithAvailability);
        });
        logInfo(`[mockDataPersistence] Loaded ${parsedProfiles.length} persisted doctor profiles`);
      }
    }
  } catch (error) {
    console.error('[mockDataPersistence] Error loading persisted doctor profiles:', error);
  }
}

export function loadPatientProfiles(): void {
  try {
    const persistedProfiles = localStorage.getItem(STORAGE_KEYS.PATIENT_PROFILES);
    if (persistedProfiles) {
      const parsedProfiles = JSON.parse(persistedProfiles) as PatientProfile[];
      // Only replace the store if we have data
      if (parsedProfiles.length > 0) {
        // Clear the current store
        dataStore.patientProfilesStore.length = 0;
        // Add all persisted profiles
        parsedProfiles.forEach(profile => dataStore.patientProfilesStore.push(profile));
        logInfo(`[mockDataPersistence] Loaded ${parsedProfiles.length} persisted patient profiles`);
      }
    }
  } catch (error) {
    console.error('[mockDataPersistence] Error loading persisted patient profiles:', error);
  }
}

/**
 * Load persisted appointments from localStorage
 */
export function loadAppointments(): void {
  try {
    const persistedAppointments = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (persistedAppointments) {
      const parsedAppointments = JSON.parse(persistedAppointments) as Appointment[];
      // Only replace the store if we have data
      if (parsedAppointments.length > 0) {
        // Clear the current store
        dataStore.appointmentsStore.length = 0;
        // Add all persisted appointments
        parsedAppointments.forEach(appointment => dataStore.appointmentsStore.push(appointment));
        logInfo(`[mockDataPersistence] Loaded ${parsedAppointments.length} persisted appointments`);
      }
    }
  } catch (error) {
    console.error('[mockDataPersistence] Error loading persisted appointments:', error);
  }
}

/**
 * Load persisted notifications from localStorage
 */
export function loadNotifications(): void {
  try {
    const persistedNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (persistedNotifications) {
      const parsedNotifications = JSON.parse(persistedNotifications) as Notification[];
      // Only replace the store if we have data
      if (parsedNotifications.length > 0) {
        // Clear the current store
        dataStore.notificationsStore.length = 0;
        // Add all persisted notifications
        parsedNotifications.forEach(notification => dataStore.notificationsStore.push(notification));
        logInfo(`[mockDataPersistence] Loaded ${parsedNotifications.length} persisted notifications`);
      }
    }
  } catch (error) {
    console.error('[mockDataPersistence] Error loading persisted notifications:', error);
  }
}

/**
 * Handle the storage event from another tab
 */
function handleStorageChange(event: StorageEvent): void {
  // Skip if we don't care about this key or if it's empty
  if (!event.key || !event.newValue) {
    return;
  }
  
  // Check if this is a sync event (keys starting with 'health_app_data_event_')
  if (event.key.startsWith('health_app_data_event_')) {
    try {
      const syncEvent = JSON.parse(event.newValue) as SyncEvent;
      handleSyncEvent(syncEvent);
    } catch (error) {
      console.error('[mockDataPersistence] Error handling storage event:', error);
    }
    return;
  }
  
  // Otherwise, it might be direct data updates
  switch(event.key) {
    case STORAGE_KEYS.USERS:
      loadUsers();
      break;
    case STORAGE_KEYS.DOCTOR_PROFILES:
      loadDoctorProfiles();
      break;
    case STORAGE_KEYS.PATIENT_PROFILES:
      loadPatientProfiles();
      break;
    case STORAGE_KEYS.APPOINTMENTS:
      loadAppointments();
      break;
    case STORAGE_KEYS.NOTIFICATIONS:
      loadNotifications();
      break;
  }
}

/**
 * Handle a sync event from another tab
 */
function handleSyncEvent(event: SyncEvent) {
  if (!event || !event.type || !event.payload) {
    return;
  }
  
  // Skip events from this tab
  if (event.sourceId === TAB_ID) {
    return;
  }
  
  logInfo("[mockDataPersistence] Received sync event", { type: event.type });
  
  switch (event.type) {
    case SyncEventType.APPOINTMENT_CREATED:
      handleAppointmentCreated(event.payload);
      break;
    case SyncEventType.APPOINTMENT_UPDATED:
      handleAppointmentUpdated(event.payload);
      break;
    case SyncEventType.APPOINTMENT_CANCELLED:
      handleAppointmentCancelled(event.payload);
      break;
    case SyncEventType.NOTIFICATION_ADDED:
      handleNotificationAdded(event.payload);
      break;
    case SyncEventType.NOTIFICATION_MARKED_READ:
      handleNotificationMarkedRead(event.payload);
      break;
    case SyncEventType.USER_ADDED:
      handleUserAdded(event.payload);
      break;
    case SyncEventType.USER_UPDATED:
      handleUserUpdated(event.payload);
      break;
    case SyncEventType.USER_DEACTIVATED:
      handleUserDeactivated(event.payload);
      break;
    case SyncEventType.NOTIFICATION_UPDATED:
      handleNotificationUpdated(event.payload);
      break;
    case SyncEventType.DOCTOR_PROFILE_UPDATED:
      handleDoctorProfileUpdated(event.payload);
      break;
    case SyncEventType.PATIENT_PROFILE_UPDATED:
      handlePatientProfileUpdated(event.payload);
      break;
    case SyncEventType.AVAILABILITY_UPDATED:
      handleAvailabilityUpdated(event.payload);
      break;
    // Add more cases as needed
  }
}

/**
 * Create a sync event and broadcast it
 */
function createAndBroadcastEvent(type: SyncEventType, payload: any) {
  const event: SyncEvent = {
    type,
    timestamp: Date.now(),
    payload,
    sourceId: TAB_ID
  };
  
  // Broadcast via BroadcastChannel
  if (broadcastChannel) {
    broadcastChannel.postMessage(event);
  }
  
  // Also use localStorage for browsers without BroadcastChannel
  try {
    const key = `health_app_data_event_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(event));
    
    // Remove after a short delay to avoid cluttering localStorage
    setTimeout(() => {
      localStorage.removeItem(key);
    }, 5000);
  } catch (error) {
    console.error("[mockDataPersistence] Error broadcasting event via localStorage:", error);
  }
}

/**
 * Persist users to localStorage
 */
export function persistUsers() {
  try {
    const users = dataStore.getUsersStore();
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    logInfo("[mockDataPersistence] Persisted users", { count: users.length });
  } catch (error) {
    console.error("[mockDataPersistence] Error persisting users:", error);
  }
}

/**
 * Persist doctor profiles to localStorage
 */
export function persistDoctorProfiles() {
  try {
    console.log('[mockDataPersistence] Persisting doctor profiles to localStorage');
    
    // Get a deep copy of the doctor profiles (to avoid modifying the original)
    const profilesToSave = JSON.parse(JSON.stringify(dataStore.getDoctorProfilesStore()));
    
    // Log some info about the profiles to persist
    console.log(`[mockDataPersistence] Persisting ${profilesToSave.length} doctor profiles`);
    if (profilesToSave.length > 0) {
      console.log('[mockDataPersistence] Doctor IDs being persisted:', 
        profilesToSave.map((p: any) => p.userId));
    }
    
    // Ensure verificationStatus is included
    profilesToSave.forEach((profile: any) => {
      if (!profile.verificationStatus) {
        profile.verificationStatus = VerificationStatus.PENDING;
      }
    });
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.DOCTOR_PROFILES, JSON.stringify(profilesToSave));
    
    // Also save to doctor verifications key
    try {
      const verifications = profilesToSave.map((profile: any) => {
        const user = dataStore.getUsersStore().find(u => u.id === profile.userId);
        return {
          id: profile.userId,
          name: user ? `${user.firstName} ${user.lastName}` : undefined,
          status: profile.verificationStatus,
          dateSubmitted: profile.verificationData?.submissionDate ?? profile.updatedAt ?? new Date(),
          specialty: profile.specialty,
          experience: profile.yearsOfExperience,
          location: profile.location || ''
        };
      });
      
      localStorage.setItem('health_app_data_doctor_verifications', JSON.stringify(verifications));
      console.log(`[mockDataPersistence] Persisted ${verifications.length} doctor verifications`);
    } catch (error) {
      console.error('[mockDataPersistence] Error persisting doctor verifications:', error);
    }
    
    return true;
  } catch (error) {
    console.error('[mockDataPersistence] Error persisting doctor profiles:', error);
    return false;
  }
}

/**
 * Persist patient profiles to localStorage
 */
export function persistPatientProfiles() {
  try {
    const profiles = dataStore.getPatientProfilesStore();
    localStorage.setItem(STORAGE_KEYS.PATIENT_PROFILES, JSON.stringify(profiles));
    logInfo("[mockDataPersistence] Persisted patient profiles", { count: profiles.length });
  } catch (error) {
    console.error("[mockDataPersistence] Error persisting patient profiles:", error);
  }
}

/**
 * Persist current appointments to localStorage
 */
export function persistAppointments() {
  try {
    const appointments = dataStore.getAppointmentsStore();
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    logInfo("[mockDataPersistence] Persisted appointments", { count: appointments.length });
  } catch (error) {
    console.error("[mockDataPersistence] Error persisting appointments:", error);
  }
}

/**
 * Persist current notifications to localStorage
 */
export function persistNotifications() {
  try {
    const notifications = dataStore.getNotificationsStore();
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    logInfo("[mockDataPersistence] Persisted notifications", { count: notifications.length });
  } catch (error) {
    console.error("[mockDataPersistence] Error persisting notifications:", error);
  }
}

/**
 * Persist all data to localStorage at once
 */
export function persistAllData() {
  logInfo("[mockDataPersistence] Starting persistAllData");
  console.log("[mockDataPersistence] persistAllData invoked");
  try {
    persistUsers();
    persistDoctorProfiles();
    persistPatientProfiles();
    persistAppointments();
    persistNotifications();
    logInfo("[mockDataPersistence] All data persisted to localStorage");
  } catch (error) {
    console.error("[mockDataPersistence] Error persisting all data:", error);
  }
}

/**
 * Sync a user addition across tabs
 */
export function syncUserAdded(user: any, profile?: any) {
  createAndBroadcastEvent(SyncEventType.USER_ADDED, { user, profile });
  persistUsers();
  
  if (profile) {
    if (user.userType === UserType.DOCTOR) {
      persistDoctorProfiles();
    } else if (user.userType === UserType.PATIENT) {
      persistPatientProfiles();
    }
  }
}

/**
 * Sync a user update across tabs
 */
export function syncUserUpdated(user: any, profile?: any) {
  createAndBroadcastEvent(SyncEventType.USER_UPDATED, { user, profile });
  persistUsers();
  
  if (profile) {
    if (user.userType === UserType.DOCTOR) {
      persistDoctorProfiles();
    } else if (user.userType === UserType.PATIENT) {
      persistPatientProfiles();
    }
  }
}

/**
 * Sync a doctor profile update across tabs
 */
export function syncDoctorProfileUpdated(profile: any) {
  createAndBroadcastEvent(SyncEventType.DOCTOR_PROFILE_UPDATED, profile);
  persistDoctorProfiles();
}

/**
 * Sync doctor availability changes across tabs
 */
export function syncAvailabilityUpdated(doctorId: string, data: { weeklySchedule?: any, blockedDates?: string[] }) {
  createAndBroadcastEvent(SyncEventType.AVAILABILITY_UPDATED, { doctorId, ...data });
  persistDoctorProfiles();
}

/**
 * Sync doctor blocked dates changes across tabs
 */
export function syncDoctorBlockedDates(doctorId: string, blockedDates: string[] | Date[]) {
  createAndBroadcastEvent(SyncEventType.AVAILABILITY_UPDATED, { 
    doctorId, 
    blockedDates
  });
  persistDoctorProfiles();
}

/**
 * Sync a user deactivation across tabs
 */
export function syncUserDeactivated(userId: string, isActive: boolean) {
  createAndBroadcastEvent(SyncEventType.USER_DEACTIVATED, { userId, isActive });
  persistUsers();
}

/**
 * Sync an appointment creation across tabs
 */
export function syncAppointmentCreated(appointment: any) {
  createAndBroadcastEvent(SyncEventType.APPOINTMENT_CREATED, appointment);
  persistAppointments();
}

/**
 * Sync an appointment update across tabs
 */
export function syncAppointmentUpdated(appointment: any) {
  createAndBroadcastEvent(SyncEventType.APPOINTMENT_UPDATED, appointment);
  persistAppointments();
}

/**
 * Sync an appointment cancellation across tabs
 */
export function syncAppointmentCancelled(appointmentId: string, reason?: string) {
  const payload = { appointmentId, reason: reason || '' };
  createAndBroadcastEvent(SyncEventType.APPOINTMENT_CANCELLED, payload);
  persistAppointments();
}

/**
 * Sync a notification addition across tabs
 */
export function syncNotificationAdded(notification: any) {
  createAndBroadcastEvent(SyncEventType.NOTIFICATION_ADDED, notification);
  persistNotifications();
}

/**
 * Sync marking a notification as read across tabs
 */
export function syncNotificationMarkedRead(notificationId: string, userId: string) {
  createAndBroadcastEvent(SyncEventType.NOTIFICATION_MARKED_READ, { notificationId, userId });
  persistNotifications();
}

/**
 * Sync a notification update across tabs
 */
export function syncNotificationUpdated(notification: any) {
  createAndBroadcastEvent(SyncEventType.NOTIFICATION_UPDATED, notification);
  persistNotifications();
}

/**
 * Handle a user addition event from another tab
 */
function handleUserAdded(data: { user: any, profile?: any }) {
  if (!data.user || !data.user.id) return;
  
  // Check if user already exists
  const existingIndex = dataStore.usersStore.findIndex(u => u.id === data.user.id);
  if (existingIndex >= 0) {
    // If it exists, just update it
    dataStore.usersStore[existingIndex] = data.user;
  } else {
    // Otherwise add it
    dataStore.usersStore.push(data.user);
  }
  
  // Handle profile if present
  if (data.profile) {
    if (data.user.userType === UserType.DOCTOR) {
      const existingProfileIndex = dataStore.doctorProfilesStore.findIndex(p => p.userId === data.user.id);
      if (existingProfileIndex >= 0) {
        dataStore.doctorProfilesStore[existingProfileIndex] = data.profile;
      } else {
        dataStore.doctorProfilesStore.push(data.profile);
      }
    } else if (data.user.userType === UserType.PATIENT) {
      const existingProfileIndex = dataStore.patientProfilesStore.findIndex(p => p.userId === data.user.id);
      if (existingProfileIndex >= 0) {
        dataStore.patientProfilesStore[existingProfileIndex] = data.profile;
      } else {
        dataStore.patientProfilesStore.push(data.profile);
      }
    }
  }
}

/**
 * Handle a user update event from another tab
 */
function handleUserUpdated(data: { user: any, profile?: any }) {
  if (!data.user || !data.user.id) return;
  
  // Find and update the user
  const userIndex = dataStore.usersStore.findIndex(u => u.id === data.user.id);
  if (userIndex >= 0) {
    dataStore.usersStore[userIndex] = {
      ...dataStore.usersStore[userIndex],
      ...data.user
    };
  }
  
  // Handle profile if present
  if (data.profile) {
    if (data.user.userType === UserType.DOCTOR) {
      const profileIndex = dataStore.doctorProfilesStore.findIndex(p => p.userId === data.user.id);
      if (profileIndex >= 0) {
        dataStore.doctorProfilesStore[profileIndex] = {
          ...dataStore.doctorProfilesStore[profileIndex],
          ...data.profile
        };
      }
    } else if (data.user.userType === UserType.PATIENT) {
      const profileIndex = dataStore.patientProfilesStore.findIndex(p => p.userId === data.user.id);
      if (profileIndex >= 0) {
        dataStore.patientProfilesStore[profileIndex] = {
          ...dataStore.patientProfilesStore[profileIndex],
          ...data.profile
        };
      }
    }
  }
}

/**
 * Handle a user deactivation event from another tab
 */
function handleUserDeactivated(data: { userId: string, isActive: boolean }) {
  if (!data.userId) return;
  
  // Find and update the user's active status
  const userIndex = dataStore.usersStore.findIndex(u => u.id === data.userId);
  if (userIndex >= 0) {
    dataStore.usersStore[userIndex].isActive = data.isActive;
  }
}

/**
 * Handle an appointment creation event from another tab
 */
function handleAppointmentCreated(appointment: any) {
  if (!appointment || !appointment.id) return;
  
  // Check if the appointment already exists to avoid duplicates
  const exists = dataStore.appointmentsStore.some(a => a.id === appointment.id);
  if (!exists) {
    dataStore.appointmentsStore.push(appointment);
  }
}

/**
 * Handle an appointment update event from another tab
 */
function handleAppointmentUpdated(appointment: any) {
  if (!appointment || !appointment.id) return;
  
  // Find and update the appointment
  const index = dataStore.appointmentsStore.findIndex(a => a.id === appointment.id);
  if (index !== -1) {
    dataStore.appointmentsStore[index] = appointment;
  }
}

/**
 * Handle an appointment cancellation event from another tab
 */
function handleAppointmentCancelled(data: { appointmentId: string, reason?: string }) {
  if (!data.appointmentId) return;
  
  // Find and update the appointment status
  const index = dataStore.appointmentsStore.findIndex(a => a.id === data.appointmentId);
  if (index !== -1) {
    dataStore.appointmentsStore[index].status = AppointmentStatus.CANCELLED;
    if (data.reason) {
      dataStore.appointmentsStore[index].notes = data.reason;
    }
  }
}

/**
 * Handle a notification addition event from another tab
 */
function handleNotificationAdded(notification: any) {
  if (!notification || !notification.id) return;
  
  // Check if the notification already exists
  const exists = dataStore.notificationsStore.some(n => n.id === notification.id);
  if (!exists) {
    dataStore.notificationsStore.push(notification);
  }
}

/**
 * Handle a notification marked read event from another tab
 */
function handleNotificationMarkedRead(data: { notificationId: string, userId: string }) {
  if (!data.notificationId || !data.userId) return;
  
  // Find and update the notification read status
  const notification = dataStore.notificationsStore.find(
    n => n.id === data.notificationId && n.userId === data.userId
  );
  
  if (notification) {
    notification.isRead = true;
  }
}

/**
 * Handle a notification update event from another tab
 */
function handleNotificationUpdated(notification: any) {
  if (!notification || !notification.id) return;
  
  // Find and update the notification
  const index = dataStore.notificationsStore.findIndex(n => n.id === notification.id);
  if (index !== -1) {
    dataStore.notificationsStore[index] = notification;
  }
}

/**
 * Handle a doctor profile update event from another tab
 */
function handleDoctorProfileUpdated(profile: any) {
  if (!profile || !profile.userId) return;
  
  // Find and update the doctor profile
  const profileIndex = dataStore.doctorProfilesStore.findIndex(p => p.userId === profile.userId);
  if (profileIndex !== -1) {
    dataStore.doctorProfilesStore[profileIndex] = {
      ...dataStore.doctorProfilesStore[profileIndex],
      ...profile
    };
  }
}

/**
 * Handle a patient profile update event from another tab
 */
function handlePatientProfileUpdated(profile: any) {
  if (!profile || !profile.userId) return;
  
  // Find and update the patient profile
  const profileIndex = dataStore.patientProfilesStore.findIndex(p => p.userId === profile.userId);
  if (profileIndex !== -1) {
    dataStore.patientProfilesStore[profileIndex] = {
      ...dataStore.patientProfilesStore[profileIndex],
      ...profile
    };
  }
}

/**
 * Handle an availability update event from another tab
 */
function handleAvailabilityUpdated(data: { doctorId: string, weeklySchedule?: any, blockedDates?: string[] }) {
  if (!data || !data.doctorId) return;
  
  // Find the doctor profile
  const profileIndex = dataStore.doctorProfilesStore.findIndex(p => p.userId === data.doctorId);
  if (profileIndex !== -1) {
    // Ensure the mockAvailability property exists
    if (!dataStore.doctorProfilesStore[profileIndex].mockAvailability) {
      dataStore.doctorProfilesStore[profileIndex].mockAvailability = {
        slots: [],
        blockedDates: []
      };
    }
    
    // Update slots if weeklySchedule is provided
    if (data.weeklySchedule) {
      dataStore.doctorProfilesStore[profileIndex].mockAvailability.slots = data.weeklySchedule;
    }
    
    // Update blocked dates if provided
    if (data.blockedDates) {
      dataStore.doctorProfilesStore[profileIndex].mockAvailability.blockedDates = data.blockedDates;
    }
    
    // Update the timestamps
    dataStore.doctorProfilesStore[profileIndex].updatedAt = new Date();
    
    console.log(`[mockDataPersistence] Updated availability for doctor ${data.doctorId}`, {
      slots: dataStore.doctorProfilesStore[profileIndex].mockAvailability.slots.length,
      blockedDates: dataStore.doctorProfilesStore[profileIndex].mockAvailability.blockedDates.length
    });
  } else {
    console.error(`[mockDataPersistence] Doctor profile not found for ID: ${data.doctorId}`);
  }
}

/**
 * Sync a patient profile update across tabs
 */
export function syncPatientProfileUpdated(profile: any) {
  createAndBroadcastEvent(SyncEventType.PATIENT_PROFILE_UPDATED, profile);
  persistPatientProfiles();
} 