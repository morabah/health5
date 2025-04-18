"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadDoctors } from '@/data/loadDoctors';
import { mockFindDoctors } from "@/lib/mockApiService";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { debounce } from "@/utils/helpers";
import { formatTimeString } from "@/utils/helpers";
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
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { resetMockDataStoresForUser } from "@/data/resetMockDataStoresForUser";

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
  profilePicUrl: string;
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
  const [specialty, setSpecialty] = useLocalStorage<string>("find_doctors_specialty", "");
  const [location, setLocation] = useLocalStorage<string>("find_doctors_location", "");
  const [language, setLanguage] = useLocalStorage<string>("find_doctors_language", "");
  const [searchQuery, setSearchQuery] = useLocalStorage<string>("find_doctors_searchQuery", "");
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useLocalStorage<boolean>("find_doctors_showFilters", false);
  const router = useRouter();

  // Auto-reset mock data on first visit
  useEffect(() => {
    const flag = "health_app_mockResetDone";
    if (typeof window !== "undefined" && !window.localStorage.getItem(flag)) {
      window.localStorage.setItem(flag, "true");
      resetMockDataStoresForUser('doctor');
    }
  }, []);

  // Process doctor data to ensure names are properly formatted
  const processDoctorData = (doctorData: Doctor[]) => {
    return doctorData.map(doctor => {
      // Make sure each doctor has a properly formatted name
      let displayName = doctor.name;
      
      if (!displayName || displayName.trim() === '') {
        if (doctor.firstName || doctor.lastName) {
          displayName = `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
        } else {
          displayName = `Doctor (ID: ${doctor.userId.substring(0, 8)})`;
        }
      }
      
      // Add mock next available time if not present
      const nextAvailable = doctor.nextAvailable || getRandomTimeSlot();
      
      return {
        ...doctor,
        name: displayName,
        nextAvailable
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

  // Fetch all doctors initially
  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      try {
        // Using mockFindDoctors API
        let results;
        if (specialty || location) {
          results = await mockFindDoctors({ 
            specialty: specialty || undefined, 
            location: location || undefined 
          });
        } else {
          // Fallback to loadDoctors if no filters provided
          results = await loadDoctors();
        }
        
        // Process the results to ensure names are properly formatted
        const processedResults = processDoctorData(results);
        
        setDoctors(processedResults);
        applyFilters(processedResults, searchQuery, specialty, location, language);
      } catch (e) {
        setError('Failed to load doctors. Please try again later.');
        console.error('Error fetching doctors:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, [specialty, location]);

  // Apply filters whenever filter parameters change
  const applyFilters = useCallback((doctorList: Doctor[], query: string, specialty: string, location: string, language: string) => {
    let filtered = [...doctorList];
    
    // Filter by search query (name search)
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(doctor => {
        const fullName = doctor.name.toLowerCase();
        return fullName.includes(lowerQuery) || 
               (doctor.specialty && doctor.specialty.toLowerCase().includes(lowerQuery));
      });
    }
    
    // Apply language filter separately (since it's not handled by the API)
    if (language) {
      filtered = filtered.filter(doctor => 
        doctor.languages && doctor.languages.some(lang => 
          lang.toLowerCase().includes(language.toLowerCase())
        )
      );
    }
    
    setFilteredDoctors(filtered);
  }, []);

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
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {doctor.name}
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
    </main>
  );
}
