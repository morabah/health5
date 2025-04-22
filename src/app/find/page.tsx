"use client";
import React, { useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { initializeFirebaseClient, isFirebaseReady } from '@/lib/improvedFirebaseClient';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getApiMode, setApiMode } from '@/config/apiConfig';
import type { DoctorProfile } from '@/types/doctor';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ApiModeIndicator from '@/components/ui/ApiModeIndicator';
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { debounce } from "@/utils/helpers";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  UserIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { StarIcon } from '@heroicons/react/24/solid';

// Define list item shape joining profile with UI fields
type DoctorListItem = DoctorProfile & {
  id: string;
  name: string;
  fee: number;           // from consultationFee
  available: boolean;    // default true
  profilePicUrl: string; // from profilePictureUrl
  nextAvailable: string; // computed slot
  rating: number;        // default 0
};

const specialtyOptions = [
  { value: "", label: "All Specialties" },
  { value: "Cardiology", label: "Cardiology" },
  { value: "Dermatology", label: "Dermatology" },
  { value: "Pediatrics", label: "Pediatrics" },
  { value: "Neurology", label: "Neurology" },
  { value: "Orthopedics", label: "Orthopedics" },
  { value: "Oncology", label: "Oncology" },
  { value: "Psychiatry", label: "Psychiatry" },
  { value: "Radiology", label: "Radiology" },
  { value: "General Surgery", label: "General Surgery" },
  { value: "Family Medicine", label: "Family Medicine" },
];

const locationOptions = [
  { value: "", label: "All Locations" },
  { value: "New York", label: "New York" },
  { value: "San Francisco", label: "San Francisco" },
  { value: "Chicago", label: "Chicago" },
  { value: "Houston", label: "Houston" },
];

const languageOptions = [
  { value: "", label: "All Languages" },
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "Mandarin", label: "Mandarin" },
  { value: "Hindi", label: "Hindi" },
  { value: "Portuguese", label: "Portuguese" },
];

