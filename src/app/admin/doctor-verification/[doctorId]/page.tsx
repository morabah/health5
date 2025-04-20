"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { logValidation } from "@/lib/logger";
import { mockGetDoctorVerificationDetails, mockSetDoctorVerificationStatus } from "@/lib/mockApiService";
import { VerificationStatus } from "@/types/enums";
import type { DoctorVerificationData } from '@/types/doctor';
import { syncDoctorProfileUpdated, persistDoctorProfiles, persistAllData } from '@/lib/mockDataPersistence';

export default function DoctorVerificationPage() {
  const params = useParams();
  const doctorId = Array.isArray(params?.doctorId) 
    ? params?.doctorId[0] 
    : params?.doctorId as string;
  
  console.log("Doctor verification page - doctorId:", doctorId, "type:", typeof doctorId);
  
  const [doctor, setDoctor] = useState<DoctorVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.PENDING);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Force persistence on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        console.log("[DoctorVerificationPage] Ensuring data persistence on load");
        persistDoctorProfiles();
        persistAllData();
      } catch (e) {
        console.error('Error persisting data on load:', e);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchVerification() {
      if (!doctorId) {
        console.error("[DoctorVerificationPage] No doctorId provided");
        setError("Doctor ID is missing or invalid.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        console.log("[DoctorVerificationPage] Fetching verification data for doctorId:", doctorId);
        
        const data = await mockGetDoctorVerificationDetails(doctorId);
        console.log("[DoctorVerificationPage] Received verification data:", data);
        
        if (data) {
          setDoctor(data as DoctorVerificationData);
          if (data.status) {
            setStatus(data.status as VerificationStatus);
          }
          if (data.adminNotes) {
            setNotes(data.adminNotes);
          }
        } else {
          console.error("[DoctorVerificationPage] No data returned for doctorId:", doctorId);
          setError("Could not find verification data for this doctor.");
        }
      } catch (error) {
        console.error("[DoctorVerificationPage] Error fetching verification data:", error);
        setError("Failed to load doctor verification data. Please try again.");
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    }
    fetchVerification();
  }, [doctorId]);

  useEffect(() => {
    logValidation("admin-doctor-verification-ui", "success");
  }, []);

  const handleSave = async () => {
    if (!doctorId) {
      setError("Doctor ID is missing. Cannot save verification status.");
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      console.log("[DoctorVerificationPage] Saving verification status:", {
        doctorId,
        status,
        notes
      });
      
      // Save new status
      const result = await mockSetDoctorVerificationStatus(doctorId, status, notes);
      console.log("[DoctorVerificationPage] Status update result:", result);
      
      if (!result) {
        throw new Error("Failed to update verification status");
      }
      
      // Update page state
      if (doctor) {
        const updatedDoctor = { 
          ...doctor, 
          status, 
          adminNotes: notes,
          lastUpdated: new Date()
        };
        setDoctor(updatedDoctor);
        
        // Ensure changes are synced to localStorage and across tabs
        try {
          // Update localStorage and sync across tabs
          syncDoctorProfileUpdated({
            userId: doctorId,
            verificationStatus: status,
            verificationNotes: notes
          });
          
          // Ensure all data is persisted
          persistDoctorProfiles();
          persistAllData();
          
          console.log("[DoctorVerificationPage] Doctor verification status successfully persisted");
        } catch (error) {
          console.error("[DoctorVerificationPage] Error persisting verification status:", error);
        }
      }
      
      // Show success message
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        // Redirect to verification list page to show updated data
        router.push('/admin/doctor-verification');
      }, 2000);
    } catch (error) {
      console.error("[DoctorVerificationPage] Error updating doctor verification status:", error);
      // Set error state
      setError("Failed to update verification status. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner />
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="min-h-screen bg-background text-foreground py-8 px-4 md:px-12 lg:px-32">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 mb-6">
            <div className="text-red-600 dark:text-red-400 text-center py-8">
              <h2 className="text-xl font-bold mb-4">Error</h2>
              <p>{error}</p>
              <Button
                onClick={() => router.push('/admin/doctor-verification')}
                className="mt-4"
                label="Return to Verification List"
                pageName="doctor-verification-error"
              >
                Return to Verification List
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background text-foreground py-8 px-4 md:px-12 lg:px-32">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 mb-6">
            <div className="text-center text-muted-foreground py-8">
              <h2 className="text-xl font-bold mb-4">Doctor Not Found</h2>
              <p>The requested doctor verification data could not be found.</p>
              <Button
                onClick={() => router.push('/admin/doctor-verification')}
                className="mt-4"
                label="Return to Verification List"
                pageName="doctor-verification-not-found"
              >
                Return to Verification List
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Helper to get doctor name
  const getDoctorName = () => doctor.fullName || doctor.doctorId;

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 md:px-12 lg:px-32">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex flex-col items-center md:items-start">
              <img
                src={doctor.profilePictureUrl ?? "https://via.placeholder.com/150?text=Doctor"}
                alt={getDoctorName()}
                className="w-20 h-20 rounded-full object-cover border mb-2"
              />
              <div className="font-semibold text-lg">{getDoctorName()}</div>
              <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
              <div className="text-xs text-muted-foreground">{doctor.experience} yrs experience</div>
              <div className="text-xs text-muted-foreground">{doctor.location}</div>
              <div className="text-xs text-muted-foreground">Languages: {Array.isArray(doctor.languages) ? doctor.languages.join(", ") : "None specified"}</div>
              <div className="text-xs text-muted-foreground">Fee: ${doctor.fee || 0}</div>
              <div className="text-xs text-muted-foreground">License #: {doctor.licenseNumber}</div>
            </div>
            <div className="md:w-2/3">
              <h2 className="font-bold text-lg mb-2">Verification Documents</h2>
              <ul className="list-disc pl-5 mb-4">
                {Array.isArray(doctor.documents) && doctor.documents.length > 0 ? (
                  doctor.documents.map((doc: string, idx: number) => (
                    <li key={idx} className="text-sm">
                      {/* Placeholder: In real app, link to/view doc */}
                      <span className="underline cursor-pointer">{doc}</span>
                    </li>
                  ))
                ) : doctor.documents && typeof doctor.documents === 'object' ? (
                  Object.entries(doctor.documents)
                    .filter(([_, url]) => url)
                    .map(([key, url], idx) => (
                      <li key={idx} className="text-sm">
                        <span className="underline cursor-pointer">
                          {key.replace('Url', '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </li>
                    ))
                ) : (
                  <li>No documents uploaded.</li>
                )}
              </ul>
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
