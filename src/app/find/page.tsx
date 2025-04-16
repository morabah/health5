"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { loadHomepageDoctors } from '@/data/doctorLoaders';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { FaStar, FaMapMarkerAlt, FaSearch, FaFilter, FaStethoscope, FaLanguage, FaDollarSign, FaCalendarCheck } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ApiModeIndicator from '@/components/ui/ApiModeIndicator';

// Doctor interface definition
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  profilePicture?: string;
  location: string;
  available: boolean;
  rating: number;
  experience: number;
  languages: string[];
  fee: number;
  nextAvailable?: string;
  acceptingNewPatients?: boolean;
}

export default function FindDoctorPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Filter states
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Fetch doctors data
  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadHomepageDoctors();
      console.log('Loaded doctors:', data);

      const formattedData = data.map(doctor => ({
        id: doctor.userId,
        name: doctor.bio ? doctor.bio.split('.')[0] : 'Unknown Doctor',
        specialty: doctor.specialty || 'General Practitioner',
        profilePicture: undefined,
        location: doctor.location || 'Remote',
        available: Math.random() > 0.3,
        rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
        experience: doctor.yearsOfExperience || Math.floor(Math.random() * 15) + 1,
        languages: doctor.languages || ['English'],
        fee: doctor.consultationFee || Math.floor(Math.random() * 150) + 50,
        nextAvailable: getRandomFutureDate(),
        acceptingNewPatients: Math.random() > 0.2,
      }));

      setDoctors(formattedData);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Helper function to generate random future date
  function getRandomFutureDate() {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
    return futureDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Computed filter options
  const specialties = useMemo(() => {
    const specialtySet = new Set(doctors.map(doc => doc.specialty));
    return Array.from(specialtySet);
  }, [doctors]);

  const locations = useMemo(() => {
    const locationSet = new Set(doctors.map(doc => doc.location));
    return Array.from(locationSet);
  }, [doctors]);

  const languages = useMemo(() => {
    const languageSet = new Set();
    doctors.forEach(doc => doc.languages.forEach(lang => languageSet.add(lang)));
    return Array.from(languageSet) as string[];
  }, [doctors]);

  // Filtered doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty = selectedSpecialty ? doctor.specialty === selectedSpecialty : true;
      const matchesLocation = selectedLocation ? doctor.location === selectedLocation : true;
      const matchesLanguage = selectedLanguage ? doctor.languages.includes(selectedLanguage) : true;
      const matchesAvailability = availableOnly ? doctor.available : true;

      return matchesSearch && matchesSpecialty && matchesLocation && matchesLanguage && matchesAvailability;
    });
  }, [doctors, searchQuery, selectedSpecialty, selectedLocation, selectedLanguage, availableOnly]);

  // Reset filters function
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSpecialty('');
    setSelectedLocation('');
    setSelectedLanguage('');
    setAvailableOnly(false);
  };

  return (
    <main className="flex-1 container py-4 md:py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Find a Doctor</h1>
        <ApiModeIndicator />
      </div>
      
      <div className="mb-8">
        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Find Your Healthcare Provider</h2>
          <p className="text-muted-foreground mb-6">
            Search for specialists by name, condition, or location
          </p>
          
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search by name, specialty or condition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  options={[
                    { value: "", label: "Any specialty" },
                    ...specialties.map(specialty => ({ 
                      value: specialty, 
                      label: specialty 
                    }))
                  ]}
                />
              </div>
              <div className="w-full md:w-48">
                <Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  options={[
                    { value: "", label: "Any location" },
                    ...locations.map(location => ({ 
                      value: location, 
                      label: location 
                    }))
                  ]}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center bg-muted px-3 py-1 rounded-full text-sm">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="mr-2"
                />
                Available now
              </label>
              
              {(selectedSpecialty || selectedLocation || selectedLanguage || availableOnly || searchQuery) && (
                <button 
                  onClick={resetFilters}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center px-3 py-1 rounded-full"
                >
                  Clear all filters
                  <span className="ml-1">×</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Count */}
      {!loading && !error && (
        <div className="mb-4 flex justify-between items-center">
          <p className="text-muted-foreground">
            Found <span className="font-semibold text-foreground">{filteredDoctors.length}</span> doctors
            {filteredDoctors.length !== doctors.length && ` (filtered from ${doctors.length})`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select 
              className="text-sm border rounded-md px-2 py-1"
              onChange={(e) => {
                // Sort functionality would be implemented here
                console.log("Sorting by:", e.target.value);
              }}
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Highest rated</option>
              <option value="availability">Soonest available</option>
            </select>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Card className="mb-8 border-destructive">
          <div className="p-4 text-center text-destructive">
            <p>{error}</p>
            <button 
              className="mt-4 px-4 py-2 border border-destructive text-destructive rounded hover:bg-destructive/10 transition-colors"
              onClick={fetchDoctors}
            >
              Try Again
            </button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredDoctors.length === 0 && (
        <EmptyState
          title="No doctors found"
          message="Try adjusting your filters or search query"
          action={
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              onClick={resetFilters}
            >
              Reset all filters
            </button>
          }
        />
      )}

      {/* Doctors Grid */}
      {!loading && !error && filteredDoctors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {filteredDoctors.map(doctor => (
            <Card key={doctor.id} className="h-full hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="p-4 flex items-start gap-4">
                  <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted">
                    <div className="h-full w-full flex items-center justify-center bg-primary-foreground text-primary text-xl font-semibold">
                      {doctor.name.charAt(0)}
                    </div>
                    {doctor.available && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" title="Available for appointments" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{doctor.name}</h3>
                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                      </div>
                      <div className="flex items-center">
                        <FaStar className="text-yellow-400 mr-1" />
                        <span className="font-medium">{doctor.rating}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-start gap-2 mb-1.5">
                        <FaMapMarkerAlt className="text-muted-foreground mt-1 flex-shrink-0" size={12} />
                        <p className="text-sm">{doctor.location}</p>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <FaStethoscope className="text-muted-foreground mt-1 flex-shrink-0" size={12} />
                        <p className="text-sm">{doctor.experience} years experience</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 pb-3 mt-2">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doctor.languages.map(lang => (
                      <span key={lang} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {lang}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <FaDollarSign className="text-muted-foreground" size={12} />
                      <span className="text-sm font-medium">${doctor.fee}</span>
                      <span className="text-xs text-muted-foreground ml-1">per visit</span>
                    </div>
                    
                    {doctor.acceptingNewPatients ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        Accepting new patients
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Limited availability
                      </span>
                    )}
                  </div>
                  
                  {doctor.available && (
                    <div className="mb-3 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm flex items-center">
                      <FaCalendarCheck className="mr-2" size={14} />
                      Next available: {doctor.nextAvailable}
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t mt-auto">
                  <Link href={`/doctor/${doctor.id}`} passHref>
                    <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md transition-colors">
                      View Profile
                    </button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
