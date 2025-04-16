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

/**
 * AuthContextState defines the shape of the authentication context.
 * @property user - The mock Firebase Auth user (minimal shape: { uid, email }) or null if not logged in.
 * @property userProfile - The mock Firestore user profile or null if not logged in.
 * @property loading - Whether the auth state is being initialized or changed.
 * @property role - The current mock user role ('patient', 'doctor', 'admin') or null if not logged in.
 * @property login - Function to simulate login as a patient, doctor, or admin (mock only).
 * @property logout - Function to simulate logout.
 */
export interface AuthContextState {
  user: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  role: 'patient' | 'doctor' | 'admin' | null;
  login: (role: 'patient' | 'doctor' | 'admin') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * AuthProvider manages global mock authentication state for the app.
 * Wrap your app in this provider to enable useAuth().
 * Implements session timeout: logs out user after 30 minutes of inactivity.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<'patient' | 'doctor' | 'admin' | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

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
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    // 30 min inactivity
    timeoutIdRef.current = setTimeout(() => {
      logInfo("Session timeout: Logging out due to inactivity");
      logout();
    }, 30 * 60 * 1000);
    logInfo("Session timeout reset");
  }, [logout]);

  // Simulate async mock login
  const login = useCallback(async (role: 'patient' | 'doctor' | 'admin') => {
    logInfo("Mock login called", { role });
    setLoading(true);
    // Reset and seed all mock data stores for the selected role
    await import("@/data/resetMockDataStoresForUser").then(mod => mod.resetMockDataStoresForUser(role));
    let email = '';
    if (role === 'patient') email = mockPatientUser.email;
    else if (role === 'doctor') email = mockDoctorUser.email;
    else if (role === 'admin') email = mockAdminUser.email;

    try {
      // Use the real mockSignIn to ensure all associated data is loaded
      const { user, userProfile } = await import("@/lib/mockApiService").then(mod => mod.mockSignIn(email, 'mock'));
      setUser({ uid: user.uid, email: user.email, userType: role });
      setUserProfile(userProfile);
      setRole(role);
      setLoading(false);
      logInfo("Mock login completed", { role });
      console.log('[DEBUG][AuthContext] Login setUser:', { uid: user.uid, email: user.email, userType: role });
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

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, role, login, logout }}>
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
