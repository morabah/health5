"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadDoctorAvailability, DoctorAvailabilitySlot } from '@/data/loadDoctorAvailability';
import { formatDate, formatTimeString } from '@/utils/helpers';
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { debounce } from "@/utils/helpers";
import EmptyState from "@/components/ui/EmptyState";
import ApiModeIndicator from "@/components/ui/ApiModeIndicator";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { 
  StarIcon, 
  MapPinIcon, 
  GlobeAltIcon, 
  BriefcaseIcon, 
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, HeartIcon } from "@heroicons/react/24/solid";
import { getFirestore, doc, getDoc, collection, getDocs, QuerySnapshot, DocumentData } from "firebase/firestore";
import { initializeFirebaseClient } from "@/lib/improvedFirebaseClient";

interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  specialty: string;
  experience: number;
  location: string;
  languages: string[];
  fee: number;
  available: boolean;
  profilePicUrl: string | null;
  userId: string;
  bio?: string;
  rating?: number;
  nextAvailable?: string;
}

const specialtyOptions = [
  { value: "", label: "All Specialties" },
  { value: "Cardiology", label: "Cardiology" },
  { value: "Dermatology", label: "Dermatology" },
  { value: "Pediatrics", label: "Pediatrics" },
  { value: "Neurology", label: "Neurology" },
  { value: "Orthopedics", label: "Orthopedics" },
  { value: "Psychiatry", label: "Psychiatry" },
  { value: "General", label: "General Practice" },
];

