import { v4 as uuidv4 } from 'uuid';
import { saveToLocalStorage, getFromLocalStorage, removeFromLocalStorage } from '@/utils/localStorage';
import { AppointmentStatus, UserType } from '@/types/enums';
import type { Appointment } from '@/types/appointment';
import type { UserProfile } from '@/types/user';
import type { DoctorProfile } from '@/types/doctor';
import type { PatientProfile } from '@/types/patient';
import { getDateObject } from '@/utils/dateUtils';

// Storage keys for different data types
const STORAGE_KEYS = {
  APPOINTMENTS: 'appointments',
  USER_PROFILES: 'user_profiles',
  DOCTOR_PROFILES: 'doctor_profiles',
  PATIENT_PROFILES: 'patient_profiles',
  USER_PREFERENCES: 'user_preferences',
  CURRENT_USER: 'current_user'
};

// Type for search options
interface SearchOptions {
  status?: AppointmentStatus | AppointmentStatus[];
  doctorId?: string;
  patientId?: string;
  fromDate?: Date;
  toDate?: Date;
  specialty?: string;
  location?: string;
}

// Type for user preferences
export interface UserPreferences {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  notificationsEnabled: boolean;
  language: string;
}

// Default user preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  fontSize: 'medium',
  notificationsEnabled: true,
  language: 'en'
};

/**
 * Manages appointments in localStorage
 */
