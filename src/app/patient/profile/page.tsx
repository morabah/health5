"use client";
import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { mockUpdatePatientProfile } from '@/lib/mockApiService';
import { FaUser, FaEnvelope, FaPhone, FaUserCheck, FaCheck, FaTimes, FaArrowLeft, FaEdit, FaSave } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

export default function PatientProfilePage() {
  const { user, userProfile, refreshProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  // Update edited profile when userProfile changes (e.g., on initial load)
  useEffect(() => {
    if (userProfile) {
      setEditedProfile(userProfile);
      // Generate avatar URL using user's name
      const name = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim();
      setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=128`);
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
      await mockUpdatePatientProfile(user.uid, editedProfile);
      
      setIsEditing(false);
      
      // Refresh the profile data
      refreshProfile();
      
      // Show success message
      const notification = document.getElementById('notification');
      if (notification) {
        notification.className = "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity";
        notification.textContent = "Profile updated successfully!";
        setTimeout(() => {
          notification.className = "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity opacity-0";
        }, 3000);
      }
    } catch (err) {
      const notification = document.getElementById('notification');
      if (notification) {
        notification.className = "fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity";
        notification.textContent = "Failed to save profile changes.";
        setTimeout(() => {
          notification.className = "fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity opacity-0";
        }, 3000);
      }
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(userProfile); // Reset to original profile
    setIsEditing(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-8">
          <Button 
            asChild 
            variant="secondary" 
            className="mr-4"
            label="Back to Dashboard"
            pageName="PatientProfile"
          >
            <Link href="/patient/dashboard"><FaArrowLeft className="mr-2" /> Back</Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        </div>
        
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}
        
        {!loading && !userProfile && (
          <Card className="p-8 text-center">
            <div className="text-red-600 dark:text-red-400 text-lg">No profile found. Please log in as a patient.</div>
            <Button 
              asChild 
              className="mt-4"
              label="Go to Login"
              pageName="PatientProfile"
            >
              <Link href="/">Go to Login</Link>
            </Button>
          </Card>
        )}
        
        {!loading && userProfile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Profile photo and quick info */}
            <Card className="p-6 md:col-span-1">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow-lg">
                  <img 
                    src={avatarUrl} 
                    alt={`${userProfile.firstName} ${userProfile.lastName}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold mb-1">{userProfile.firstName} {userProfile.lastName}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{userProfile.userType}</p>
                
                {!isEditing && (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center"
                    label="Edit Profile"
                    pageName="PatientProfile"
                  >
                    <FaEdit className="mr-2" /> Edit Profile
                  </Button>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                    <FaUserCheck className="text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Account Status</p>
                    <p className="font-medium">{userProfile.isActive ? "Active" : "Inactive"}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                    <MdEmail className="text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email Verification</p>
                    <p className="font-medium flex items-center">
                      {userProfile.emailVerified ? (
                        <><FaCheck className="text-green-500 mr-1" /> Verified</>
                      ) : (
                        <><FaTimes className="text-red-500 mr-1" /> Not Verified</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Right column - Detailed info and edit form */}
            <Card className="p-6 md:col-span-2">
              <h3 className="text-xl font-semibold mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                {isEditing ? "Edit Profile Information" : "Profile Information"}
              </h3>
              
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      <FaUser className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                      <p className="font-medium">{userProfile.firstName} {userProfile.lastName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      <FaEnvelope className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                      <p className="font-medium">{userProfile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      <FaPhone className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                      <p className="font-medium">{userProfile.phone || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={editedProfile?.firstName || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={editedProfile?.lastName || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={editedProfile?.email || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={editedProfile?.phone || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div className="flex space-x-4 pt-4">
                      <Button 
                        type="submit" 
                        disabled={saveLoading}
                        className="flex items-center"
                        label="Save Changes"
                        pageName="PatientProfile"
                      >
                        {saveLoading ? <><Spinner size="sm" /> Saving...</> : <><FaSave className="mr-2" /> Save Changes</>}
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
              )}
            </Card>
          </div>
        )}
        
        {/* Notification element */}
        <div id="notification" className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity opacity-0"></div>
      </div>
    </main>
  );
}
