"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { loadDoctorProfile } from '@/data/loadDoctorProfile';
import { mockUpdateDoctorProfile } from '@/lib/mockApiService';

interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  location: string;
  bio: string;
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<DoctorProfile | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await loadDoctorProfile();
        setProfile(data);
        setEditedProfile(data); // Initialize edited profile with current data
      } catch (err) {
        setError('Failed to load profile.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    
    setSaveLoading(true);
    try {
      // Call the mock API service to update the profile
      const updatedProfile = await mockUpdateDoctorProfile(editedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
      
      alert('Profile updated successfully!');
      
      // Reload the page to get fresh data from localStorage
      window.location.reload();
    } catch (err) {
      alert('Failed to save profile changes.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile); // Reset to original profile
    setIsEditing(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Doctor Profile</h1>
      <Card className="w-full max-w-xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Profile Details</h2>
          <Button 
            asChild 
            label="Back to Dashboard" 
            pageName="DoctorProfile"
          >
            <Link href="/doctor/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        
        {!loading && !error && profile && !isEditing && (
          <div className="space-y-4">
            <div><span className="font-medium">Name:</span> {profile.name}</div>
            <div><span className="font-medium">Email:</span> {profile.email}</div>
            <div><span className="font-medium">Phone:</span> {profile.phone}</div>
            <div><span className="font-medium">Specialty:</span> {profile.specialty}</div>
            <div><span className="font-medium">Location:</span> {profile.location}</div>
            <div><span className="font-medium">Bio:</span> {profile.bio}</div>
            <Button 
              size="sm" 
              onClick={() => setIsEditing(true)} 
              label="Edit Profile" 
              pageName="DoctorProfile"
            >
              Edit Profile
            </Button>
          </div>
        )}

        {!loading && !error && editedProfile && isEditing && (
          <div className="space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editedProfile.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editedProfile.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={editedProfile.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="specialty" className="block text-sm font-medium">Specialty</label>
                  <input
                    type="text"
                    id="specialty"
                    name="specialty"
                    value={editedProfile.specialty}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={editedProfile.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={editedProfile.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={saveLoading} 
                    label="Save Changes" 
                    pageName="DoctorProfile"
                  >
                    {saveLoading ? <><Spinner size="sm" /> Saving...</> : 'Save Changes'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleCancelEdit} 
                    label="Cancel" 
                    pageName="DoctorProfile"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
        
        {!loading && !error && !profile && (
          <div className="text-gray-600 dark:text-gray-300">Profile not found.</div>
        )}
      </Card>
    </main>
  );
}
