"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode
} from "react";
import type { UserProfile } from "../types/user";
import { logInfo } from "@/lib/logger";
import { mockPatientUser, mockDoctorUser, mockAdminUser } from "../types/mockData";
import { useLocalStorage } from "@/hooks/useLocalStorage";

/**
 * AuthContextState defines the shape of the authentication context.
 * @property user - The mock Firebase Auth user (minimal shape: { uid, email }) or null if not logged in.
 * @property userProfile - The mock Firestore user profile or null if not logged in.
 * @property loading - Whether the auth state is being initialized or changed.
 * @property role - The current mock user role ('patient', 'doctor', 'admin') or null if not logged in.
 * @property login - Function to simulate login as a patient, doctor, or admin (mock only).
 * @property logout - Function to simulate logout.
 * @property refreshProfile - Function to reload the user profile from localStorage.
 */
export interface AuthContextState {
  user: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  role: 'patient' | 'doctor' | 'admin' | null;
  login: (role: 'patient' | 'doctor' | 'admin') => void;
  logout: () => void;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * AuthProvider manages global mock authentication state for the app.
 * Wrap your app in this provider to enable useAuth().
 * Implements session timeout: logs out user after 30 minutes of inactivity.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useLocalStorage<any | null>("auth_user", null);
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>("auth_profile", null);
  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useLocalStorage<'patient' | 'doctor' | 'admin' | null>("auth_role", null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoggedRef = useRef<number>(0);

  // Simulate logout (must be declared before resetTimeout for closure safety)
  const logout = useCallback(() => {
    logInfo("Mock logout called");
    setUser(null);
    setUserProfile(null);
    setRole(null);
    setLoading(false);
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // Session timeout: reset timer on user activity
  const resetTimeout = useCallback(() => {
    // Debounce the activity updates to prevent excessive logging
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    
    const now = Date.now();
    
    // Only log timeout reset at most once every 10 seconds
    if (now - lastLoggedRef.current > 10000) {
      lastLoggedRef.current = now;
      logInfo("Session timeout reset");
    }
    
    // 30 min inactivity
    timeoutIdRef.current = setTimeout(() => {
      logInfo("Session timeout: Logging out due to inactivity");
      logout();
    }, 30 * 60 * 1000);
  }, [logout]);

  // Simulate async mock login
  const login = useCallback(async (role: 'patient' | 'doctor' | 'admin') => {
    logInfo("Mock login called", { role });
    setLoading(true);
    // Reset and seed all mock data stores for the selected role
    await import("@/data/resetMockDataStoresForUser").then(mod => mod.resetMockDataStoresForUser(role));
    let email = '';
    if (role === 'patient') email = mockPatientUser.email ?? '';
    else if (role === 'doctor') email = mockDoctorUser.email ?? '';
    else if (role === 'admin') email = mockAdminUser.email ?? '';

    try {
      // Use the real mockSignIn to ensure all associated data is loaded
      const { user, userProfile } = await import("@/lib/mockApiService").then(mod => mod.mockSignIn(email, 'mock'));
      const authUser = { uid: user.uid, email: user.email, userType: role };
      
      setUser(authUser);
      setUserProfile(userProfile);
      setRole(role);
      setLoading(false);
      logInfo("Mock login completed", { role });
      console.log('[DEBUG][AuthContext] Login setUser:', authUser);
      console.log('[DEBUG][AuthContext] Login setUserProfile:', userProfile);
      resetTimeout(); // Ensure session timer starts on login
    } catch (error) {
      setUser(null);
      setUserProfile(null);
      setRole(null);
      setLoading(false);
      logInfo("Mock login failed", { role, error });
    }
  }, [resetTimeout]);

  // Load persisted auth state on initial mount
  useEffect(() => {
    const loadPersistedAuth = () => {
      try {
        const storedUser = user;
        const storedProfile = userProfile;
        const storedRole = role;
        
        if (storedUser && storedProfile && storedRole) {
          const parsedUser = storedUser;
          const parsedProfile = storedProfile;
          const roleValue = storedRole as 'patient' | 'doctor' | 'admin';
          
          setUser(parsedUser);
          setUserProfile(parsedProfile);
          setRole(roleValue);
          logInfo("Restored auth state from localStorage", { role: roleValue });
          resetTimeout(); // Start session timeout
        }
      } catch (error) {
        logInfo("Error restoring auth state", { error });
        // Clear potentially corrupted data
        setUser(null);
        setUserProfile(null);
        setRole(null);
      }
      
      setLoading(false);
    };
    
    loadPersistedAuth();
  }, [resetTimeout]);

  useEffect(() => {
    if (!user) return;
    // Events that indicate user activity
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimeout));
    resetTimeout();
    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimeout));
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [user, resetTimeout]);

  // Simulate initial auth check delay
  useEffect(() => {
    logInfo("AuthContext: Initial auth check simulation start");
    const timer = setTimeout(() => {
      setLoading(false);
      logInfo("AuthContext: Initial auth check simulation complete");
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Function to refresh the user profile from localStorage
  const refreshProfile = useCallback(() => {
    logInfo("Reloading profile from localStorage");
    try {
      const storedUser = user;
      const storedProfile = userProfile;
      
      if (storedUser && storedProfile) {
        const parsedUser = storedUser;
        const parsedProfile = storedProfile;
        
        setUser(parsedUser);
        setUserProfile(parsedProfile);
        
        // Also update the user in the dataStore to ensure consistency
        // This prevents the data from being reset when logging out and back in
        import('@/data/mockDataStore').then(mod => {
          try {
            const { usersStore } = mod;
            if (usersStore && parsedUser && parsedUser.uid) {
              // Find the user in the store
              const userToUpdate = usersStore.find(u => u.id === parsedUser.uid);
              if (userToUpdate) {
                // Update relevant fields directly
                if (typeof parsedProfile.firstName === 'string') {
                  userToUpdate.firstName = parsedProfile.firstName;
                }
                if (typeof parsedProfile.lastName === 'string') {
                  userToUpdate.lastName = parsedProfile.lastName;
                }
                if (typeof parsedProfile.email === 'string' || parsedProfile.email === null) {
                  userToUpdate.email = parsedProfile.email;
                }
                if (typeof parsedProfile.phone === 'string' || parsedProfile.phone === null) {
                  userToUpdate.phone = parsedProfile.phone;
                }
                userToUpdate.updatedAt = new Date();
                
                logInfo("Updated user profile in mock data store");
              }
            }
          } catch (err) {
            logInfo("Error updating user in mock data store", { error: err });
          }
        });
        
        logInfo("Refreshed user profile from localStorage");
      }
    } catch (error) {
      logInfo("Error refreshing user profile", { error });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, role, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth - Access the global authentication context.
 * @returns {AuthContextState} The current authentication state and actions.
 * @throws Error if used outside of AuthProvider.
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
