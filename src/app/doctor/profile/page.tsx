"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { loadDoctorProfile } from '@/data/loadDoctorProfile';
import { mockUpdateDoctorProfile } from '@/lib/mockApiService';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaStethoscope, FaEdit, FaArrowLeft, FaSave, FaFileAlt, FaLanguage, FaMoneyBillWave } from "react-icons/fa";
import { toast } from "react-hot-toast";

// Local UI-specific profile type including editable fields
interface UIProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  location?: string;
  bio?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  languages?: string[];
  consultationFee?: number;
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<UIProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UIProfile | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        // TODO: Replace with real userId from auth context or route param
        const userId = "user_doctor_001";
        const data = await loadDoctorProfile(userId);
        setProfile(data as UIProfile); // Cast API response to local UI type
        setEditedProfile(data as UIProfile); // Initialize edited profile with current data
        
        // Generate avatar URL using doctor's name
        if (data?.name) {
          const name = data.name.replace(/^Dr\.\s+/, '').trim(); // Remove "Dr. " prefix if exists
          setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=128`);
        }
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
    setEditedProfile(prev => {
      if (!prev) return null;
      // Parse numeric fields
      if (name === 'yearsOfExperience') {
        return { ...prev, yearsOfExperience: parseInt(value, 10) };
      }
      if (name === 'consultationFee') {
        return { ...prev, consultationFee: parseFloat(value) };
      }
      // Default to string for other fields
      return { ...prev, [name]: value };
    });
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    
    setSaveLoading(true);
    try {
      // Call the mock API service to update the profile
      const updatedProfile = (await mockUpdateDoctorProfile(editedProfile)) as UIProfile; // Cast API response to local UI type
      setProfile(updatedProfile);
      setIsEditing(false);
      
      // Show success message
      toast.success("Profile updated successfully!");
    } catch (err) {
      // Show error message
      toast.error("Failed to save profile changes.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile); // Reset to original profile
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
            pageName="DoctorProfile"
          >
            <Link href="/doctor/dashboard"><FaArrowLeft className="mr-2" /> Back</Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Doctor Profile</h1>
        </div>
        
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}
        
        {error && (
          <Card className="p-8 text-center">
            <div className="text-red-600 dark:text-red-400 text-lg">{error}</div>
            <Button 
              asChild 
              className="mt-4"
              label="Retry" 
              pageName="DoctorProfile"
            >
              <Link href="/doctor/dashboard">Back to Dashboard</Link>
            </Button>
          </Card>
        )}
        
        {!loading && !error && profile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Profile photo and specialty info */}
            <Card className="p-6 md:col-span-1">
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow-lg">
                  <img 
                    src={avatarUrl || "https://ui-avatars.com/api/?name=Doctor&background=0D8ABC&color=fff&size=128"} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold mb-1">{profile.name}</h2>
                <div className="flex items-center text-blue-600 dark:text-blue-400 mb-4">
                  <FaStethoscope className="mr-2" />
                  <span>{profile.specialty}</span>
                </div>
                
                {!isEditing && (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center"
                    label="Edit Profile" 
                    pageName="DoctorProfile"
                  >
                    <FaEdit className="mr-2" /> Edit Profile
                  </Button>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
                    <FaMapMarkerAlt className="text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-medium">{profile.location || "Not specified"}</p>
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
                      <p className="font-medium">{profile.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      <FaEnvelope className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      <FaPhone className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                      <p className="font-medium">{profile.phone || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      <FaFileAlt className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Biography</p>
                      <p className="font-medium">{profile.bio || "No biography provided"}</p>
                    </div>
                  </div>
                  {/* License Number */}
                  <div className="flex items-start mt-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      <FaFileAlt className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">License Number</p>
                      <p className="font-medium">{profile.licenseNumber || "Not provided"}</p>
                    </div>
                  </div>
                  {/* Years of Experience */}
                  <div className="flex items-start mt-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      <FaStethoscope className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Years of Experience</p>
                      <p className="font-medium">{profile.yearsOfExperience ?? 0} years</p>
                    </div>
                  </div>
                  {/* Languages */}
                  <div className="flex items-start mt-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      <FaLanguage className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Languages</p>
                      <p className="font-medium">{profile.languages?.join(", ") || "Not specified"}</p>
                    </div>
                  </div>
                  {/* Consultation Fee */}
                  <div className="flex items-start mt-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-3">
                      <FaMoneyBillWave className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Consultation Fee</p>
                      <p className="font-medium">${profile.consultationFee?.toFixed(2) ?? "0.00"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={editedProfile?.name || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="specialty" className="block text-sm font-medium mb-1">Specialty</label>
                        <input
                          type="text"
                          id="specialty"
                          name="specialty"
                          value={editedProfile?.specialty || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium mb-1">Location</label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={editedProfile?.location || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium mb-1">Biography</label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={editedProfile?.bio || ''}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    {/* Additional fields for editing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="licenseNumber" className="block text-sm font-medium mb-1">License Number</label>
                        <input
                          type="text"
                          id="licenseNumber"
                          name="licenseNumber"
                          value={editedProfile?.licenseNumber || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="yearsOfExperience" className="block text-sm font-medium mb-1">Years of Experience</label>
                        <input
                          type="number"
                          id="yearsOfExperience"
                          name="yearsOfExperience"
                          value={(editedProfile?.yearsOfExperience ?? 0).toString()}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="languages" className="block text-sm font-medium mb-1">Languages</label>
                        <input
                          type="text"
                          id="languages"
                          name="languages"
                          value={editedProfile?.languages?.join(", ") || ""}
                          onChange={(e) => setEditedProfile(prev => prev ? { ...prev, languages: e.target.value.split(",").map(lang => lang.trim()) } : null)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="consultationFee" className="block text-sm font-medium mb-1">Consultation Fee</label>
                        <input
                          type="number"
                          id="consultationFee"
                          name="consultationFee"
                          step="0.01"
                          value={editedProfile?.consultationFee?.toFixed(2) || ""}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-4 pt-4">
                      <Button 
                        type="submit" 
                        disabled={saveLoading}
                        className="flex items-center"
                        label="Save Changes" 
                        pageName="DoctorProfile"
                      >
                        {saveLoading ? <><Spinner size="sm" /> Saving...</> : <><FaSave className="mr-2" /> Save Changes</>}
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
              )}
            </Card>
          </div>
        )}
        
        {!loading && !error && !profile && (
          <div className="text-center py-8">
            <Card className="p-8">
              <div className="text-gray-600 dark:text-gray-300 text-lg">Profile not found.</div>
              <Button 
                asChild 
                className="mt-4"
                label="Back to Dashboard" 
                pageName="DoctorProfile"
              >
                <Link href="/doctor/dashboard">Back to Dashboard</Link>
              </Button>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
