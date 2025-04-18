"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { logValidation } from "@/lib/logger";
import { mockGetDoctorVerificationDetails, mockSetDoctorVerificationStatus } from "@/lib/mockApiService";
import { VerificationStatus } from "@/types/enums";
import type { DoctorVerificationData } from '@/types/doctor';

export default function DoctorVerificationPage() {
  const params = useParams();
  const doctorId = params?.doctorId as string;
  console.log("Doctor verification page - params:", params);
  console.log("Doctor verification page - doctorId:", doctorId);
  
  const [doctor, setDoctor] = useState<DoctorVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.PENDING);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchVerification() {
      if (!doctorId) {
        console.error("No doctorId provided");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        console.log("Fetching verification data for doctorId:", doctorId);
        console.log("DoctorId type:", typeof doctorId);
        console.log("Request URL would be: /api/admin/doctors/verification/" + doctorId);
        const data = await mockGetDoctorVerificationDetails(doctorId);
        console.log("Received verification data:", data);
        if (data) {
          setDoctor(data as DoctorVerificationData);
          setStatus(data.status || VerificationStatus.PENDING);
        } else {
          console.error("No data returned from mockGetDoctorVerificationDetails");
        }
      } catch (error) {
        console.error("Error fetching verification data:", error);
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
    setSaving(true);
    try {
      await mockSetDoctorVerificationStatus(doctorId, status, notes);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.push("/admin/dashboard");
      }, 2000);
    } catch {
      // Optionally set error state
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

  if (!doctor) {
    return <div className="text-center text-muted-foreground">Doctor not found.</div>;
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
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