export default function FindDoctorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = React.useState<DoctorListItem[]>([]);
  const [filteredDoctors, setFilteredDoctors] = React.useState<DoctorListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useLocalStorage<string>('find_searchQuery', '');
  const [specialty, setSpecialty] = useLocalStorage<string>('find_specialty', '');
  const [location, setLocation] = useLocalStorage<string>('find_location', '');
  const [language, setLanguage] = useLocalStorage<string>('find_language', '');
  const [showFilters, setShowFilters] = useLocalStorage<boolean>('find_showFilters', false);
  const [availableOnly, setAvailableOnly] = useLocalStorage<boolean>('find_availableOnly', false);
  const [sortBy, setSortBy] = React.useState<string>('rating');

  // Process doctor data: compute display name and UI-specific fields
  const processDoctorData = (doctorData: (DoctorProfile & { id: string })[]): DoctorListItem[] => {
    return doctorData.map(doctor => {
      // Extract all data including any extra fields from Firestore
      const docData = doctor as any;
      
      // Use firstName + lastName if available in the document data
      let displayName = '';
      
      if (docData.firstName && docData.lastName) {
        displayName = `Dr. ${docData.firstName} ${docData.lastName}`;
      } else {
        // Fallback to user record attached info if available
        displayName = doctor.verificationData?.fullName ?? `Doctor (ID: ${doctor.id.substring(0, 8)})`;
      }

      // Generate a next available slot for now
      const nextAvailable = getRandomTimeSlot();

      // Ensure consultationFee is present
      const fee = doctor.consultationFee || 100;

      return {
        ...doctor,
        name: displayName,
        fee: fee,
        available: true,
        profilePicUrl: doctor.profilePictureUrl ?? '',
        nextAvailable,
        rating: Math.floor(Math.random() * 5) + 1 // Random rating 1-5 for demo
      };
    });
  };

  // Generate a random time slot for demonstration
  const getRandomTimeSlot = () => {
    const hours = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
    const minutes = Math.random() > 0.5 ? '00' : '30';
    const daysAhead = Math.floor(Math.random() * 5) + 1; // 1-5 days ahead
    
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    
    return `${month} ${day}, ${hours}:${minutes}`;
  };

  // Fetch doctors based on filters
  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      // ALWAYS use live mode and Firebase for the /find route
      console.log('[FindDoctorPage] Forcing LIVE mode for /find route');
      
      // Force API mode to live for this route
      const originalMode = getApiMode();
      if (originalMode !== 'live') {
        console.log(`[FindDoctorPage] Temporarily overriding API mode from ${originalMode} to live`);
        setApiMode('live');
      }
      
      // Initialize Firebase with forced 'live' mode
      const { db, status } = initializeFirebaseClient('live');
      console.log(`[FindDoctorPage] Firebase/Firestore initialized: ${!!db}`);
      
      // If Firestore is available, use it
      if (isFirebaseReady() && db) {
        console.log('[FindDoctorPage] Using Firestore to fetch doctors');
        try {
          // --- CHANGED: Use 'users' collection to fetch doctors by userType ---
          const doctorsRef = collection(db, 'users'); // users collection holds all user profiles
          const constraints: any[] = [where('userType', '==', 'DOCTOR')]; // Only fetch doctors
          if (specialty) constraints.push(where('specialty', '==', specialty));
          if (location) constraints.push(where('location', '==', location));
          const q = constraints.length ? query(doctorsRef, ...constraints) : doctorsRef;

          console.log('[FindDoctorPage] Executing Firestore query (users collection, userType=DOCTOR)...');
          const snapshot = await getDocs(q);

          console.log(`[FindDoctorPage] Firestore query returned ${snapshot.size} results`);

          if (snapshot.empty) {
            console.log('[FindDoctorPage] No doctors found in Firestore');
            setDoctors([]);
            setFilteredDoctors([]);
          } else {
            // Process Firestore results
            console.log('[FindDoctorPage] Processing Firestore results');
            const results = snapshot.docs.map(doc => ({
              id: doc.id,
              ...(doc.data() as DoctorProfile)
            }));

            // Process and set doctor data
            const processedResults = processDoctorData(results);
            setDoctors(processedResults);
            applyFilters(processedResults, searchQuery, specialty, location, language, availableOnly);
            console.log('[FindDoctorPage] Successfully loaded doctors from Firestore');
          }
          
          // Restore original API mode if it was changed
          if (originalMode !== 'live') {
            console.log(`[FindDoctorPage] Restoring API mode to ${originalMode}`);
            setApiMode(originalMode);
          }
          
          return;
        } catch (firestoreError) {
          console.error('[FindDoctorPage] Firestore query error:', firestoreError);
          // Show error instead of using mock data
          setError('Failed to fetch doctors from database');
          setDoctors([]);
          setFilteredDoctors([]);
          
          // Restore original API mode if it was changed
          if (originalMode !== 'live') {
            console.log(`[FindDoctorPage] Restoring API mode to ${originalMode}`);
            setApiMode(originalMode);
          }
          
          return;
        }
      } else {
        console.warn('[FindDoctorPage] Firestore not initialized, showing error');
        // Show error instead of using mock data
        setError('Firebase database not available. Please try again later.');
        setDoctors([]);
        setFilteredDoctors([]);
      }
    } catch (err) {
      console.error('[FindDoctorPage] Error fetching doctors:', err);
      setError('Failed to load doctors. Please check your connection and try again.');
      setDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount and when filters change
  React.useEffect(() => {
    fetchDoctors();
  }, [specialty, location]);

  // Apply all filters to the doctor list
  const applyFilters = useCallback((
    doctorList: DoctorListItem[], 
    query: string, 
    specialty: string, 
    location: string, 
    language: string,
    availableOnly: boolean
  ) => {
    let filtered = [...doctorList];
    
    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(doctor => {
        const fullName = doctor.name.toLowerCase();
        return fullName.includes(lowerQuery) || 
              (doctor.specialty && doctor.specialty.toLowerCase().includes(lowerQuery));
      });
    }
    
    // Filter by language (client-side filter)
    if (language) {
      filtered = filtered.filter(doctor => 
        doctor.languages && doctor.languages.some(lang => 
          lang.toLowerCase().includes(language.toLowerCase())
        )
      );
    }
    
    // Filter by availability
    if (availableOnly) {
      filtered = filtered.filter(doctor => doctor.available);
    }
    
    setFilteredDoctors(filtered);
  }, []);

  // Debounce search to avoid too many re-renders
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      applyFilters(doctors, query, specialty, location, language, availableOnly);
    }, 300),
    [doctors, specialty, location, language, availableOnly, applyFilters]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Update filters when any filter changes
  React.useEffect(() => {
    applyFilters(doctors, searchQuery, specialty, location, language, availableOnly);
  }, [doctors, searchQuery, specialty, location, language, availableOnly, applyFilters]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSpecialty('');
    setLocation('');
    setLanguage('');
    setAvailableOnly(false);
  };

  // Navigate to doctor profile
  const viewDoctorProfile = (doctorId: string) => {
    router.push(`/main/doctor-profile/${doctorId}`);
  };

  // Navigate to booking page
  const bookAppointment = (event: React.MouseEvent, doctorId: string) => {
    event.stopPropagation();
    
    // Check if user is logged in
    if (!user) {
      toast.error("Please log in to book an appointment");
      router.push('/auth/login');
      return;
    }
    
    // Navigate to booking page
    router.push(`/main/book-appointment/${doctorId}`);
    toast.success("Navigating to booking page...");
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const parseNextAvailable = (next?: string) => next ? new Date(next).getTime() : Infinity;
  const sortedDoctors = React.useMemo(() => {
    const list = [...filteredDoctors];
    switch(sortBy) {
      case 'rating': return list.sort((a,b) => (b.rating||0)-(a.rating||0));
      case 'feeLowHigh': return list.sort((a,b) => a.fee-b.fee);
      case 'feeHighLow': return list.sort((a,b) => b.fee-a.fee);
      case 'nextAvailable': return list.sort((a,b) => parseNextAvailable(a.nextAvailable)-parseNextAvailable(b.nextAvailable));
      case 'distance': return list;
      default: return list;
    }
  }, [filteredDoctors, sortBy]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Find a Doctor</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Search for healthcare specialists matching your needs
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <ApiModeIndicator />
          </div>
        </div>
        
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap items-center flex-1 space-x-4">
            <div className="relative flex-grow md:flex-grow-0 w-full md:w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <Input id="search" type="text" placeholder="Search by name or specialty" value={searchQuery} onChange={handleSearchChange} className="pl-10 w-full" />
            </div>
            <Select value={specialty} onChange={(e)=>setSpecialty(e.target.value)} options={specialtyOptions} className="w-40 hidden sm:block" />
            <Select value={location} onChange={(e)=>setLocation(e.target.value)} options={locationOptions} className="w-40 hidden sm:block" />
            <div className="flex items-center space-x-2">
              <label htmlFor="sort" className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
              <Select id="sort" value={sortBy} onChange={(e)=>setSortBy(e.target.value)} options={[{value:'rating',label:'Rating'},{value:'feeLowHigh',label:'Fee Low→High'},{value:'feeHighLow',label:'Fee High→Low'},{value:'nextAvailable',label:'Next Available'},{value:'distance',label:'Distance'}]} className="w-40" />
            </div>
          </div>
          <button className="md:hidden inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded" onClick={()=>setShowFilters(true)}>
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />Filters
          </button>
        </div>

        {/* Mobile Filters Overlay */}
        {showFilters && (
          <div className="fixed inset-0 z-50 flex">
            <div className="w-64 bg-white dark:bg-gray-800 p-6 shadow-xl overflow-auto">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Filters</h2>
              <div className="space-y-4">
                <div><label htmlFor="mobile-specialty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialty</label><Select id="mobile-specialty" value={specialty} onChange={(e)=>setSpecialty(e.target.value)} options={specialtyOptions} /></div>
                <div><label htmlFor="mobile-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label><Select id="mobile-location" value={location} onChange={(e)=>setLocation(e.target.value)} options={locationOptions} /></div>
                <div><label htmlFor="mobile-language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label><Select id="mobile-language" value={language} onChange={(e)=>setLanguage(e.target.value)} options={languageOptions} /></div>
                <div className="flex items-center"><input id="mobile-available" type="checkbox" checked={availableOnly} onChange={(e)=>setAvailableOnly(e.target.checked)} className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"/><label htmlFor="mobile-available" className="text-sm text-gray-700 dark:text-gray-300">Available only</label></div>
              </div>
              <div className="mt-6 space-y-2">
                <Button onClick={handleResetFilters} variant="secondary" className="w-full" label="Reset" pageName="FindDoctorPage">
                  Reset
                </Button>
                <Button onClick={() => setShowFilters(false)} variant="primary" className="w-full" label="Apply" pageName="FindDoctorPage">
                  Apply
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-black bg-opacity-50" onClick={()=>setShowFilters(false)}/>
          </div>
        )}
        
        <section>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6" role="alert">
              <p>{error}</p>
              <Button
                variant="secondary"
                onClick={fetchDoctors}
                className="mt-2"
                label="Try Again"
                pageName="FindDoctorPage"
              >
                Try Again
              </Button>
            </div>
          )}
          
          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col justify-center items-center min-h-[400px]">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading doctors...</p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              {!error && filteredDoctors.length > 0 && (
                <div className="flex justify-between items-center mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center">
                    <div className="mr-3 bg-blue-100 dark:bg-blue-800 rounded-full p-2">
                      <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-blue-700 dark:text-blue-300">
                      Found <span className="font-semibold">{filteredDoctors.length}</span> {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} matching your criteria
                    </p>
                  </div>
                </div>
              )}
              
              {/* Empty State */}
              {!error && filteredDoctors.length === 0 && (
                <EmptyState
                  icon={<InformationCircleIcon className="w-16 h-16 text-blue-500" />}
                  title="No Data Available in Database"
                  message="There are currently no doctors in our Firestore database. This page is configured to display real data from Firebase, but no records exist yet."
                  action={
                    <div className="flex flex-col items-center">
                      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 max-w-md">
                        If you're an administrator, you can add doctor records to the Firestore 'doctors' collection.
                      </p>
                      <Button 
                        onClick={fetchDoctors}
                        variant="primary"
                        label="Refresh Data"
                        pageName="FindDoctorPage"
                      >
                        Refresh Data
                      </Button>
                    </div>
                  }
                  className="p-10"
                />
              )}
              
              {/* Doctors Grid */}
              {!error && filteredDoctors.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedDoctors.map((doctor) => (
                    <div 
                      key={doctor.id}
                      className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                      onClick={() => viewDoctorProfile(doctor.id)}
                    >
                      <Card className="h-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                        {/* Header with gradient background */}
                        <div className="relative">
                          <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                          <div className="absolute top-4 right-4">
                            {doctor.available ? (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
                                Available
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1.5 rounded-full border border-red-200 shadow-sm">
                                Unavailable
                              </span>
                            )}
                          </div>
                          
                          {/* Doctor Image */}
                          <div className="absolute -bottom-12 left-6">
                            <img
                              src={doctor.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=0D8ABC&color=fff&size=128`}
                              alt={doctor.name}
                              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=0D8ABC&color=fff&size=128`;
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Doctor Details */}
                        <div className="p-6 flex flex-col flex-1 pt-16">
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {doctor.name}
                          </h2>
                          
                          <div className="flex items-center text-blue-600 dark:text-blue-400 mb-4">
                            <BriefcaseIcon className="w-4 h-4 mr-2" />
                            <span className="font-medium">{doctor.specialty || 'General Practice'}</span>
                          </div>
                          
                          {doctor.rating !== undefined && (
                            <div className="flex items-center space-x-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <StarIcon key={i} className={`w-4 h-4 ${i < doctor.rating! ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                              ))}
                              <span className="text-sm text-gray-600 dark:text-gray-400">({doctor.rating})</span>
                            </div>
                          )}
                          
                          <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <MapPinIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                              <span>{doctor.location || 'Location not specified'}</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <UserIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                              <span>{doctor.yearsOfExperience} years of experience</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <GlobeAltIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                              <span>{doctor.languages?.join(', ') || 'English'}</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <CurrencyDollarIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                              <span>Consultation fee: ${doctor.fee}</span>
                            </div>
                          </div>
                          
                          {doctor.nextAvailable && doctor.available && (
                            <div className="mt-4 py-2 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                                <ClockIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                                <span>Next Available: {doctor.nextAvailable}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-auto">
                            <Button
                              onClick={(e) => bookAppointment(e, doctor.id)}
                              variant="primary"
                              className="flex-1 py-2.5"
                              disabled={!doctor.available}
                              label={doctor.available ? "Book Appointment" : "Unavailable"}
                              pageName="FindDoctorPage"
                            >
                              {doctor.available ? "Book Appointment" : "Unavailable"}
                            </Button>
                            <Button
                              variant="secondary"
                              className="flex-1 py-2.5"
                              label="View Profile"
                              pageName="FindDoctorPage"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewDoctorProfile(doctor.id);
                              }}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