const locationOptions = [
  { value: "", label: "All Locations" },
  { value: "New York", label: "New York" },
  { value: "Los Angeles", label: "Los Angeles" },
  { value: "Chicago", label: "Chicago" },
  { value: "Boston", label: "Boston" },
  { value: "San Francisco", label: "San Francisco" },
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

export default function FindDoctorsPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [debugUserProfile, setDebugUserProfile] = useState<any>(null); // For UI debug
  const router = useRouter();

  useEffect(() => {
    async function fetchDoctorsFromUsersCollection() {
      setLoading(true);
      setError(null);
      try {
        initializeFirebaseClient('live');
        const db = getFirestore();
        // Fetch all user profiles from Firestore
        const userSnap: QuerySnapshot<DocumentData> = await getDocs(collection(db, 'users'));
        // Filter for doctors only - use a more flexible approach to find all doctors
        const doctorUsers = userSnap.docs
          .map(doc => {
            const data = doc.data();
            const id = doc.id;
            
            // Log the first few documents to see their structure
            if (doctorUsers && doctorUsers.length < 3) {
              console.log(`[FindDoctorPage] Raw doctor document ${id}:`, data);
            }
            
            return { ...data, id };
          })
          .filter(user => 
            // Check multiple possible fields to identify doctors
            user.userType === 'DOCTOR' || 
            user.role === 'DOCTOR' || 
            user.doctorInfo || 
            user.isDoctorProfile === true
          );

        console.log(`[FindDoctorPage] Found ${doctorUsers.length} doctor users`);
        
        // Map to Doctor interface with enhanced name detection
        const enrichedDoctors: Doctor[] = doctorUsers.map((user: any) => {
          // Try to extract firstName and lastName from different possible structures
          let firstName = '';
          let lastName = '';
          
          // Check direct fields
          if (user.firstName) firstName = user.firstName;
          if (user.lastName) lastName = user.lastName;
          
          // Check nested fields (e.g. user.profile.firstName)
          if (user.profile && user.profile.firstName) firstName = user.profile.firstName;
          if (user.profile && user.profile.lastName) lastName = user.profile.lastName;
          
          // Check doctorInfo fields if they exist
          if (user.doctorInfo && user.doctorInfo.firstName) firstName = user.doctorInfo.firstName;
          if (user.doctorInfo && user.doctorInfo.lastName) lastName = user.doctorInfo.lastName;
          
          // Check name field if it exists (some systems store full name in a single field)
          if (user.name && typeof user.name === 'string' && !firstName && !lastName) {
            const nameParts = user.name.split(' ');
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else {
              firstName = user.name;
            }
          }
          
          // Use displayName as fallback
          if (user.displayName && typeof user.displayName === 'string' && !firstName && !lastName) {
            const nameParts = user.displayName.split(' ');
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else {
              firstName = user.displayName;
            }
          }
          
          console.log(`[FindDoctorPage] Doctor ${user.id}: firstName='${firstName}', lastName='${lastName}'`);
          
          return {
            id: user.id,
            userId: user.id,
            name: `${firstName || ''} ${lastName || ''}`.trim() || `Doctor (ID: ${user.id.substring(0, 8)})`,
            firstName: firstName || '',
            lastName: lastName || '',
            specialty: user.specialty || (user.doctorInfo ? user.doctorInfo.specialty : '') || '',
            experience: user.yearsOfExperience || (user.doctorInfo ? user.doctorInfo.yearsOfExperience : 0) || 0,
            location: user.location || (user.doctorInfo ? user.doctorInfo.location : '') || '',
            languages: user.languages || (user.doctorInfo ? user.doctorInfo.languages : []) || [],
            fee: user.consultationFee || (user.doctorInfo ? user.doctorInfo.consultationFee : 0) || 0,
            available: user.available !== undefined ? user.available : true,
            profilePicUrl: user.profilePictureUrl || (user.doctorInfo ? user.doctorInfo.profilePictureUrl : null) || null,
            bio: user.bio || (user.doctorInfo ? user.doctorInfo.bio : '') || '',
            rating: user.rating || (user.doctorInfo ? user.doctorInfo.rating : (Math.random() * 1.5 + 3.5).toFixed(1)) || (Math.random() * 1.5 + 3.5).toFixed(1),
          };
        });
        setDoctors(enrichedDoctors);
        applyFilters(enrichedDoctors, searchQuery, specialty, location, language);
      } catch (e) {
        setError('Failed to load doctors from Firestore users collection. Please try again later.');
        console.error('Error fetching doctors from Firestore users collection:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctorsFromUsersCollection();
  }, [specialty, location]);

  // Fetch nextAvailable for each doctor from Firestore
  useEffect(() => {
    async function enrichNext() {
      const now = new Date();
      try {
        const updates = await Promise.all(doctors.map(async doctor => {
          try {
            const slots: DoctorAvailabilitySlot[] = await loadDoctorAvailability(doctor.userId);
            const upcoming = slots
              .filter(slot => slot.available)
              .map(slot => ({ ...slot, dateTime: new Date(`${slot.date}T${slot.time}`) }))
              .filter(slot => slot.dateTime > now)
              .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
            const next = upcoming.length > 0
              ? `${formatDate(upcoming[0].dateTime, 'medium')} ${formatTimeString(upcoming[0].time)}`
              : null;
            return { id: doctor.id, nextAvailable: next };
          } catch (err) {
            console.warn(`[FindDoctorPage] Error loading availability for doctor ${doctor.id}:`, err);
            return { id: doctor.id, nextAvailable: null };
          }
        }));
        setDoctors(prev => prev.map(doc => {
          const found = updates.find(u => u.id === doc.id);
          if (found) {
            // nextAvailable should be string | undefined, never null
            const nextAvailable = found.nextAvailable ?? undefined;
            return {
              ...doc,
              nextAvailable,
              available: !!nextAvailable
            };
          }
          return doc;
        }));
      } catch (err) {
        console.error('Error fetching next available slots for doctors', err);
      }
    }
    if (doctors.length > 0) enrichNext();
  }, [doctors]);

  // Apply filters whenever filter parameters change or the base doctor list updates
  const applyFilters = useCallback((doctorList: Doctor[], query: string, currentSpecialty: string, currentLocation: string, currentLanguage: string) => {
    console.log("[FindDoctorsPage] Applying filters:", { query, currentSpecialty, currentLocation, currentLanguage });
    let filtered = [...doctorList];

    // Filter by specialty if provided (frontend filter for consistency)
    if (currentSpecialty) {
      filtered = filtered.filter(doctor => doctor.specialty === currentSpecialty);
    }
    
    // Filter by location if provided (frontend filter for consistency)
    if (currentLocation) {
      filtered = filtered.filter(doctor => doctor.location === currentLocation);
    }

    // Filter by search query (name or specialty match)
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(doctor => {
        const fullName = (doctor.name || '').toLowerCase();
        const spec = (doctor.specialty || '').toLowerCase();
        return fullName.includes(lowerQuery) || spec.includes(lowerQuery);
      });
    }

    // Apply language filter (frontend only)
    if (currentLanguage) {
      filtered = filtered.filter(doctor => 
        doctor.languages && doctor.languages.some(lang => 
          lang.toLowerCase().includes(currentLanguage.toLowerCase())
        )
      );
    }

    console.log("[FindDoctorsPage] Filtered doctors count:", filtered.length);
    setFilteredDoctors(filtered);
  // Ensure dependencies include all filters used inside
  }, []); // Removed dependencies as they are passed as arguments

  // Debounce search to avoid too many re-renders
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      applyFilters(doctors, query, specialty, location, language);
    }, 300),
    [doctors, specialty, location, language, applyFilters]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Update filters when language changes
  useEffect(() => {
    applyFilters(doctors, searchQuery, specialty, location, language);
  }, [doctors, searchQuery, specialty, location, language, applyFilters]);

  // Handle filter reset
  const handleResetFilters = () => {
    setSearchQuery("");
    setSpecialty("");
    setLocation("");
    setLanguage("");
  };

  // Navigate to doctor profile
  const viewDoctorProfile = (doctorId: string) => {
    router.push(`/main/doctor-profile/${doctorId}`);
  };

  // Direct booking navigation
  const bookAppointment = (event: React.MouseEvent, doctorId: string) => {
    event.stopPropagation();
    if (!user) {
      toast.error("Please log in to book an appointment");
      router.push('/auth/login');
      return;
    }
    
    // Navigate to booking page with the doctor ID
    router.push(`/main/book-appointment/${doctorId}`);
    toast.success("Navigating to booking page...");
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      {/* ALWAYS show doctor userIds for debug */}
      <div style={{background: '#eef', color: '#003', padding: 8, margin: 8, border: '1px solid #00c'}}>
        <b>DEBUG: Doctor userIds being fetched from Firestore:</b>
        <pre style={{fontSize: 12}}>{JSON.stringify(doctors ? doctors.map(d => d.userId) : [], null, 2)}</pre>
        {(!doctors || doctors.length === 0) && <div>No doctors found. The array is empty.</div>}
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Find My Doctor</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Search for healthcare specialists matching your needs
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <ApiModeIndicator />
          </div>
        </div>
        
        {/* Search Bar - Always Visible */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
          <Input
                  id="search"
            type="text"
                  placeholder="Search by doctor name or specialty..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <div>
              <Button 
                onClick={toggleFilters}
                variant="secondary"
                className="w-full md:w-auto flex items-center justify-center gap-2"
                label={showFilters ? "Hide Filters" : "Show Filters"}
                pageName="FindDoctorsPage"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
          </div>
          
          {/* Advanced Filters - Toggleable */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Specialty
                  </label>
                  <Select
                    id="specialty"
            value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    options={specialtyOptions}
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <Select
                    id="location"
            value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    options={locationOptions}
                  />
                </div>
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <Select
                    id="language"
            value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    options={languageOptions}
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button 
                  onClick={handleResetFilters}
                  variant="secondary"
                  label="Reset Filters"
                  pageName="FindDoctorsPage"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6" role="alert">
            {error}
          </div>
        )}
        
        {/* Results Section */}
        {loading ? (
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading doctors...</p>
          </div>
        ) : (
          <>
            {!error && filteredDoctors.length === 0 ? (
              <EmptyState
                title="No doctors found"
                message="No doctors match your search criteria. Try adjusting your filters or search terms."
                className="my-12"
              />
            ) : (
              <>
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center">
                  <div className="mr-3 bg-blue-100 dark:bg-blue-800 rounded-full p-2">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-blue-700 dark:text-blue-300">
                    Found <span className="font-semibold">{filteredDoctors.length}</span> {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} matching your criteria
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredDoctors.map((doctor) => (
                    <div 
                      key={doctor.id}
                      className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                      onClick={() => viewDoctorProfile(doctor.id)}
                    >
                      <Card className="h-full overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
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
                        <div className="p-6 pt-16">
                          {/* Render doctor's name using data from Firestore user collection */}
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {doctor.firstName || doctor.lastName ? `${doctor.firstName} ${doctor.lastName}` : `Doctor (ID: ${doctor.id.substring(0, 8)})`}
                          </h2>
                          
                          <div className="flex items-center text-blue-600 dark:text-blue-400 mb-4">
                            <BriefcaseIcon className="w-4 h-4 mr-2" />
                            <span className="font-medium">{doctor.specialty || 'General Practice'}</span>
                          </div>
                          
                          <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <MapPinIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                              <span>{doctor.location || 'Location not specified'}</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <UserIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
                              <span>{doctor.experience || 0} years of experience</span>
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
                          
                          <div className="flex items-center gap-4 mt-6">
                            <Button
                              variant="secondary"
                              className="flex-1 py-2.5"
                              label="View Profile"
                              pageName="FindDoctorsPage"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewDoctorProfile(doctor.id);
                              }}
                            >
                              View Profile
                            </Button>
                            
                            <Button
                              onClick={(e) => bookAppointment(e, doctor.id)}
                              variant="primary"
                              className="flex-1 py-2.5"
                              disabled={!doctor.available}
                              label={doctor.available ? "Book Appointment" : "Unavailable"}
                              pageName="FindDoctorsPage"
                            >
                              {doctor.available ? "Book Appointment" : "Unavailable"}
                            </Button>
                  </div>
                </div>
              </Card>
                    </div>
            ))}
          </div>
              </>
            )}
          </>
        )}
      </div>
      {debugUserProfile && (
        <div style={{background: '#fee', color: '#900', padding: 8, margin: 8, border: '1px solid #900'}}>
          <b>DEBUG: First fetched user profile from Firestore:</b>
          <pre style={{fontSize: 12}}>{JSON.stringify(debugUserProfile, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
