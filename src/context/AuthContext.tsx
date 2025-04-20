"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebaseClient } from '@/lib/firebaseClient';
import type { UserProfile } from '@/types/user';
import type { UserType } from '@/types/enums';
import { logInfo, logWarn, logError } from '@/lib/logger';
import { trackPerformance } from '@/lib/performance';
import { useRouter } from 'next/navigation';

export interface AuthContextState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  role: UserType | null;
  login: (role?: UserType) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const { auth: fbAuth, db: firestoreDb } = initializeFirebaseClient('live');
    if (!fbAuth) {
      logWarn('[AuthContext] Firebase auth instance is null');
      setLoading(false);
      return;
    }
    logInfo('[AuthContext] Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(fbAuth, async (firebaseUser) => {
      const perf = trackPerformance('onAuthStateChanged');
      try {
        logInfo('[AuthContext] Auth state changed', { uid: firebaseUser?.uid });
        setUser(firebaseUser);
        if (firebaseUser && firestoreDb) {
          try {
            const userDocRef = doc(firestoreDb, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setUserProfile(userDocSnap.data() as UserProfile);
              logInfo('[AuthContext] User profile fetched', { uid: firebaseUser.uid });
            } else {
              setUserProfile(null);
              logWarn('[AuthContext] User profile not found', { uid: firebaseUser.uid });
            }
          } catch (error) {
            setUserProfile(null);
            logError('[AuthContext] Error fetching user profile', { error });
          }
        } else {
          setUserProfile(null);
        }
      } finally {
        setLoading(false);
        perf.stop();
      }
    });
    return () => {
      unsubscribe();
      logInfo('[AuthContext] Cleaned up auth listener');
    };
  }, []);

  const logout = useCallback(async () => {
    const { auth: fbAuth } = initializeFirebaseClient('live');
    if (!fbAuth) {
      logWarn('[AuthContext] No auth instance for logout');
      return;
    }
    const perf = trackPerformance('signOut');
    logInfo('[AuthContext] Logout requested');
    try {
      await signOut(fbAuth);
      logInfo('[AuthContext] Logout successful');
    } catch (error) {
      logError('[AuthContext] Logout error', { error });
    } finally {
      perf.stop();
    }
  }, []);

  const login = useCallback((role?: UserType) => {
    logInfo('[AuthContext] Redirecting to login', { role });
    router.push(`/auth/login${role ? `?role=${role}` : ''}`);
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      // Normalize role: prefer userProfile.userType, fallback to userProfile.role, always uppercase if present
      role: userProfile?.userType?.toUpperCase?.() || userProfile?.role?.toUpperCase?.() || null,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
