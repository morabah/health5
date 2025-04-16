"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { loadHomepageDoctors } from '@/data/doctorLoaders';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  location: string;
  available: boolean;
  experience?: number;
  languages?: string[];
  fee?: number;
}

export default function FindDoctorPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- FILTER STATE ---
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<string>("");

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      setError(null);
      try {
        const profileItems = await loadHomepageDoctors();
        
        // Map DoctorProfile objects to Doctor objects with name field
        const formattedDoctors: Doctor[] = profileItems.map(profile => {
          // Create doctor name based on specialty
          let doctorName;
          switch (profile.specialty) {
            case "Cardiology":
              doctorName = "Dr. Bob Johnson";
              break;
            case "Dermatology":
              doctorName = "Dr. Jane Lee";
              break;
            case "Pediatrics":
              doctorName = "Dr. Emily Carter";
              break;
            case "Orthopedics":
              doctorName = "Dr. Michael Kim";
              break;
            case "Neurology":
              doctorName = "Dr. Ana Souza";
              break;
            default:
              doctorName = `Dr. ${profile.specialty} Specialist`;
          }
          
          // Create a Doctor object from the profile
          return {
            id: profile.userId,
            name: doctorName,
            specialty: profile.specialty,
            location: profile.location,
            languages: profile.languages,
            available: profile.verificationStatus === 'approved',
            experience: profile.yearsOfExperience,
            fee: profile.consultationFee
          };
        });
        
        setDoctors(formattedDoctors);
      } catch (err) {
        setError("Failed to load doctors.");
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  // --- DYNAMIC FILTER OPTIONS ---
  const specialties = Array.from(new Set(doctors.map(d => d.specialty).filter(Boolean)));
  const locations = Array.from(new Set(doctors.map(d => d.location).filter(Boolean)));
  const languages = Array.from(new Set(
    doctors.flatMap(d => (Array.isArray((d as any).languages) ? (d as any).languages : ((d as any).languages ? [(d as any).languages] : [])))
      .filter(Boolean)
  ));

  // --- FILTERED DOCTORS ---
  const filteredDoctors = doctors.filter(doc =>
    (!specialtyFilter || doc.specialty === specialtyFilter) &&
    (!locationFilter || doc.location === locationFilter) &&
    (!languageFilter || ((Array.isArray((doc as any).languages)
      ? (doc as any).languages : ((doc as any).languages ? [(doc as any).languages] : [])).includes(languageFilter)))
  );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Find a Doctor</h1>
      <Card className="w-full max-w-6xl mb-8 p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold">Available Doctors</h2>
          {/* FILTER CONTROLS */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="specialtyFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Specialty</label>
              <select id="specialtyFilter" value={specialtyFilter} onChange={e => setSpecialtyFilter(e.target.value)} className="block w-36 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Location</label>
              <select id="locationFilter" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="block w-36 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="languageFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Language</label>
              <select id="languageFilter" value={languageFilter} onChange={e => setLanguageFilter(e.target.value)} className="block w-36 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="">All</option>
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && filteredDoctors.length === 0 && (
          <EmptyState
            title="No doctors found."
            message="No doctors match your filters. Try adjusting your search criteria."
            className="my-8"
          />
        )}
        {/* DOCTOR CARD GRID */}
        {!loading && filteredDoctors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map(doc => (
              <div key={doc.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center border border-gray-200 dark:border-gray-700" tabIndex={0} aria-label={`Doctor card for ${doc.name}`}> 
                {/* Profile Pic Placeholder */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-200 to-blue-200 dark:from-emerald-900 dark:to-blue-900 flex items-center justify-center mb-3">
                  <span className="text-3xl text-blue-800 dark:text-emerald-200 font-bold">
                    {doc.name.charAt(0)}
                  </span>
                </div>
                <div className="font-bold text-lg mb-1 text-blue-900 dark:text-white">{doc.name}</div>
                <div className="text-gray-700 dark:text-gray-300 mb-1">{doc.specialty}</div>
                <div className="text-gray-500 dark:text-gray-400 mb-1 text-sm">{doc.location}</div>
                {/* Experience, Languages, Fee if present */}
                {('experience' in doc) && <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Experience: {(doc as any).experience} yrs</div>}
                {('languages' in doc) && Array.isArray((doc as any).languages) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Languages: {(doc as any).languages.join(', ')}</div>
                )}
                {('fee' in doc) && <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fee: ${(doc as any).fee}</div>}
                {/* Availability */}
                <div className="mb-2">
                  {doc.available ? (
                    <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Available</span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Unavailable</span>
                  )}
                </div>
                <div className="flex gap-2 mt-3 w-full">
                  <Link href={`/main/doctor-profile/${doc.id}`} className="w-1/2">
                    <Button 
                      className="w-full" 
                      label="View Profile" 
                      pageName="FindDoctors"
                    >
                      View Profile
                    </Button>
                  </Link>
                  <Link href={`/book?doctorId=${doc.id}`} className={`w-1/2 ${!doc.available ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Button 
                      className="w-full" 
                      disabled={!doc.available} 
                      label="Book" 
                      pageName="FindDoctors"
                    >
                      Book
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