export const appointmentService = {
  /**
   * Get all appointments for the current user
   * @param userId User ID
   * @param userType Type of user (PATIENT or DOCTOR)
   * @param options Search options
   * @returns Array of appointments
   */
  getAppointments: (userId: string, userType: UserType, options?: SearchOptions): Appointment[] => {
    const allAppointments = getFromLocalStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []) || [];
    
    // Filter appointments by user type
    let filteredAppointments = allAppointments.filter(appointment => {
      if (userType === UserType.PATIENT) {
        return appointment.patientId === userId;
      } else if (userType === UserType.DOCTOR) {
        return appointment.doctorId === userId;
      }
      return false;
    });
    
    // Apply additional filters if specified
    if (options) {
      // Filter by status
      if (options.status) {
        const statusArray = Array.isArray(options.status) ? options.status : [options.status];
        filteredAppointments = filteredAppointments.filter(appointment => 
          statusArray.includes(appointment.status)
        );
      }
      
      // Filter by date range
      if (options.fromDate) {
        filteredAppointments = filteredAppointments.filter(appointment => {
          const appointmentDate = getDateObject(appointment.appointmentDate);
          return appointmentDate >= options.fromDate!;
        });
      }
      
      if (options.toDate) {
        filteredAppointments = filteredAppointments.filter(appointment => {
          const appointmentDate = getDateObject(appointment.appointmentDate);
          return appointmentDate <= options.toDate!;
        });
      }
    }
    
    // Sort by date (most recent first)
    return filteredAppointments.sort((a, b) => {
      const dateA = getDateObject(a.appointmentDate);
      const dateB = getDateObject(b.appointmentDate);
      return dateB.getTime() - dateA.getTime();
    });
  },
  
  /**
   * Get a specific appointment by ID
   * @param appointmentId Appointment ID
   * @returns Appointment object or undefined if not found
   */
  getAppointmentById: (appointmentId: string): Appointment | undefined => {
    const allAppointments = getFromLocalStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []) || [];
    return allAppointments.find(appointment => appointment.id === appointmentId);
  },
  
  /**
   * Create a new appointment
   * @param appointmentData Appointment data
   * @returns The created appointment with generated ID
   */
  createAppointment: (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Appointment => {
    const allAppointments = getFromLocalStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []) || [];
    
    // Create new appointment with ID and timestamps
    const newAppointment: Appointment = {
      ...appointmentData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to localStorage
    allAppointments.push(newAppointment);
    saveToLocalStorage(STORAGE_KEYS.APPOINTMENTS, allAppointments);
    
    return newAppointment;
  },
  
  /**
   * Update an existing appointment
   * @param appointmentId Appointment ID
   * @param updatedData Updated appointment data
   * @returns Updated appointment or undefined if not found
   */
  updateAppointment: (appointmentId: string, updatedData: Partial<Appointment>): Appointment | undefined => {
    const allAppointments = getFromLocalStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []) || [];
    const index = allAppointments.findIndex(appointment => appointment.id === appointmentId);
    
    if (index === -1) {
      return undefined;
    }
    
    // Update appointment
    const updatedAppointment: Appointment = {
      ...allAppointments[index],
      ...updatedData,
      updatedAt: new Date()
    };
    
    allAppointments[index] = updatedAppointment;
    saveToLocalStorage(STORAGE_KEYS.APPOINTMENTS, allAppointments);
    
    return updatedAppointment;
  },
  
  /**
   * Cancel an appointment
   * @param appointmentId Appointment ID
   * @param cancelledBy Who cancelled the appointment (UserType)
   * @param reason Reason for cancellation
   * @returns True if successful, false otherwise
   */
  cancelAppointment: (
    appointmentId: string, 
    cancelledBy: UserType, 
    reason?: string
  ): boolean => {
    const allAppointments = getFromLocalStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []) || [];
    const index = allAppointments.findIndex(appointment => appointment.id === appointmentId);
    
    if (index === -1) {
      return false;
    }
    
    // Update status based on who cancelled
    allAppointments[index].status = cancelledBy === UserType.PATIENT 
      ? AppointmentStatus.CANCELLED_BY_PATIENT 
      : AppointmentStatus.CANCELLED_BY_DOCTOR;
    
    // Add cancellation reason if provided
    if (reason) {
      allAppointments[index].notes = allAppointments[index].notes 
        ? `${allAppointments[index].notes}\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;
    }
    
    allAppointments[index].updatedAt = new Date();
    saveToLocalStorage(STORAGE_KEYS.APPOINTMENTS, allAppointments);
    
    return true;
  },
  
  /**
   * Complete an appointment
   * @param appointmentId Appointment ID
   * @param notes Doctor's notes
   * @returns True if successful, false otherwise
   */
  completeAppointment: (appointmentId: string, notes?: string): boolean => {
    const allAppointments = getFromLocalStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []) || [];
    const index = allAppointments.findIndex(appointment => appointment.id === appointmentId);
    
    if (index === -1) {
      return false;
    }
    
    // Update appointment status to completed
    allAppointments[index].status = AppointmentStatus.COMPLETED;
    
    // Add notes if provided
    if (notes) {
      allAppointments[index].notes = notes;
    }
    
    allAppointments[index].updatedAt = new Date();
    saveToLocalStorage(STORAGE_KEYS.APPOINTMENTS, allAppointments);
    
    return true;
  }
};

/**
 * Manages user profiles in localStorage
 */
export const userProfileService = {
  /**
   * Set the current user
   * @param userId User ID
   * @returns True if successful
   */
  setCurrentUser: (userId: string): boolean => {
    return saveToLocalStorage(STORAGE_KEYS.CURRENT_USER, userId);
  },
  
  /**
   * Get the current user ID
   * @returns Current user ID or undefined
   */
  getCurrentUserId: (): string | undefined => {
    return getFromLocalStorage<string>(STORAGE_KEYS.CURRENT_USER);
  },
  
  /**
   * Get a user profile by ID
   * @param userId User ID
   * @returns User profile or undefined if not found
   */
  getUserProfile: (userId: string): UserProfile | undefined => {
    const allProfiles = getFromLocalStorage<UserProfile[]>(STORAGE_KEYS.USER_PROFILES, []) || [];
    return allProfiles.find(profile => profile.id === userId);
  },
  
  /**
   * Create or update a user profile
   * @param profile User profile data
   * @returns The saved profile
   */
  saveUserProfile: (profile: UserProfile): UserProfile => {
    const allProfiles = getFromLocalStorage<UserProfile[]>(STORAGE_KEYS.USER_PROFILES, []) || [];
    const index = allProfiles.findIndex(p => p.id === profile.id);
    
    if (index === -1) {
      // New profile
      allProfiles.push({
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Update existing profile
      allProfiles[index] = {
        ...allProfiles[index],
        ...profile,
        updatedAt: new Date()
      };
    }
    
    saveToLocalStorage(STORAGE_KEYS.USER_PROFILES, allProfiles);
    return index === -1 ? allProfiles[allProfiles.length - 1] : allProfiles[index];
  },
  
  /**
   * Get doctor profile by ID
   * @param doctorId Doctor ID
   * @returns Doctor profile or undefined if not found
   */
  getDoctorProfile: (doctorId: string): DoctorProfile | undefined => {
    const allProfiles = getFromLocalStorage<DoctorProfile[]>(STORAGE_KEYS.DOCTOR_PROFILES, []) || [];
    return allProfiles.find(profile => profile.userId === doctorId);
  },
  
  /**
   * Save doctor profile
   * @param profile Doctor profile data
   * @returns The saved profile
   */
  saveDoctorProfile: (profile: DoctorProfile): DoctorProfile => {
    const allProfiles = getFromLocalStorage<DoctorProfile[]>(STORAGE_KEYS.DOCTOR_PROFILES, []) || [];
    const index = allProfiles.findIndex(p => p.userId === profile.userId);
    
    if (index === -1) {
      // New profile
      allProfiles.push({
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Update existing profile
      allProfiles[index] = {
        ...allProfiles[index],
        ...profile,
        updatedAt: new Date()
      };
    }
    
    saveToLocalStorage(STORAGE_KEYS.DOCTOR_PROFILES, allProfiles);
    return index === -1 ? allProfiles[allProfiles.length - 1] : allProfiles[index];
  },
  
  /**
   * Get patient profile by ID
   * @param patientId Patient ID
   * @returns Patient profile or undefined if not found
   */
  getPatientProfile: (patientId: string): PatientProfile | undefined => {
    const allProfiles = getFromLocalStorage<PatientProfile[]>(STORAGE_KEYS.PATIENT_PROFILES, []) || [];
    return allProfiles.find(profile => profile.userId === patientId);
  },
  
  /**
   * Save patient profile
   * @param profile Patient profile data
   * @returns The saved profile
   */
  savePatientProfile: (profile: PatientProfile): PatientProfile => {
    const allProfiles = getFromLocalStorage<PatientProfile[]>(STORAGE_KEYS.PATIENT_PROFILES, []) || [];
    const index = allProfiles.findIndex(p => p.userId === profile.userId);
    
    if (index === -1) {
      // New profile
      allProfiles.push({
        ...profile
      });
    } else {
      // Update existing profile
      allProfiles[index] = {
        ...allProfiles[index],
        ...profile
      };
    }
    
    saveToLocalStorage(STORAGE_KEYS.PATIENT_PROFILES, allProfiles);
    return index === -1 ? allProfiles[allProfiles.length - 1] : allProfiles[index];
  },
  
  /**
   * Find doctors based on various criteria
   * @param options Search options
   * @returns Array of doctor profiles
   */
  findDoctors: (options?: { specialty?: string; location?: string }): DoctorProfile[] => {
    let doctors = getFromLocalStorage<DoctorProfile[]>(STORAGE_KEYS.DOCTOR_PROFILES, []) || [];
    
    if (options) {
      if (options.specialty) {
        doctors = doctors.filter(doctor => 
          doctor.specialty.toLowerCase().includes(options.specialty!.toLowerCase())
        );
      }
      
      if (options.location) {
        doctors = doctors.filter(doctor => 
          doctor.location.toLowerCase().includes(options.location!.toLowerCase())
        );
      }
    }
    
    return doctors;
  }
};

/**
 * Manages user preferences in localStorage
 */
export const userPreferencesService = {
  /**
   * Get user preferences
   * @param userId User ID
   * @returns User preferences
   */
  getUserPreferences: (userId: string): UserPreferences => {
    return getFromLocalStorage<UserPreferences>(
      `${STORAGE_KEYS.USER_PREFERENCES}_${userId}`, 
      DEFAULT_PREFERENCES
    ) || DEFAULT_PREFERENCES;
  },
  
  /**
   * Save user preferences
   * @param userId User ID
   * @param preferences User preferences
   * @returns True if successful
   */
  saveUserPreferences: (userId: string, preferences: Partial<UserPreferences>): boolean => {
    const currentPreferences = this.getUserPreferences(userId);
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences
    };
    
    return saveToLocalStorage(`${STORAGE_KEYS.USER_PREFERENCES}_${userId}`, updatedPreferences);
  },
  
  /**
   * Reset user preferences to defaults
   * @param userId User ID
   * @returns True if successful
   */
  resetUserPreferences: (userId: string): boolean => {
    return saveToLocalStorage(`${STORAGE_KEYS.USER_PREFERENCES}_${userId}`, DEFAULT_PREFERENCES);
  }
};

// Export combined services as default
export default {
  appointments: appointmentService,
  profiles: userProfileService,
  preferences: userPreferencesService
}; 