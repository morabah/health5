"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode
} from "react";
import type { UserProfile } from "../types/user";
import { logInfo } from "@/lib/logger";
import { mockPatientUser, mockDoctorUser } from "../types/mockData";

/**
 * AuthContextState defines the shape of the authentication context.
 * @property user - The mock Firebase Auth user (minimal shape: { uid, email }) or null if not logged in.
 * @property userProfile - The mock Firestore user profile or null if not logged in.
 * @property loading - Whether the auth state is being initialized or changed.
 * @property login - Function to simulate login as a patient or doctor (mock only).
 * @property logout - Function to simulate logout.
 */
export interface AuthContextState {
  user: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (role: "patient" | "doctor") => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * AuthProvider manages global mock authentication state for the app.
 * Wrap your app in this provider to enable useAuth().
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Simulate async mock login
  const login = useCallback((role: "patient" | "doctor") => {
    logInfo("Mock login called", { role });
    setLoading(true);
    setTimeout(() => {
      if (role === "patient") {
        setUser({ uid: mockPatientUser.id, email: mockPatientUser.email });
        setUserProfile(mockPatientUser);
      } else {
        setUser({ uid: mockDoctorUser.id, email: mockDoctorUser.email });
        setUserProfile(mockDoctorUser);
      }
      setLoading(false);
      logInfo("Mock login completed", { role });
    }, 300);
  }, []);

  // Simulate logout
  const logout = useCallback(() => {
    logInfo("Mock logout called");
    setUser(null);
    setUserProfile(null);
    setLoading(false);
  }, []);

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
    <AuthContext.Provider value={{ user, userProfile, loading, login, logout }}>
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
