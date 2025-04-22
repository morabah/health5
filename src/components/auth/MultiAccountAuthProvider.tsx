'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getIsolatedAuth } from '@/lib/multiAccountFirebase';

interface AccountSession {
  name: string; // e.g. 'doctor', 'patient', 'admin', or custom
  user: User | null;
  auth: any;
}

interface MultiAccountAuthContextType {
  sessions: AccountSession[];
  addAccount: (name: string, email: string, password: string) => Promise<void>;
  switchAccount: (name: string) => void;
  current: AccountSession | null;
  signOutAccount: (name: string) => Promise<void>;
}

const MultiAccountAuthContext = createContext<MultiAccountAuthContextType | undefined>(undefined);

export function MultiAccountAuthProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [currentName, setCurrentName] = useState<string | null>(null);

  const addAccount = async (name: string, email: string, password: string) => {
    const auth = await getIsolatedAuth(name);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const session: AccountSession = { name, user: cred.user, auth };
    setSessions((prev) => [...prev.filter(s => s.name !== name), session]);
    setCurrentName(name);
  };

  const switchAccount = (name: string) => {
    setCurrentName(name);
  };

  const signOutAccount = async (name: string) => {
    const session = sessions.find(s => s.name === name);
    if (session) {
      await signOut(session.auth);
      setSessions(prev => prev.filter(s => s.name !== name));
      if (currentName === name) setCurrentName(null);
    }
  };

  const current = sessions.find(s => s.name === currentName) || null;

  return (
    <MultiAccountAuthContext.Provider value={{ sessions, addAccount, switchAccount, current, signOutAccount }}>
      {children}
    </MultiAccountAuthContext.Provider>
  );
}

export function useMultiAccountAuth() {
  const ctx = useContext(MultiAccountAuthContext);
  if (!ctx) throw new Error('useMultiAccountAuth must be used within MultiAccountAuthProvider');
  return ctx;
}
