/**
 * Mock Data Persistence Module
 * 
 * This module provides utilities for persisting mock data changes across browser windows
 * using localStorage and BroadcastChannel API.
 */
import * as dataStore from "@/data/mockDataStore";
import { v4 as uuidv4 } from "uuid";
import { logInfo } from "@/lib/logger";
import { AppointmentStatus } from "@/types/enums";

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
export function initDataPersistence() {
  if (typeof window === 'undefined') {
    return; // Skip on server-side
  }

  try {
    // Create a broadcast channel
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    
    // Listen for events from other tabs
    broadcastChannel.onmessage = (event: MessageEvent<SyncEvent>) => {
      handleSyncEvent(event.data);
    };
    
    // Load persisted data on startup
    loadPersistedData();
    
    logInfo("[mockDataPersistence] Initialized data persistence with tab ID", { tabId: TAB_ID });
  } catch (error) {
    console.error("[mockDataPersistence] Error initializing persistence:", error);
  }
  
  // Reload when storage changes (fallback for browsers without BroadcastChannel)
  window.addEventListener('storage', (event) => {
    if (event.key?.startsWith('health_app_data_')) {
      try {
        const data = JSON.parse(event.newValue || '{}');
        handleSyncEvent(data);
      } catch (error) {
        console.error("[mockDataPersistence] Error handling storage event:", error);
      }
    }
  });
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
function loadPersistedData() {
  try {
    // Load appointments
    const appointmentsJson = localStorage.getItem('health_app_data_appointments');
    if (appointmentsJson) {
      const appointments = JSON.parse(appointmentsJson);
      if (Array.isArray(appointments) && appointments.length > 0) {
        // Clear existing appointments and add stored ones
        dataStore.appointmentsStore.splice(0, dataStore.appointmentsStore.length, ...appointments);
        logInfo("[mockDataPersistence] Loaded persisted appointments", { count: appointments.length });
      }
    }
    
    // Load notifications
    const notificationsJson = localStorage.getItem('health_app_data_notifications');
    if (notificationsJson) {
      const notifications = JSON.parse(notificationsJson);
      if (Array.isArray(notifications) && notifications.length > 0) {
        // Only add notifications that don't already exist
        const existingIds = new Set(dataStore.notificationsStore.map(n => n.id));
        const newNotifications = notifications.filter(n => !existingIds.has(n.id));
        
        if (newNotifications.length > 0) {
          dataStore.notificationsStore.push(...newNotifications);
          logInfo("[mockDataPersistence] Loaded persisted notifications", { count: newNotifications.length });
        }
      }
    }
  } catch (error) {
    console.error("[mockDataPersistence] Error loading persisted data:", error);
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
 * Persist current appointments to localStorage
 */
export function persistAppointments() {
  try {
    const appointments = dataStore.getAppointmentsStore();
    localStorage.setItem('health_app_data_appointments', JSON.stringify(appointments));
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
    localStorage.setItem('health_app_data_notifications', JSON.stringify(notifications));
    logInfo("[mockDataPersistence] Persisted notifications", { count: notifications.length });
  } catch (error) {
    console.error("[mockDataPersistence] Error persisting notifications:", error);
  }
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
  createAndBroadcastEvent(SyncEventType.APPOINTMENT_CANCELLED, { appointmentId, reason });
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

// Event handlers for sync events

function handleAppointmentCreated(appointment: any) {
  // Add the appointment to the store if it doesn't exist
  if (!dataStore.appointmentsStore.some(a => a.id === appointment.id)) {
    dataStore.appointmentsStore.push(appointment);
    logInfo("[mockDataPersistence] Added synchronized appointment", { id: appointment.id });
  }
}

function handleAppointmentUpdated(appointment: any) {
  // Find and update the appointment
  const index = dataStore.appointmentsStore.findIndex(a => a.id === appointment.id);
  if (index !== -1) {
    dataStore.appointmentsStore[index] = {
      ...dataStore.appointmentsStore[index],
      ...appointment
    };
    logInfo("[mockDataPersistence] Updated synchronized appointment", { id: appointment.id });
  }
}

function handleAppointmentCancelled(data: { appointmentId: string, reason?: string }) {
  // Find and update the appointment
  const appointment = dataStore.appointmentsStore.find(a => a.id === data.appointmentId);
  if (appointment) {
    appointment.status = AppointmentStatus.CANCELLED;
    if (data.reason) {
      appointment.notes = data.reason;
    }
    logInfo("[mockDataPersistence] Cancelled synchronized appointment", { id: data.appointmentId });
  }
}

function handleNotificationAdded(notification: any) {
  // Add the notification to the store if it doesn't exist
  if (!dataStore.notificationsStore.some(n => n.id === notification.id)) {
    dataStore.notificationsStore.push(notification);
    logInfo("[mockDataPersistence] Added synchronized notification", { id: notification.id });
  }
}

function handleNotificationMarkedRead(data: { notificationId: string, userId: string }) {
  // Find and update the notification
  const notification = dataStore.notificationsStore.find(
    n => n.id === data.notificationId && n.userId === data.userId
  );
  
  if (notification) {
    notification.isRead = true;
    logInfo("[mockDataPersistence] Marked synchronized notification as read", { id: data.notificationId });
  }
} 