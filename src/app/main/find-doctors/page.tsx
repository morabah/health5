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
  UserIcon
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, HeartIcon } from "@heroicons/react/24/solid";

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
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Find a Doctor</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Search for healthcare specialists matching your needs
            </p>
          </div>
          <ApiModeIndicator />
        </div>
        
        {/* Search and Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search by Doctor Name or Specialty
            </label>
            <Input
              id="search"
              type="text"
              placeholder="e.g., Dr. Smith or Cardiology"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
          
          <div className="flex justify-end">
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
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Found {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} matching your criteria
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.map((doctor) => (
                    <div 
                      key={doctor.id}
                      className="cursor-pointer transform transition duration-300 hover:scale-102 hover:-translate-y-1"
                      onClick={() => viewDoctorProfile(doctor.id)}
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
                        <div className="relative">
                          <div className="h-12 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                          <div className="absolute top-4 right-4">
                            {doctor.available ? (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-200">
                                Available
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-red-200">
                                Unavailable
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="flex items-start">
                            <div className="relative -mt-10 mr-4 flex-shrink-0 z-10">
                              <img
                                src={doctor.profilePicUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor.name) + '&background=0D8ABC&color=fff&size=128'}
                                alt={doctor.name}
                                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor.name) + '&background=0D8ABC&color=fff&size=128';
                                }}
                              />
                            </div>
                            
                            <div className="flex-1 pt-3">
                              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                                {doctor.name}
                              </h2>
                              
                              <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                                <BriefcaseIcon className="w-4 h-4 mr-1" />
                                <span>{doctor.specialty || 'General Practice'}</span>
                              </div>
                              
                              <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                                <span className="line-clamp-1">{doctor.location || 'Location not specified'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                <UserIcon className="w-4 h-4 mr-1" />
                                <span>{doctor.experience || 0} years exp.</span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                                <span>${doctor.fee || 0}</span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                <GlobeAltIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                                <span className="line-clamp-1">
                                  {doctor.languages?.join(', ') || 'English'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                {doctor.rating ? (
                                  <>
                                    <StarIcon className="w-4 h-4 mr-1" />
                                    <span>{doctor.rating.toFixed(1)}</span>
                                  </>
                                ) : (
                                  <>
                                    <CalendarIcon className="w-4 h-4 mr-1" />
                                    <span>New Doctor</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {doctor.nextAvailable && doctor.available && (
                            <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                <span>Next Available: {doctor.nextAvailable}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center mt-4 space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              label="View Profile"
                              pageName="FindDoctorsPage"
                              className="flex-1"
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
                              size="sm"
                              disabled={!doctor.available}
                              label={doctor.available ? "Book Appointment" : "Unavailable"}
                              pageName="FindDoctorsPage"
                              className="flex-1"
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
