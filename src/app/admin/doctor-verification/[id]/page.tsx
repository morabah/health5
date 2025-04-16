"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import Link from "next/link";
import Alert from "@/components/ui/Alert";
import { mockGetDoctorVerificationData, mockSetDoctorVerificationStatus } from "@/lib/mockApiService";
import { VerificationStatus } from "@/types/enums";
import { logInfo } from "@/lib/logger";

interface DoctorVerificationData {
  doctorId: string;
  name: string;
  specialty: string;
  licenseNumber: string;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  licenseDocumentUrl?: string;
  certificateUrl?: string;
}

export default function DoctorVerificationDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [doctorData, setDoctorData] = useState<DoctorVerificationData | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchDoctorData() {
      setLoading(true);
      setError(null);
      try {
        const data = await mockGetDoctorVerificationData(id);
        setDoctorData(data as DoctorVerificationData);
        // Pre-fill notes if they exist
        if (data.verificationNotes) {
          setNotes(data.verificationNotes);
        }
      } catch (err) {
        console.error("Error fetching doctor data:", err);
        setError("Failed to load doctor verification data.");
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchDoctorData();
    }
  }, [id]);

  const handleVerificationAction = async (status: VerificationStatus) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (status === VerificationStatus.REJECTED && !notes.trim()) {
        throw new Error("Rejection requires notes explaining the reason.");
      }

      const result = await mockSetDoctorVerificationStatus({
        doctorId: id,
        status,
        notes: notes.trim() || (status === VerificationStatus.VERIFIED ? "Approved by admin." : ""),
      });
      
      logInfo("Doctor verification status updated", { doctorId: id, status, notes });
      
      // Update local state to reflect the change
      if (doctorData) {
        setDoctorData({
          ...doctorData,
          verificationStatus: status,
          verificationNotes: notes,
        });
      }
      
      setSuccess(`Doctor's verification status has been updated to ${status}.`);
      
      // After 2 seconds, redirect back to the list
      setTimeout(() => {
        router.push("/admin/doctor-verification");
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "Failed to update verification status.");
    } finally {
      setSubmitting(false);
    }
  };

  // Define status badges with consistent styling
  const getStatusBadge = (status: VerificationStatus) => {
    const classes = {
      [VerificationStatus.PENDING]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      [VerificationStatus.VERIFIED]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      [VerificationStatus.REJECTED]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${classes[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Doctor Verification Details</h1>
          <Button 
            asChild 
            variant="secondary" 
            label="Back to List" 
            pageName="DoctorVerificationDetail"
          >
            <Link href="/admin/doctor-verification">Back to List</Link>
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <Alert variant="error" message={error} isVisible={true} />
        ) : !doctorData ? (
          <Alert variant="warning" message="No doctor data found." isVisible={true} />
        ) : (
          <>
            <Card className="mb-6 p-6">
              <h2 className="text-xl font-semibold mb-4">Doctor Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium">{doctorData.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Specialty</p>
                  <p className="font-medium">{doctorData.specialty}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">License Number</p>
                  <p className="font-medium">{doctorData.licenseNumber}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-medium mt-1">{getStatusBadge(doctorData.verificationStatus)}</p>
                </div>
              </div>
              
              {doctorData.verificationNotes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Previous Notes</p>
                  <p className="font-medium mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    {doctorData.verificationNotes}
                  </p>
                </div>
              )}
            </Card>
            
            <Card className="mb-6 p-6">
              <h2 className="text-xl font-semibold mb-4">Verification Documents</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium">License Document</h3>
                  </div>
                  <div className="p-4">
                    {doctorData.licenseDocumentUrl ? (
                      <div className="flex flex-col items-center">
                        <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2 rounded">
                          <span className="text-gray-500 dark:text-gray-400">Document Preview</span>
                        </div>
                        <Button 
                          asChild 
                          size="sm" 
                          variant="secondary" 
                          label="View Document" 
                          pageName="DoctorVerificationDetail"
                        >
                          <a href={doctorData.licenseDocumentUrl} target="_blank" rel="noopener noreferrer">View Document</a>
                        </Button>
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No license document available.</p>
                    )}
                  </div>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium">Certificate</h3>
                  </div>
                  <div className="p-4">
                    {doctorData.certificateUrl ? (
                      <div className="flex flex-col items-center">
                        <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2 rounded">
                          <span className="text-gray-500 dark:text-gray-400">Certificate Preview</span>
                        </div>
                        <Button 
                          asChild 
                          size="sm" 
                          variant="secondary" 
                          label="View Certificate" 
                          pageName="DoctorVerificationDetail"
                        >
                          <a href={doctorData.certificateUrl} target="_blank" rel="noopener noreferrer">View Certificate</a>
                        </Button>
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No certificate available.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="mb-6 p-6">
              <h2 className="text-xl font-semibold mb-4">Verification Action</h2>
              
              <div className="mb-4">
                <Textarea
                  label="Admin Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add verification notes (required for rejection, optional for approval)"
                />
              </div>
              
              {success && (
                <Alert 
                  variant="success" 
                  message={success} 
                  isVisible={true} 
                  className="mb-4"
                />
              )}
              
              {error && (
                <Alert 
                  variant="error" 
                  message={error} 
                  isVisible={true} 
                  className="mb-4"
                />
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  label="Approve"
                  pageName="DoctorVerificationDetail"
                  onClick={() => handleVerificationAction(VerificationStatus.VERIFIED)}
                  disabled={submitting || doctorData.verificationStatus === VerificationStatus.VERIFIED}
                  isLoading={submitting && doctorData.verificationStatus !== VerificationStatus.VERIFIED}
                >
                  Approve
                </Button>
                
                <Button
                  variant="danger"
                  label="Reject"
                  pageName="DoctorVerificationDetail"
                  onClick={() => handleVerificationAction(VerificationStatus.REJECTED)}
                  disabled={submitting || doctorData.verificationStatus === VerificationStatus.REJECTED || !notes.trim()}
                  isLoading={submitting && doctorData.verificationStatus !== VerificationStatus.REJECTED}
                >
                  Reject
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </main>
  );
} 