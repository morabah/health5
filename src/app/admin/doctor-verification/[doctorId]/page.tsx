"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { logValidation } from "@/lib/logger";
import { loadDoctorVerificationData } from '@/data/doctorLoaders';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  location: string;
  languages: string[];
  fee: number;
  profilePicUrl: string;
  licenseNumber: string;
  documents: string[]; // URLs or names
  status: "pending" | "approved" | "rejected";
}

export default function DoctorVerificationPage() {
  const { doctorId } = useParams() as { doctorId: string };
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchVerification() {
      setLoading(true);
      try {
        const data = await loadDoctorVerificationData(doctorId);
        setDoctor(data);
        setStatus(data.status || "pending");
      } catch {
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

  const handleSave = () => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    }, 1200);
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

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 md:px-12 lg:px-32">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 flex flex-col items-center md:items-start">
              <img
                src={doctor.profilePicUrl}
                alt={doctor.name}
                className="w-20 h-20 rounded-full object-cover border mb-2"
              />
              <div className="font-semibold text-lg">{doctor.name}</div>
              <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
              <div className="text-xs text-muted-foreground">{doctor.experience} yrs experience</div>
              <div className="text-xs text-muted-foreground">{doctor.location}</div>
              <div className="text-xs text-muted-foreground">Languages: {doctor.languages.join(", ")}</div>
              <div className="text-xs text-muted-foreground">Fee: ${doctor.fee}</div>
              <div className="text-xs text-muted-foreground">License #: {doctor.licenseNumber}</div>
            </div>
            <div className="md:w-2/3">
              <h2 className="font-bold text-lg mb-2">Verification Documents</h2>
              <ul className="list-disc pl-5 mb-4">
                {doctor.documents && doctor.documents.length > 0 ? (
                  doctor.documents.map((doc, idx) => (
                    <li key={idx} className="text-sm">
                      {/* Placeholder: In real app, link to/view doc */}
                      <span className="underline cursor-pointer">{doc}</span>
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
                  onChange={(e) => setStatus(e.target.value as "pending" | "approved" | "rejected")}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
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
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Decision"}
              </Button>
              {success && <div className="text-green-600 mt-2 text-center">Decision saved.</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
