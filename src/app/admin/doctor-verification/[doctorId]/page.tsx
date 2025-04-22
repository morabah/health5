"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { logValidation } from "@/lib/logger";
import { doc, getDoc, updateDoc, collection, getFirestore } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/improvedFirebaseClient';
import { VerificationStatus } from '@/types/enums';
import type { DoctorVerificationData } from '@/types/doctor';
import type { UserProfile } from '@/types/user';
import type { VerificationDocument } from '@/types/verificationDocument';

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
  const [userProfileData, setUserProfileData] = useState<UserProfile | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // New state for verification documents
  const [verificationDocs, setVerificationDocs] = useState<VerificationDocument[]>([]);

  useEffect(() => {
    logValidation("admin-doctor-verification-ui", "success");
  }, []);

  // Fetch doctor verification data from Firestore
  useEffect(() => {
    if (!doctorId) {
      setError('No doctor ID provided');
      setLoading(false);
      return;
    }
    async function fetchVerification() {
      try {
        const db = await getFirestoreDb();
        // Doctor verification doc (assume collection 'doctorVerifications')
        const verificationDoc = await getDoc(doc(db, 'doctorVerifications', doctorId));
        if (!verificationDoc.exists()) {
          setError('Verification data not found');
          setLoading(false);
          return;
        }
        const verificationData = verificationDoc.data() as DoctorVerificationData;
        setDoctor(verificationData);
        setStatus(verificationData.status || VerificationStatus.PENDING);
        setNotes(verificationData.notes || '');
        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', doctorId));
        if (userDoc.exists()) {
          setUserProfileData(userDoc.data() as UserProfile);
        } else {
          setUserProfileData(null);
        }
        // Fetch supporting verificationDocs for this doctor
        const docsSnap = await db.collection('verificationDocs').where('doctorId', '==', doctorId).get();
        const docsList: VerificationDocument[] = docsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setVerificationDocs(docsList);
        setLoading(false);
      } catch (e: any) {
        setError('Failed to load verification data');
        setLoading(false);
      }
    }
    fetchVerification();
  }, [doctorId]);

  // Handle save (update verification status and notes)
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const db = await getFirestoreDb();
      const verificationRef = doc(db, 'doctorVerifications', doctorId);
      await updateDoc(verificationRef, {
        status,
        notes,
        updatedAt: new Date()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError('Failed to update verification status');
    } finally {
      setSaving(false);
    }
  };

  // Handle profile save (update doctor/user profile)
  const handleSaveProfiles = async () => {
    setProfileSaving(true);
    setError(null);
    try {
      const db = await getFirestoreDb();
      // Update doctor profile (assume collection 'doctors')
      if (editedDoctorProfile && Object.keys(editedDoctorProfile).length > 0) {
        const doctorRef = doc(db, 'doctors', doctorId);
        await updateDoc(doctorRef, editedDoctorProfile);
      }
      // Update user profile
      if (editedUserProfile && Object.keys(editedUserProfile).length > 0) {
        const userRef = doc(db, 'users', doctorId);
        await updateDoc(userRef, editedUserProfile);
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (e: any) {
      setError('Failed to update profile');
    } finally {
      setProfileSaving(false);
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
            
            {/* Supporting Verification Documents */}
            {verificationDocs.length > 0 && (
              <Card className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Supporting Documents</h3>
                <ul className="space-y-2">
                  {verificationDocs.map((doc) => (
                    <li key={doc.id} className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <div>
                        <span className="font-medium">{doc.documentType || doc.type}</span>
                        {doc.uploadedAt && (
                          <span className="ml-2 text-xs text-gray-400">{new Date(doc.uploadedAt.seconds ? doc.uploadedAt.seconds * 1000 : doc.uploadedAt).toLocaleString()}</span>
                        )}
                      </div>
                      <div className="mt-2 md:mt-0">
                        <a href={doc.fileUrl || doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Document</a>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            
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
