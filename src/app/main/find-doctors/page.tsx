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
import EmptyState from "@/components/ui/EmptyState";
import ApiModeIndicator from "@/components/ui/ApiModeIndicator";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { StarIcon, MapPinIcon, GlobeAltIcon, BriefcaseIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

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
        
        setDoctors(results);
        applyFilters(results, searchQuery, specialty, location, language);
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
        const fullName = (doctor.name || `${doctor.firstName} ${doctor.lastName}`).toLowerCase();
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
    router.push(`/main/book-appointment/${doctorId}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Find a Doctor</h1>
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
          <div className="flex justify-center items-center min-h-[400px]">
            <Spinner size="lg" />
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
                      className="cursor-pointer"
                      onClick={() => viewDoctorProfile(doctor.id)}
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition">
                        <div className="p-6">
                          <div className="flex items-start">
                            <div className="relative mr-4 flex-shrink-0">
                              <img
                                src={doctor.profilePicUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor.name || `${doctor.firstName} ${doctor.lastName}`) + '&background=0D8ABC&color=fff'}
                                alt={doctor.name || `${doctor.firstName} ${doctor.lastName}`}
                                className="w-24 h-24 rounded-full object-cover border-2 border-blue-100"
                              />
                              {doctor.available && (
                                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                                  <CheckCircleIcon className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {doctor.name || `Dr. ${doctor.firstName} ${doctor.lastName}`}
                              </h2>
                              
                              <div className="flex items-center mt-1 text-sm text-blue-600 dark:text-blue-400">
                                <BriefcaseIcon className="w-4 h-4 mr-1" />
                                <span>{doctor.specialty || 'General Practice'}</span>
                              </div>
                              
                              <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <MapPinIcon className="w-4 h-4 mr-1" />
                                <span>{doctor.location || 'Location not specified'}</span>
                              </div>
                              
                              <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <GlobeAltIcon className="w-4 h-4 mr-1" />
                                <span>{doctor.languages?.join(', ') || 'English'}</span>
                              </div>
                              
                              <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                                <span>${doctor.fee || '0'} / consultation</span>
                              </div>
                              
                              {doctor.rating && (
                                <div className="flex items-center mt-1 text-sm text-yellow-500">
                                  <StarIcon className="w-4 h-4 mr-1" />
                                  <span>{doctor.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {doctor.bio && (
                            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {doctor.bio}
                            </p>
                          )}
                          
                          <div className="mt-4 flex justify-end">
                            <Button
                              onClick={(e) => bookAppointment(e, doctor.id)}
                              variant="primary"
                              size="sm"
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
