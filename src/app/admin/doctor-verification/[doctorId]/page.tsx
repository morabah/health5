"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { logValidation } from "@/lib/logger";
import { 
  mockGetDoctorVerificationDetails, 
  mockSetDoctorVerificationStatus, 
  mockUpdateDoctorProfile,
  mockGetUserProfile,
  mockUpdateUserProfile
} from "@/lib/mockApiService";
import { VerificationStatus } from "@/types/enums";
import type { DoctorVerificationData } from '@/types/doctor';
import { syncDoctorProfileUpdated, persistDoctorProfiles, persistAllData } from '@/lib/mockDataPersistence';
import { STORAGE_KEYS } from '@/lib/mockDataPersistence';
import { getDoctorProfilesStore } from '@/data/mockDataStore';

/**
 * Admin Doctor Verification Detail Page
 * Allows admins to review, approve, reject, or request more information for doctor verification.
 */
export default function DoctorVerificationPage() {
  const { doctorId } = useParams() as { doctorId: string };
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>({});
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.PENDING);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New states for profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [editedDoctorProfile, setEditedDoctorProfile] = useState<any>({});
  const [editedUserProfile, setEditedUserProfile] = useState<any>({});
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Force persistence of data on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[DoctorVerificationPage][Mount] localStorage contents:', { keys: Object.keys(localStorage), doctorProfiles: localStorage.getItem(STORAGE_KEYS.DOCTOR_PROFILES) });
      console.log('[DoctorVerificationPage][Mount] inMemory doctorProfiles:', getDoctorProfilesStore());
      persistDoctorProfiles();
      persistAllData();
      console.log('[DoctorVerificationPage][Mount] after persist localStorage doctorProfiles:', localStorage.getItem(STORAGE_KEYS.DOCTOR_PROFILES));
      console.log('[DoctorVerificationPage][Mount] after persist inMemory doctorProfiles:', getDoctorProfilesStore());
    }
  }, []);

  useEffect(() => {
    logValidation("admin-doctor-verification-ui", "success");
  }, []);

  // Fetch doctor verification data with debug logging
  useEffect(() => {
    if (!doctorId) {
      setError('No doctor ID provided');
      setLoading(false);
      return;
    }
    async function fetchVerification() {
      try {
        console.log('[DoctorVerificationPage] Pre-fetch localStorage doctorProfiles:', localStorage.getItem(STORAGE_KEYS.DOCTOR_PROFILES));
        console.log('[DoctorVerificationPage] Pre-fetch in-memory doctorProfiles:', getDoctorProfilesStore());
        const data = await mockGetDoctorVerificationDetails(doctorId);
        console.log(`[DoctorVerificationPage] Fetched verification data for ${doctorId}:`, data);
        console.log('[DoctorVerificationPage] Post-fetch localStorage doctorProfiles:', localStorage.getItem(STORAGE_KEYS.DOCTOR_PROFILES));
        if (!data) {
          setError('Verification data not found');
          setLoading(false);
          return;
        }
        setDoctor(data);
        setStatus(data.status);
        setNotes(data.verificationNotes || '');
        const userData = await mockGetUserProfile(doctorId);
        setUserProfileData(userData);
        setEditedDoctorProfile({
          id: doctorId,
          specialty: data.submissionData?.specialty || '',
          licenseNumber: data.submissionData?.licenseNumber || '',
          yearsOfExperience: data.submissionData?.experience || 0,
          bio: data.submissionData?.bio || '',
          location: data.submissionData?.location || '',
          languages: data.submissionData?.languages || [],
          consultationFee: data.submissionData?.fee || 0,
        });
        setEditedUserProfile({
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || '',
          email: userData?.email || '',
          phoneNumber: userData?.phoneNumber || '',
          address: userData?.address || '',
        });
        setLoading(false);
      } catch (err) {
        console.error('[DoctorVerificationPage] Error during fetchVerification:', err);
        setError('Failed to load verification data');
        setLoading(false);
      }
    }
    void fetchVerification();
  }, [doctorId]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      // Debug before status update
      console.log('[DoctorVerificationPage.handleSave] Pre-save localStorage doctorProfiles:', localStorage.getItem(STORAGE_KEYS.DOCTOR_PROFILES));
      console.log('[DoctorVerificationPage.handleSave] Pre-save inMemory doctorProfiles:', getDoctorProfilesStore());
      const result = await mockSetDoctorVerificationStatus(doctorId, status, notes);
      // Debug after status update
      console.log('[DoctorVerificationPage.handleSave] mockSetDoctorVerificationStatus result:', result);
      console.log('[DoctorVerificationPage.handleSave] Post-save localStorage doctorProfiles:', localStorage.getItem(STORAGE_KEYS.DOCTOR_PROFILES));
      console.log('[DoctorVerificationPage.handleSave] Post-save inMemory doctorProfiles:', getDoctorProfilesStore());
      
      if (result) {
        setSuccess(true);
        setDoctor((prev: any) => ({ ...prev, status }));
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError('Failed to save verification decision');
      }
    } catch (err) {
      console.error('[DoctorVerificationPage] Error saving:', err);
      setError('Failed to save verification decision');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle doctor profile field changes
  const handleDoctorProfileChange = (field: string, value: any) => {
    setEditedDoctorProfile((prev: any) => ({ ...prev, [field]: value }));
  };
  
  // Handle user profile field changes
  const handleUserProfileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedUserProfile((prev: any) => ({ ...prev, [field]: e.target.value }));
  };
  
  // Save edited profiles
  const handleSaveProfiles = async () => {
    setProfileSaving(true);
    setProfileSuccess(false);
    setError(null);
    
    try {
      // Debug before saving profiles
      console.log('[DoctorVerificationPage] Before save - localStorage doctorProfiles:', localStorage.getItem(STORAGE_KEYS.DOCTOR_PROFILES));
      console.log('[DoctorVerificationPage] Before save - inMemory doctorProfiles:', getDoctorProfilesStore());
      // Update doctor profile
      const doctorResult = await mockUpdateDoctorProfile(editedDoctorProfile);
      
      // Update user profile
      const userResult = await mockUpdateUserProfile(doctorId, editedUserProfile);
      
      if (doctorResult && userResult && userResult.success) {
        // Persist updated profiles
        try {
          console.log('[DoctorVerificationPage] Persisting profiles...');
          persistDoctorProfiles();
          persistAllData();
          // Debug after persistence
          console.log('[DoctorVerificationPage] After persist - localStorage doctorProfiles:', localStorage.getItem(STORAGE_KEYS.DOCTOR_PROFILES));
          console.log('[DoctorVerificationPage] After persist - inMemory doctorProfiles:', getDoctorProfilesStore());
        } catch (error) {
          console.error('[DoctorVerificationPage] Error persisting updated profiles:', error);
        }
        setProfileSuccess(true);
        
        // Update local state
        setDoctor((prev: any) => ({
          ...prev,
          submissionData: {
            ...prev.submissionData,
            specialty: editedDoctorProfile.specialty,
            licenseNumber: editedDoctorProfile.licenseNumber,
            experience: editedDoctorProfile.yearsOfExperience,
            location: editedDoctorProfile.location,
          }
        }));
        
        setUserProfileData((prev: any) => ({
          ...prev,
          ...editedUserProfile
        }));
        
        setEditingProfile(false);
        
        setTimeout(() => {
          setProfileSuccess(false);
        }, 3000);
      } else {
        setError('Failed to update profiles');
      }
    } catch (err) {
      console.error('[DoctorVerificationPage] Error saving profiles:', err);
      setError('Failed to update profiles');
    } finally {
      setProfileSaving(false);
    }
  };

  const getDoctorName = () => doctor.name || doctor.doctorId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (error && !doctor.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-4xl mx-auto p-6">
          <div className="text-red-600 mb-4">{error}</div>
          <Button
            label="Back to List"
            pageName="doctor-verification"
            onClick={() => router.push('/admin/doctor-verification')}
          >
            Back to Verification List
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Card className="mb-6 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Doctor Verification: {getDoctorName()}</h1>
            {doctor.status && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                doctor.status === VerificationStatus.PENDING ? "bg-yellow-100 text-yellow-800" :
                doctor.status === VerificationStatus.APPROVED ? "bg-green-100 text-green-800" :
                doctor.status === VerificationStatus.MORE_INFO_REQUIRED ? "bg-blue-100 text-blue-800" :
                "bg-red-100 text-red-800"
              }`}>
                {doctor.status}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Doctor info and Profile Editing */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Doctor Profile</h3>
                  {!editingProfile ? (
                    <Button
                      label="Edit Profile"
                      pageName="doctor-verification"
                      size="sm"
                      onClick={() => setEditingProfile(true)}
                      disabled={saving || profileSaving}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        label="Cancel"
                        pageName="doctor-verification"
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingProfile(false)}
                        disabled={saving || profileSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        label="Save Profiles"
                        pageName="doctor-verification"
                        size="sm"
                        onClick={handleSaveProfiles}
                        isLoading={profileSaving}
                        disabled={saving || profileSaving}
                      >
                        Save Profiles
                      </Button>
                    </div>
                  )}
                </div>
                
                {profileSuccess && (
                  <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
                    Profiles updated successfully.
                  </div>
                )}
                
                {!editingProfile ? (
                  // View mode
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Name</div>
                      <div>{userProfileData?.firstName} {userProfileData?.lastName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <div>{userProfileData?.email}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Phone</div>
                      <div>{userProfileData?.phoneNumber || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Address</div>
                      <div>{userProfileData?.address || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Specialty</div>
                      <div>{doctor.submissionData?.specialty}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Years of Experience</div>
                      <div>{doctor.submissionData?.experience} years</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Location</div>
                      <div>{doctor.submissionData?.location}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Languages</div>
                      <div>{doctor.submissionData?.languages?.join(', ') || 'Not provided'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">License Number</div>
                      <div>{doctor.submissionData?.licenseNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Consultation Fee</div>
                      <div>${doctor.submissionData?.fee}</div>
                    </div>
                  </div>
                ) : (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="text-lg font-medium mb-2">User Information</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        value={editedUserProfile.firstName || ''}
                        onChange={handleUserProfileChange('firstName')}
                      />
                      <Input
                        label="Last Name"
                        value={editedUserProfile.lastName || ''}
                        onChange={handleUserProfileChange('lastName')}
                      />
                    </div>
                    <Input
                      label="Email"
                      value={editedUserProfile.email || ''}
                      onChange={handleUserProfileChange('email')}
                      type="email"
                    />
                    <Input
                      label="Phone Number"
                      value={editedUserProfile.phoneNumber || ''}
                      onChange={handleUserProfileChange('phoneNumber')}
                    />
                    <Input
                      label="Address"
                      value={editedUserProfile.address || ''}
                      onChange={handleUserProfileChange('address')}
                    />
                    
                    <div className="text-lg font-medium mt-6 mb-2">Doctor Information</div>
                    <Input
                      label="Specialty"
                      value={editedDoctorProfile.specialty || ''}
                      onChange={(e) => handleDoctorProfileChange('specialty', e.target.value)}
                    />
                    <Input
                      label="License Number"
                      value={editedDoctorProfile.licenseNumber || ''}
                      onChange={(e) => handleDoctorProfileChange('licenseNumber', e.target.value)}
                    />
                    <Input
                      label="Years of Experience"
                      value={editedDoctorProfile.yearsOfExperience || 0}
                      onChange={(e) => handleDoctorProfileChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                      type="number"
                    />
                    <Input
                      label="Location"
                      value={editedDoctorProfile.location || ''}
                      onChange={(e) => handleDoctorProfileChange('location', e.target.value)}
                    />
                    <Input
                      label="Consultation Fee ($)"
                      value={editedDoctorProfile.consultationFee || 0}
                      onChange={(e) => handleDoctorProfileChange('consultationFee', parseInt(e.target.value) || 0)}
                      type="number"
                    />
                    <Textarea
                      label="Bio"
                      value={editedDoctorProfile.bio || ''}
                      onChange={(e) => handleDoctorProfileChange('bio', e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Verification Documents</h3>
                <ul className="space-y-3">
                  {doctor.submissionData?.documents && doctor.submissionData.documents.length > 0 ? (
                      doctor.submissionData.documents.map((doc: any) => (
                        <li key={doc.id} className="flex items-center gap-2">
                          <span className="text-blue-600 hover:underline">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.name}</a>
                          </span>
                        </li>
                      ))
                  ) : (
                    <li>No documents uploaded.</li>
                  )}
                </ul>
              </div>
            </div>
            
            {/* Right column - Verification status */}
            <div className="lg:col-span-1">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
                <div className="mb-4">
                  <label className="font-medium">Verification Status</label>
                  <select
                    className="input input-bordered w-full mt-1"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VerificationStatus)}
                  >
                    <option value={VerificationStatus.PENDING}>Pending</option>
                    <option value={VerificationStatus.APPROVED}>Approved</option>
                    <option value={VerificationStatus.REJECTED}>Rejected</option>
                    <option value={VerificationStatus.MORE_INFO_REQUIRED}>More Info Required</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="font-medium">Admin Notes</label>
                  <Textarea
                    placeholder="Enter notes for approval/rejection (optional)"
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button 
                  label="Save Decision"
                  pageName="doctor-verification"
                  className="w-full" 
                  onClick={handleSave} 
                  disabled={saving}
                  isLoading={saving}
                >
                  {saving ? "Saving..." : "Save Decision"}
                </Button>
                {success && <div className="text-green-600 mt-2 text-center">Decision saved and notification sent to doctor.</div>}
                {error && <div className="text-red-600 mt-2 text-center">{error}</div>}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => router.push('/admin/doctor-verification')}
              label="Back to List"
              pageName="doctor-verification"
            >
              Back to Verification List
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
