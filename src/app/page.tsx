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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserMd, faCalendarCheck, faHospital, faMobileAlt, faShieldAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import ApiModeLabel from './ApiModeLabel';
import { collection, getDocs, query, where, limit, documentId } from 'firebase/firestore';

const MOCK_DOCTOR_IDS = ['user_doctor_1', 'user_doctor_2', 'user_doctor_3', 'user_doctor_4', 'user_doctor_5'];

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
    const { initializeFirebaseClient, isFirebaseReady } = await import('@/lib/improvedFirebaseClient');
    const { db, status } = initializeFirebaseClient(currentMode);
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

  // Only allow live mode
  if (apiMode !== 'live') {
    setDoctors([]);
    setError('This application is configured for live (cloud) data only. No mock data available.');
    setLoading(false);
    return;
  }

  try {
    console.log('[Home] Using live Firestore data source');
    const firebaseModules = await import('firebase/firestore');
    const { collection, getDocs, query, where, limit, documentId } = firebaseModules;
    console.log('[Home] Firebase modules imported, getting Firestore DB');
    const firestoreDb = await getFirestoreDb();
    if (!firestoreDb) {
      setDoctors([]);
      setError('Firestore not available.');
      setLoading(false);
      return;
    }
    // Attempt to query Firestore
    console.log('[Home] Executing Firestore query');
    const doctorIds = MOCK_DOCTOR_IDS.length > 10 ? MOCK_DOCTOR_IDS.slice(0, 10) : MOCK_DOCTOR_IDS;
    const q = query(
      collection(firestoreDb, 'doctors'),
      where(documentId(), 'in', doctorIds),
      limit(5)
    );
    console.log('[Home] Executing query with IDs:', doctorIds);
    const snapshot = await getDocs(q);
    console.log('[Home] Firestore query completed, docs count:', snapshot.docs.length);
    if (snapshot.docs.length === 0) {
      setDoctors([]);
      setError('No doctors found in Firestore.');
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
    setDoctors([]);
    setError(`Firestore error: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
          const { initializeFirebaseClient, isFirebaseReady } = await import('@/lib/improvedFirebaseClient');
          const { db, status } = initializeFirebaseClient(apiMode);
          console.log('[Home] Firebase initialized for mode:', apiMode, 'DB instance:', !!db, 'Status:', status);
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
    
    const updateApiModeState = (newMode: string, source: string) => {
      console.log(`[Home] API mode change detected from ${source}: ${newMode}`);
      
      // Get the current mode BEFORE updating state to log the 'from' value
      const oldMode = apiMode;
      
      // Safe cast to our union type
      const typedMode = newMode === 'live' ? 'live' : 'mock';
      
      // Always update our local state
      setApiMode(typedMode);
      
      // Update the global state + localStorage
      setGlobalApiMode(typedMode);
      
      // Broadcast the change to CMS with both old and new modes
      logApiModeChange(oldMode, typedMode, source);
    };
    
    // Event handler for in-memory event bus
    const handleApiModeChangeEvent = (payload: ApiModePayload) => {
      // Access payload.newMode instead of payload.mode
      const { newMode, source } = payload;
      console.log(`[Home] Received api_mode_change event from ${source || 'unknown'}: ${newMode}`);
      updateApiModeState(newMode, source || 'event');
    };
    
    // Register with in-memory event bus
    appEventBus.on('api_mode_change', handleApiModeChangeEvent);
    
    // Handle storage events from other tabs
    const handleBroadcastMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      
      const { type, payload } = event.data;
      if (type === 'api_mode_change' && payload?.mode) {
        console.log(`[Home] Received api_mode_change broadcast: ${payload.mode}`);
        updateApiModeState(payload.mode, 'broadcast');
      }
    };
    
    // Register storage event listener
    window.addEventListener('storage', (event) => {
      if (event.key === 'apiMode') {
        console.log(`[Home] Storage event: apiMode changed to ${event.newValue}`);
        if (event.newValue) {
          updateApiModeState(event.newValue, 'storage');
        }
      }
    });
    
    return () => {
      appEventBus.off('api_mode_change', handleApiModeChangeEvent);
      window.removeEventListener('storage', () => {});
    };
  }, [hasMounted]);

  // Track component mounting in CMS for user flow validation
  useEffect(() => {
    if (!hasMounted) return;
    logValidation("homepage-ui", "success");
  }, [hasMounted]);

  const modeColor = apiMode === 'live' 
    ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    
  const modeLabel = apiMode === 'live' ? "Live (Firebase)" : "Mock (Local)";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* API Mode indicator - small and subtle at the top */}
      <div className="fixed top-2 right-2 z-50">
        <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${modeColor}`}
             aria-label={`Current data source: ${modeLabel}`}>
          <span className="mr-1">API:</span> {modeLabel}
        </div>
      </div>

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 pt-12 pb-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 mb-10 lg:mb-0 lg:pr-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-indigo-900 dark:text-white leading-tight">
              Healthcare Made <span className="text-cyan-600 dark:text-cyan-400">Simple</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-700 dark:text-gray-200 max-w-xl">
              Book appointments, connect with trusted doctors, and manage your health—all in one secure, easy-to-use platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                label="Find Doctors"
                pageName="Home"
              >
                <Link href="/find">Find Doctors</Link>
              </Button>
              <Button 
                className="bg-white text-indigo-600 hover:bg-gray-100 border border-indigo-600 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                variant="secondary"
                label="Sign Up"
                pageName="Home"
              >
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <img 
                src="/hero-doctor.svg" 
                alt="Doctor with patient" 
                className="w-full max-w-lg mx-auto rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose Our Platform
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FontAwesomeIcon icon={faUserMd} className="text-4xl text-indigo-600 dark:text-indigo-400" />,
                title: "Verified Doctors",
                description: "All healthcare providers are thoroughly verified to ensure quality care."
              },
              {
                icon: <FontAwesomeIcon icon={faCalendarCheck} className="text-4xl text-indigo-600 dark:text-indigo-400" />,
                title: "Easy Scheduling",
                description: "Book, reschedule or cancel appointments with just a few clicks."
              },
              {
                icon: <FontAwesomeIcon icon={faHospital} className="text-4xl text-indigo-600 dark:text-indigo-400" />,
                title: "Comprehensive Care",
                description: "Access a wide range of medical specialties all in one place."
              },
              {
                icon: <FontAwesomeIcon icon={faMobileAlt} className="text-4xl text-indigo-600 dark:text-indigo-400" />,
                title: "Mobile Friendly",
                description: "Access your health information from any device, anywhere."
              },
              {
                icon: <FontAwesomeIcon icon={faShieldAlt} className="text-4xl text-indigo-600 dark:text-indigo-400" />,
                title: "Secure & Private",
                description: "Your health data is protected with enterprise-grade security."
              },
              {
                icon: <FontAwesomeIcon icon={faUserPlus} className="text-4xl text-indigo-600 dark:text-indigo-400" />,
                title: "Patient Portal",
                description: "Manage your health records, prescriptions, and appointments in one place."
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow dark:bg-gray-700">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Doctors Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Meet Our Specialists
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Our platform connects you with experienced healthcare professionals across various specialties.
          </p>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400 py-8">
              {error}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {doctors.slice(0, 3).map((doctor, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow dark:bg-gray-700">
                  <div className="bg-indigo-100 dark:bg-indigo-900 h-32 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUserMd} className="text-5xl text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{doctor.name}</h3>
                    <p className="text-indigo-600 dark:text-indigo-400 mb-4">{doctor.specialty}</p>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {doctor.bio || "Experienced healthcare professional dedicated to providing excellent patient care."}
                    </p>
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      label="View Profile"
                      pageName="Home"
                    >
                      <Link href={`/doctor/${doctor.userId}`}>View Profile</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          <div className="text-center mt-10">
            <Button 
              className="bg-transparent hover:bg-indigo-50 text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 px-6 py-3 rounded-lg"
              variant="secondary"
              label="Find More Doctors"
              pageName="Home"
            >
              <Link href="/find">Find More Doctors</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            What Our Users Say
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "This platform has completely transformed how I manage my healthcare. Booking appointments is now effortless!",
                author: "Sarah Johnson",
                role: "Patient"
              },
              {
                quote: "As a physician, I appreciate how streamlined the system is. It helps me focus more on patient care and less on administration.",
                author: "Dr. Michael Chen",
                role: "Cardiologist"
              },
              {
                quote: "The interface is intuitive and user-friendly. I can easily track all my family's appointments in one place.",
                author: "Robert Wilson",
                role: "Patient"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6 dark:bg-gray-700">
                <div className="mb-4 text-indigo-600 dark:text-indigo-400">
                  {/* Quote icon */}
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="mt-auto">
                  <p className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
                  <p className="text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-800 dark:to-cyan-800 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Healthcare Experience?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">Join thousands of patients and doctors who are already benefiting from our platform.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
              label="Get Started"
              pageName="Home"
            >
              <Link href="/auth/register">Get Started</Link>
            </Button>
            <Button 
              className="bg-transparent hover:bg-indigo-700 text-white border border-white px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all text-lg"
              variant="secondary"
              label="Learn More"
              pageName="Home"
            >
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Quick Access Links */}
      <section className="py-10 px-4 bg-gray-100 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { title: "Find Doctors", href: "/find" },
              { title: "Patient Dashboard", href: "/patient/dashboard" },
              { title: "Doctor Dashboard", href: "/doctor/dashboard" },
              { title: "Admin Dashboard", href: "/admin" },
              { title: "Appointments", href: "/patient/appointments" },
              { title: "About Us", href: "/about" },
            ].map((link, index) => (
              <Link 
                key={index} 
                href={link.href}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
