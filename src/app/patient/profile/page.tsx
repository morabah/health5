"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { mockUpdatePatientProfile } from '@/lib/mockApiService';

export default function PatientProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);
  const [saveLoading, setSaveLoading] = useState(false);

  // Update edited profile when userProfile changes (e.g., on initial load)
  React.useEffect(() => {
    if (userProfile) {
      setEditedProfile(userProfile);
    }
  }, [userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSaveProfile = async () => {
    if (!editedProfile || !user) return;
    
    setSaveLoading(true);
    try {
      // Call the mock API service to update the profile
      const updatedProfile = await mockUpdatePatientProfile(user.uid, editedProfile);
      
      // Force refresh of the page to show updated data
      setIsEditing(false);
      alert('Profile updated successfully!');
      
      // Refresh the profile data from localStorage
      window.location.reload();
    } catch (err) {
      alert('Failed to save profile changes.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(userProfile); // Reset to original profile
    setIsEditing(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Patient Profile</h1>
      <Card className="w-full max-w-xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Profile Details</h2>
          <Button 
            asChild 
            label="Back to Dashboard"
            pageName="PatientProfile"
          >
            <Link href="/patient/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {!loading && !userProfile && (
          <div className="text-red-600 dark:text-red-400">No profile found. Please log in as a patient.</div>
        )}
        
        {!loading && userProfile && !isEditing && (
          <div className="space-y-4">
            <div><span className="font-medium">Name:</span> {userProfile.firstName} {userProfile.lastName}</div>
            <div><span className="font-medium">Email:</span> {userProfile.email}</div>
            <div><span className="font-medium">Phone:</span> {userProfile.phone || "-"}</div>
            <div><span className="font-medium">User Type:</span> {userProfile.userType}</div>
            <div><span className="font-medium">Email Verified:</span> {userProfile.emailVerified ? "Yes" : "No"}</div>
            <div><span className="font-medium">Active:</span> {userProfile.isActive ? "Yes" : "No"}</div>
            <Button 
              onClick={() => setIsEditing(true)}
              label="Edit Profile"
              pageName="PatientProfile"
            >
              Edit Profile
            </Button>
          </div>
        )}

        {!loading && userProfile && isEditing && editedProfile && (
          <div className="space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={editedProfile.firstName || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={editedProfile.lastName || ''}
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
                    value={editedProfile.email || ''}
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
                    value={editedProfile.phone || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={saveLoading}
                    label="Save Changes"
                    pageName="PatientProfile"
                  >
                    {saveLoading ? <><Spinner size="sm" /> Saving...</> : 'Save Changes'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleCancelEdit}
                    label="Cancel"
                    pageName="PatientProfile"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Card>
    </main>
  );
}
