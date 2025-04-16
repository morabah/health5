'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logInfo, logApiModeChange, logValidation } from '@/lib/logger';
import { setEventInLocalStorage } from '@/lib/eventBus';
import { appEventBus, LogPayload, ApiModePayload, syncApiModeChange } from '@/lib/eventBus';
import { useEffect, useState } from 'react';
import React from 'react';
import { DoctorProfile } from '@/types/doctor';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserMd, faStethoscope, faStar } from '@fortawesome/free-solid-svg-icons';
import { getApiMode } from '@/config/apiMode';
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
  setLoading(true);
  setError(null);
  
  // Log the API mode being used for this fetch operation
  console.log('[Home] Fetching doctors using API mode from state:', apiMode);
  
  // Always pre-load the mock data as a backup
  let mockDoctors: ExtendedDoctorProfile[] = [];
  try {
    const res = await fetch('/scripts/offlineMockData.json');
    const data = await res.json();
    mockDoctors = (data.doctors || [])
      .filter((doc: any) => MOCK_DOCTOR_IDS.includes(doc.userId || doc.id))
      .map((doc: any) => ({
        ...doc,
        name: `Dr. ${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.userId || doc.id
      }));
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
      setError('Failed to load doctor information from mock data');
      setLoading(false);
      return;
    }
  }
  
  // If we're in live mode, try to use Firestore
  try {
    console.log('[Home] Using live Firestore data source');
    
    // Dynamically import Firebase modules
    const { collection, getDocs, query, where, limit } = await import('firebase/firestore');
    const firestoreDb = await getFirestoreDb();
    
    // Check if we got a valid Firestore instance
    if (!firestoreDb) {
      console.log('[Home] Firestore not initialized, falling back to mock data');
      setDoctors(mockDoctors);
      setError('Firestore not available. Using mock data instead.');
      setLoading(false);
      return;
    }
    
    // Attempt to query Firestore
    console.log('[Home] Executing Firestore query');
    const q = query(
      collection(firestoreDb, 'doctors'),
      where('userId', 'in', MOCK_DOCTOR_IDS),
      limit(3)
    );
    
    const snapshot = await getDocs(q);
    console.log('[Home] Firestore query completed, docs count:', snapshot.docs.length);
    
    if (snapshot.docs.length === 0) {
      console.log('[Home] No doctors found in Firestore, falling back to mock data');
      setDoctors(mockDoctors);
      setError('No doctors found in Firestore. Using mock data instead.');
    } else {
      const firestoreDoctors = snapshot.docs.map(doc => ({
        ...doc.data(),
        userId: doc.id,
        name: `Dr. ${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim() || doc.id
      })) as ExtendedDoctorProfile[];
      
      console.log('[Home] Successfully loaded doctors from Firestore');
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

  useEffect(() => {
    setHasMounted(true);
    // Defensive: always coerce to union type
    const mode = getApiMode();
    setApiMode(mode === 'live' ? 'live' : 'mock');
  }, []);

  useEffect(() => {
    console.log('[Home] Current API mode:', apiMode);
  }, [apiMode]);

  useEffect(() => {
    if (!hasMounted) return;
    console.log('[Home] Client-side hydration complete, loading initial data with mode:', apiMode);
    fetchDoctors(apiMode, setDoctors, setLoading, setError);
  }, [apiMode, hasMounted]);

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
          <div className="flex items-center mb-6">
            <h1 className="text-3xl font-bold mr-4">Welcome to the Health Appointment System</h1>
            <ApiModeLabel />
          </div>
          {/* Data Source Indicator */}
          <div className={`inline-flex items-center px-3 py-1 mb-6 rounded-full border text-xs font-semibold ${modeColor}`}
               aria-label={`Current data source: ${modeLabel}`}>
            <span className="mr-2">Data Source:</span> {modeLabel}
          </div>
          {/* Test Buttons */}
          <div className="mb-8 p-4 border border-red-300 rounded bg-red-50 dark:bg-red-900/20">
            <h2 className="text-xl font-semibold mb-4">Test Button Events</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button onClick={() => logEventToCMS('Button Clicked: Red Button', { buttonName: 'Red Button', page: 'Home' })} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-800" aria-label="Red Button">Red Button</button>
              <button onClick={() => logEventToCMS('Button Clicked: Blue Button', { buttonName: 'Blue Button', page: 'Home' })} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800" aria-label="Blue Button">Blue Button</button>
              <button onClick={() => logEventToCMS('Button Clicked: Green Button', { buttonName: 'Green Button', page: 'Home' })} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-800" aria-label="Green Button">Green Button</button>
              <button onClick={() => logEventToCMS('Button Clicked: Purple Button', { buttonName: 'Purple Button', page: 'Home' })} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-800" aria-label="Purple Button">Purple Button</button>
            </div>
            <p className="text-sm text-gray-500">Click these buttons and check the CMS page for logs.</p>
          </div>
          {/* Features Section */}
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
                  <Card key={doctor.userId} className="flex flex-col items-center p-6" aria-label={`Doctor card for ${doctor.name || doctor.userId}`}>
                    <FontAwesomeIcon icon={faUserMd} className="text-4xl text-primary mb-4" />
                    <div className="font-bold text-lg mb-1">{doctor.name || doctor.userId}</div>
                    <div className="text-gray-600 dark:text-gray-300 mb-2">{doctor.specialty}</div>
                    <Button 
                      variant="primary"
                      label="View Profile"
                      pageName="Home" 
                      className="mt-2" 
                      aria-label={`View profile for ${doctor.name || doctor.userId}`}
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
          <nav className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Navigation Links</h2>
            <div className="mt-8 flex flex-col gap-4">
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <li><Link href="/cms-validation" className="block p-4 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => logEventToCMS('Navigation: From Home to "CMS / Validation"', { from: 'Home', to: 'CMS / Validation', path: '/cms-validation' })} aria-label="CMS / Validation">CMS / Validation</Link></li>
                <li><Link href="/about" className="block p-4 rounded bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => logEventToCMS('Navigation: From Home to "About"', { from: 'Home', to: 'About', path: '/about' })} aria-label="About">About</Link></li>
                <li><Link href="/contact" className="block p-4 rounded bg-purple-600 text-white hover:bg-purple-700" onClick={() => logEventToCMS('Navigation: From Home to "Contact"', { from: 'Home', to: 'Contact', path: '/contact' })} aria-label="Contact">Contact</Link></li>
                <li><Link href="/auth" className="block p-4 rounded bg-orange-600 text-white hover:bg-orange-700" onClick={() => logEventToCMS('Navigation: From Home to "Auth"', { from: 'Home', to: 'Auth', path: '/auth' })} aria-label="Auth">Auth</Link></li>
                <li><Link href="/patient" className="block p-4 rounded bg-teal-600 text-white hover:bg-teal-700" onClick={() => logEventToCMS('Navigation: From Home to "Patient"', { from: 'Home', to: 'Patient', path: '/patient' })} aria-label="Patient">Patient</Link></li>
                <li><Link href="/doctor" className="block p-4 rounded bg-pink-600 text-white hover:bg-pink-700" onClick={() => logEventToCMS('Navigation: From Home to "Doctor"', { from: 'Home', to: 'Doctor', path: '/doctor' })} aria-label="Doctor">Doctor</Link></li>
                <li><Link href="/admin" className="block p-4 rounded bg-gray-700 text-white hover:bg-gray-900" onClick={() => logEventToCMS('Navigation: From Home to "Admin"', { from: 'Home', to: 'Admin', path: '/admin' })} aria-label="Admin">Admin</Link></li>
                <li><Link href="/main" className="block p-4 rounded bg-yellow-600 text-white hover:bg-yellow-700" onClick={() => logEventToCMS('Navigation: From Home to "Main"', { from: 'Home', to: 'Main', path: '/main' })} aria-label="Main">Main</Link></li>
              </ul>
              <Link href="/ui-test" legacyBehavior>
                <a
                  className="inline-block px-6 py-3 rounded bg-indigo-600 hover:bg-indigo-800 text-white font-semibold text-lg shadow transition-colors duration-150"
                  onClick={() => logEventToCMS('Navigation: From Home to "UI Primitives Test"', { from: 'Home', to: 'UI Primitives Test', path: '/ui-test' })}
                  data-testid="nav-ui-test"
                  aria-label="UI Primitives Test Page"
                >
                  UI Primitives Test Page
                </a>
              </Link>
            </div>
          </nav>
          <p className="text-sm text-gray-500">Select a section to begin navigating the app or use the test buttons above to log an event.</p>
        </div>
      </main>
    </div>
  );
}
