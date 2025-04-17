/**
 * Admin-related data loaders (mock-first, abstracted).
 * Returns mock data if API mode is 'mock', otherwise logs a warning and returns fallback.
 */
import { getApiMode } from './loaderUtils';
import { logInfo, logWarn } from '@/lib/logger';
import { VerificationStatus } from '@/types/enums';

/**
 * Loads pending verifications for admin dashboard (mock only).
 */
export async function loadAdminPendingVerifications(): Promise<any[]> {
  const label = 'loadAdminPendingVerifications';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { mode });
  const start = performance.now();
  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 150));
      // Example mock pending verifications
      const data = [
        { id: 'verif1', name: 'Dr. Alice Smith', type: 'doctor', submitted: '2025-04-14T10:00:00' },
        { id: 'verif2', name: 'John Doe', type: 'patient', submitted: '2025-04-13T15:20:00' }
      ];
      logInfo(`[${label}] Loaded mock data`, { count: data.length });
      return data;
    } else {
      logWarn(`[${label}] Live fetch not implemented for mode: ${mode}`);
      return [];
    }
  } catch (err) {
    logWarn(`[${label}] Error: ${(err as Error).message}`);
    return [];
  } finally {
    logInfo(`[${label}] finished`, { duration: performance.now() - start });
  }
}

/**
 * Loads all users for admin dashboard (mock only).
 */
export async function loadAdminUsers(): Promise<any[]> {
  const label = 'loadAdminUsers';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { mode });
  const start = performance.now();
  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 150));
      // Example mock users
      const data = [
        { id: 'user1', name: 'Dr. Alice Smith', role: 'doctor' },
        { id: 'user2', name: 'John Doe', role: 'patient' },
        { id: 'user3', name: 'Admin Jane', role: 'admin' }
      ];
      logInfo(`[${label}] Loaded mock data`, { count: data.length });
      return data;
    } else {
      logWarn(`[${label}] Live fetch not implemented for mode: ${mode}`);
      return [];
    }
  } catch (err) {
    logWarn(`[${label}] Error: ${(err as Error).message}`);
    return [];
  } finally {
    logInfo(`[${label}] finished`, { duration: performance.now() - start });
  }
}

/**
 * Loads admin dashboard data including stats and pending verifications
 */
export async function loadAdminDashboardData() {
  const label = 'loadAdminDashboardData';
  const mode = getApiMode();
  logInfo(`[${label}] start`, { mode });
  const start = performance.now();

  try {
    if (mode === 'mock') {
      await new Promise(res => setTimeout(res, 300));
      
      // Create mock dashboard data
      const result = {
        stats: {
          totalUsers: 156,
          totalPatients: 120,
          totalDoctors: 35,
          pendingVerifications: 3,
          activeAppointments: 28
        },
        pendingDoctors: [
          {
            id: 'user_doctor_001',
            name: 'Dr. Sarah Johnson',
            specialty: 'Cardiology',
            status: VerificationStatus.PENDING,
            submittedAt: '2023-06-15T10:30:00'
          },
          {
            id: 'user_doctor_002',
            name: 'Dr. Michael Lee',
            specialty: 'Dermatology',
            status: VerificationStatus.PENDING,
            submittedAt: '2023-06-14T16:45:00'
          },
          {
            id: 'user_doctor_003',
            name: 'Dr. Emily Chen',
            specialty: 'Pediatrics',
            status: VerificationStatus.PENDING,
            submittedAt: '2023-06-13T09:15:00'
          }
        ],
        recentUsers: [
          {
            id: 'user1',
            name: 'John Smith',
            email: 'john.smith@example.com',
            userType: 'patient',
            registeredAt: '2023-06-10T08:20:00'
          },
          {
            id: 'user2',
            name: 'Dr. Robert Davis',
            email: 'robert.davis@example.com',
            userType: 'doctor',
            registeredAt: '2023-06-09T14:30:00'
          }
        ]
      };
      
      logInfo(`[${label}] Loaded mock dashboard data`);
      return result;
    } else {
      logWarn(`[${label}] Live fetch not implemented for mode: ${mode}`);
      return {
        stats: {
          totalUsers: 0,
          totalPatients: 0,
          totalDoctors: 0,
          pendingVerifications: 0,
          activeAppointments: 0
        },
        pendingDoctors: [],
        recentUsers: []
      };
    }
  } catch (err) {
    logWarn(`[${label}] Error: ${(err as Error).message}`);
    return {
      stats: {
        totalUsers: 0,
        totalPatients: 0,
        totalDoctors: 0,
        pendingVerifications: 0,
        activeAppointments: 0
      },
      pendingDoctors: [],
      recentUsers: []
    };
  } finally {
    logInfo(`[${label}] finished`, { duration: performance.now() - start });
  }
}
