import { UserType } from "@/types/enums";
import { STORAGE_KEYS } from "@/lib/mockDataPersistence";

/**
 * Resets all mock data stores by clearing persisted localStorage and re-initializing default mock data.
 */
export function resetMockDataStoresForUser(role: UserType | 'patient' | 'doctor' | 'admin') {
  if (typeof window !== 'undefined') {
    // Clear persisted mock data
    Object.values(STORAGE_KEYS).forEach(key => window.localStorage.removeItem(key));
    // Re-initialize mock data persistence without full page reload
    import("@/lib/mockDataPersistence")
      .then(mod => {
        mod.cleanupDataPersistence();
        mod.initDataPersistence();
      })
      .catch(err => console.error("Error reinitializing mock data persistence", err));
  }
}