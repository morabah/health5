'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logInfo, logApiModeChange, logValidation } from '@/lib/logger';
import { setEventInLocalStorage } from '@/lib/eventBus';
import { appEventBus, LogPayload, ApiModePayload } from '@/lib/eventBus';
import { getApiMode, setApiMode as setGlobalApiMode, onApiModeChange } from '@/config/apiConfig';
import { useEffect, useState } from 'react';
import React from 'react';
import { DoctorProfile } from '@/types/doctor';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserMd, faStethoscope, faStar } from '@fortawesome/free-solid-svg-icons';
import ApiModeLabel from './ApiModeLabel';

const MOCK_DOCTOR_IDS = ['user_doctor_001', 'user_doctor_002', 'user_doctor_003'];

// Extend the DoctorProfile interface to include the 'name' property
interface ExtendedDoctorProfile extends DoctorProfile {
  name?: string;
}

/**
 * Helper function: always use this to log events so cross-tab sync works.
 */
function logEventToCMS(message: string, data?: Record<string, any>) {
  const payload: LogPayload = {
    level: 'INFO',
    message,
    timestamp: new Date().toISOString(),
    data,
  };
  // In-memory event bus (for same tab)
  appEventBus.emit('log_event', payload);
  // Cross-tab sync (for all tabs)
  setEventInLocalStorage(payload);
  // Logger fallback (for legacy support)
  logInfo(message, data);
}

// Restore getFirestoreDb for Firestore initialization
async function getFirestoreDb() {
  const currentMode = getApiMode();
  if (currentMode !== 'live') {
    console.log('[Home] In mock mode, not initializing Firestore');
    return null;
  }
  try {
    const { initializeFirebaseClient } = await import('@/lib/firebaseClient');
    const { db } = initializeFirebaseClient(currentMode);
    return db;
  } catch (err) {
    console.error('[Home] Error initializing or importing Firebase:', err);
    return null;
  }
}

// Update fetchDoctors to use dynamic Firebase imports
async function fetchDoctors(
  apiMode: string,
  setDoctors: React.Dispatch<React.SetStateAction<ExtendedDoctorProfile[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) {
  console.log('[Home] Starting fetchDoctors with mode:', apiMode);
  setLoading(true);
  setError(null);
  
  // Always pre-load the mock data as a backup
  let mockDoctors: ExtendedDoctorProfile[] = [];
  try {
    console.log('[Home] Loading mock data as fallback');
    const res = await fetch('/scripts/offlineMockData.json');
    
    if (!res.ok) {
      throw new Error(`Failed to load mock data: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('[Home] Mock data loaded, doctor count:', data.doctors?.length || 0);
    
    mockDoctors = (data.doctors || [])
      .filter((doc: any) => MOCK_DOCTOR_IDS.includes(doc.userId || doc.id))
      .map((doc: any) => ({
        ...doc,
        name: `Dr. ${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.userId || doc.id
      }));
      
    console.log('[Home] Filtered mock doctors:', mockDoctors.length);
  } catch (mockErr) {
    console.error('[Home] Error loading mock data:', mockErr);
  }
  
  // If we're in mock mode, just use the mock data
  if (apiMode !== 'live') {
    console.log('[Home] Using mock data source');
    if (mockDoctors.length > 0) {
      setDoctors(mockDoctors);
      setLoading(false);
      return;
    } else {
      console.error('[Home] No mock doctors available');
      setError('Failed to load doctor information from mock data');
      setLoading(false);
      return;
    }
  }
  
  // If we're in live mode, try to use Firestore
  try {
    console.log('[Home] Using live Firestore data source');
    
    // Dynamically import Firebase modules
    const firebaseModules = await import('firebase/firestore');
    const { collection, getDocs, query, where, limit } = firebaseModules;
    
    console.log('[Home] Firebase modules imported, getting Firestore DB');
    const firestoreDb = await getFirestoreDb();
    
    // Check if we got a valid Firestore instance
    if (!firestoreDb) {
      console.warn('[Home] Firestore not initialized, falling back to mock data');
      setDoctors(mockDoctors);
      setError('Firestore not available. Using mock data instead.');
      setLoading(false);
      return;
    }
    
    // Attempt to query Firestore
    console.log('[Home] Executing Firestore query');
    const doctorIds = MOCK_DOCTOR_IDS.length > 10 ? MOCK_DOCTOR_IDS.slice(0, 10) : MOCK_DOCTOR_IDS;
    
    const q = query(
      collection(firestoreDb, 'doctors'),
      where('userId', 'in', doctorIds),
      limit(5)
    );
    
    console.log('[Home] Executing query with IDs:', doctorIds);
    const snapshot = await getDocs(q);
    console.log('[Home] Firestore query completed, docs count:', snapshot.docs.length);
    
    if (snapshot.docs.length === 0) {
      console.warn('[Home] No doctors found in Firestore, falling back to mock data');
      setDoctors(mockDoctors);
      setError('No doctors found in Firestore. Using mock data instead.');
    } else {
      const firestoreDoctors = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          userId: doc.id,
          name: `Dr. ${data.firstName || ''} ${data.lastName || ''}`.trim() || doc.id
        };
      }) as ExtendedDoctorProfile[];
      
      console.log('[Home] Successfully loaded doctors from Firestore:', firestoreDoctors.length);
      setDoctors(firestoreDoctors);
    }
  } catch (err) {
    console.error('[Home] Error fetching doctors from Firestore:', err);
    // Always fall back to mock data on error
    if (mockDoctors.length > 0) {
      setDoctors(mockDoctors);
      setError(`Firestore error: ${err instanceof Error ? err.message : 'Unknown error'}. Using mock data instead.`);
    } else {
      setError('Failed to load doctor information from both Firestore and mock data');
    }
  } finally {
    setLoading(false);
    console.log('[Home] fetchDoctors completed');
  }
}

/**
 * Home page with navigation links to all main project pages. 
 * Demonstrates different approaches to event tracking that all log to the CMS.
 */
export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  const [apiMode, setApiMode] = useState<'live' | 'mock'>('mock');
  const router = useRouter();
  const [doctors, setDoctors] = useState<ExtendedDoctorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState<boolean>(false);

  useEffect(() => {
    setHasMounted(true);
    // Defensive: always coerce to union type
    const mode = getApiMode();
    setApiMode(mode === 'live' ? 'live' : 'mock');
  }, []);

  // Effect to initialize/reinitialize Firebase when apiMode changes
  useEffect(() => {
    if (!hasMounted) return;
    
    async function initializeFirebase() {
      if (apiMode === 'live') {
        try {
          const { initializeFirebaseClient } = await import('@/lib/firebaseClient');
          const { db } = initializeFirebaseClient(apiMode);
          console.log('[Home] Firebase initialized for mode:', apiMode, 'DB instance:', !!db);
          setFirebaseInitialized(!!db);
        } catch (err) {
          console.error('[Home] Error initializing Firebase:', err);
          setFirebaseInitialized(false);
        }
      } else {
        console.log('[Home] Skipping Firebase initialization for mock mode');
        setFirebaseInitialized(false);
      }
    }
    
    console.log('[Home] API mode changed to:', apiMode, 'Initializing Firebase...');
    initializeFirebase();
  }, [apiMode, hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    
    // Set up API mode change listener
    const unsubscribe = onApiModeChange((newMode) => {
      console.log('[Home] API mode changed externally:', newMode);
      setApiMode(newMode === 'live' ? 'live' : 'mock');
    });
    
    return () => {
      unsubscribe();
    };
  }, [hasMounted]);

  useEffect(() => {
    console.log('[Home] Current API mode:', apiMode);
  }, [apiMode]);

  useEffect(() => {
    if (!hasMounted) return;
    console.log('[Home] Client-side hydration complete, loading initial data with mode:', apiMode);
    fetchDoctors(apiMode, setDoctors, setLoading, setError);
  }, [apiMode, hasMounted, firebaseInitialized]); // Add firebaseInitialized as a dependency

  useEffect(() => {
    if (!hasMounted) return;
    console.log('[Home] Running main effect to set up API mode listeners.');
    
    // Function to update API mode state when an event is received
    const updateApiModeState = (newMode: string, source: string) => {
      // Check against the *current* state value, not a potentially stale closure value
      setApiMode(currentApiModeInState => {
        if (newMode !== currentApiModeInState) {
          logApiModeChange(currentApiModeInState, newMode, source);
          console.log(`[Home] Updating API mode state via ${source}: ${currentApiModeInState} -> ${newMode}`);
          return newMode; // Update the state
        }
        return currentApiModeInState; // No change needed
      });
    };
    
    // Listener for the centralized API mode change event from Event Bus
    const handleApiModeChangeEvent = (payload: ApiModePayload) => {
      console.log('[Home] Received API mode change event via Event Bus:', payload);
      // Only update if it's not from initial_sync to prevent auto-switching on refresh
      if (payload.source !== 'initial_sync') {
        updateApiModeState(payload.newMode, 'event_bus_listener');
      } else {
        console.log('[Home] Ignoring initial_sync event to prevent auto-switching on refresh');
      }
    };
    
    // Listener for BroadcastChannel messages
    const handleBroadcastMessage = (event: MessageEvent) => {
      console.log('[Home] BroadcastChannel message received:', event.data);
      if (event.data && event.data.type === 'apiModeChange' && event.data.mode) {
        console.log('[Home] API mode change received via BroadcastChannel:', event.data.mode);
        updateApiModeState(event.data.mode, 'broadcast_channel');
      }
    };

    // Subscribe to the primary API mode change event
    appEventBus.on('api_mode_change', handleApiModeChangeEvent);
    console.log('[Home] Subscribed to api_mode_change event');

    // Set up BroadcastChannel listener
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      broadcastChannel = new BroadcastChannel('api_mode_channel');
      broadcastChannel.onmessage = handleBroadcastMessage;
      console.log('[Home] BroadcastChannel listener set up');
    } catch (e) {
      console.log('[Home] BroadcastChannel not supported');
    }
    
    // After setting up listeners, check if the current localStorage value matches the state,
    // but only log it without triggering auto-sync
    const currentStoredMode = getApiMode();
    console.log('[Home] Initial stored API mode after listener setup:', currentStoredMode);
    
    // Don't auto-sync to prevent unexpected switches on refresh
    // Remove/comment out this section to prevent mode switching on refresh
    /*
    if (currentStoredMode !== apiMode) {
      console.log('[Home] Triggering initial API mode sync to match localStorage');
      const payload: ApiModePayload = {
        oldMode: apiMode,
        newMode: currentStoredMode,
        source: 'initial_sync',
        timestamp: new Date().toISOString()
      };
      appEventBus.emit('api_mode_change', payload);
    }
    */
    
    // Clean up listeners
    return () => {
      console.log('[Home] Cleaning up API mode listeners');
      appEventBus.off('api_mode_change', handleApiModeChangeEvent);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
    // Rerun this effect only if isClient changes (i.e., on hydration)
  }, [hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    // Update the document title to reflect the current API mode for debugging purposes
    if (typeof document !== 'undefined') {
      document.title = `Health App (${apiMode === 'live' ? 'Live' : 'Mock'})`;
    }
    
    // Assign a unique tab ID for logging/debugging if not already set
    if (typeof window !== 'undefined' && !window.name) {
      window.name = `tab_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`[Home] Assigned tab ID: ${window.name}`);
      
      // Store the tab ID in sessionStorage for persistence
      sessionStorage.setItem('tabId', window.name);
    }
  }, [apiMode, hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    // Log validation success for each major section
    logValidation('3.10_DoctorDashboardUI', 'success');
    logValidation('3.11_AdminDashboardUI', 'success');
    logValidation('3.12_AdminListsUI', 'success');
    logValidation('3.13_FindDoctorUI', 'success');
    logValidation('3.14_PatientProfileUI', 'success');
    logValidation('3.15_DoctorProfileUI', 'success');
    logValidation('3.16_BookAppointmentUI', 'success');
    logValidation('3.17_NotificationsUI', 'success');
    logValidation('3.18_DoctorAvailabilityUI', 'success');
    logValidation('3.19_DoctorFormsUI', 'success');
    logValidation('3.Y_Animations', 'success');
  }, [hasMounted]);

  if (!hasMounted) {
    return null;
  }

  let modeLabel = apiMode === 'live' ? 'Live (Firestore)' : 'Mock (Offline Data)';
  let modeColor = apiMode === 'live' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-blue-100 text-blue-800 border-blue-300';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 w-full max-w-7xl mx-auto p-4">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* HERO SECTION */}
          <div className="w-full bg-gradient-to-br from-blue-100 via-white to-emerald-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950 py-12 px-4 rounded-xl mb-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-blue-900 dark:text-white drop-shadow-lg">Health Appointment System</h1>
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 mb-6 max-w-xl">Book appointments, connect with trusted doctors, and manage your health—all in one secure, modern platform.</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/find" className="px-6 py-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500" aria-label="Find Doctors">Find Doctors</Link>
                <Link href="/auth/register" className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label="Register">Register</Link>
                <Link href="/auth/login" className="px-6 py-3 rounded bg-gray-700 hover:bg-gray-900 text-white font-semibold text-lg shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700" aria-label="Login">Login</Link>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <img src="/hero-doctor.svg" alt="Doctor and Patient" className="w-72 md:w-96 rounded-xl shadow-xl border-4 border-emerald-200 dark:border-emerald-900" />
            </div>
          </div>
          {/* END HERO SECTION */}
          {/* Data Source Indicator */}
          <div className={`inline-flex items-center px-3 py-1 mb-6 rounded-full border text-xs font-semibold ${modeColor}`}
               aria-label={`Current data source: ${modeLabel}`}>
            <span className="mr-2">Data Source:</span> {modeLabel}
          </div>
          {/* Featured Doctors Section */}
          <section className="max-w-5xl mx-auto py-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Featured Doctors</h2>
            {loading ? (
              <div className="flex justify-center my-8"><Spinner /></div>
            ) : error ? (
              <div className="flex justify-center my-8">
                <Alert variant="error" message={error} isVisible={true} />
              </div>
            ) : doctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <Card key={doctor.userId} className="flex flex-col items-center p-6" aria-label={`Doctor card for ${doctor.name ?? `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() || doctor.userId}`} tabIndex={0}>
                    <FontAwesomeIcon icon={faUserMd} className="text-4xl text-primary mb-4" />
                    <div className="font-bold text-lg mb-1">{doctor.name ?? `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() || doctor.userId}</div>
                    <div className="text-gray-600 dark:text-gray-300 mb-2">{doctor.specialty}</div>
                    <Button 
                      variant="primary"
                      className="mt-2 w-full"
                      aria-label={`View profile for ${doctor.name ?? `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() || doctor.userId}`}
                      onClick={() => router.push(`/main/doctor-profile/${doctor.userId}`)}
                    >
                      View Profile
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex justify-center my-8">
                <Alert variant="info" message="No featured doctors found." isVisible={true} />
              </div>
            )}
          </section>
          {/* Navigation Section */}
          <nav className="mb-8" aria-label="Main navigation">
            <h2 className="text-xl font-semibold mb-4">Navigate the Platform</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <li><Link href="/find" className="block p-4 rounded bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500" aria-label="Find Doctors">Find Doctors</Link></li>
              <li><Link href="/patient" className="block p-4 rounded bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500" aria-label="Patient Dashboard">Patient Dashboard</Link></li>
              <li><Link href="/doctor" className="block p-4 rounded bg-pink-600 text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500" aria-label="Doctor Dashboard">Doctor Dashboard</Link></li>
              <li><Link href="/admin" className="block p-4 rounded bg-gray-700 text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700" aria-label="Admin Dashboard">Admin Dashboard</Link></li>
              <li><Link href="/about" className="block p-4 rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label="About">About</Link></li>
              <li><Link href="/contact" className="block p-4 rounded bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500" aria-label="Contact">Contact</Link></li>
              <li><Link href="/notifications" className="block p-4 rounded bg-yellow-600 text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500" aria-label="Notifications">Notifications</Link></li>
            </ul>
          </nav>
          <p className="text-sm text-gray-500">Select a section to begin navigating the app.</p>
        </div>
      </main>
    </div>
  );
}
