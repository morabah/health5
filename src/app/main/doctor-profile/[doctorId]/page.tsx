"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { logValidation } from "@/lib/logger";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  location: string;
  languages: string[];
  fee: number;
  available: boolean;
  profilePicUrl: string;
  bio: string;
  education: string;
  services: string[];
  reviews: { reviewer: string; comment: string; rating: number }[];
}

type TabKey = "bio" | "education" | "services" | "reviews";

export default function DoctorProfilePage() {
  const { doctorId } = useParams() as { doctorId: string };
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("bio");
  const router = useRouter();

  useEffect(() => {
    async function fetchDoctor() {
      if (!db || !doctorId) return;
      setLoading(true);
      try {
        const docRef = doc(collection(db, "mockDoctors"), doctorId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDoctor({ id: doctorId, ...docSnap.data() } as Doctor);
        } else {
          setDoctor(null);
        }
      } catch {
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    logValidation("main-doctor-profile-ui", "success");
  }, []);

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
      <div className="max-w-3xl mx-auto">
        <Card className="flex flex-col md:flex-row gap-6 p-6">
          <div className="flex flex-col items-center md:items-start md:w-1/3">
            <img
              src={doctor.profilePicUrl}
              alt={doctor.name}
              className="w-28 h-28 rounded-full object-cover border mb-2"
            />
            <div className="font-semibold text-xl">{doctor.name}</div>
            <div className="text-sm text-muted-foreground">{doctor.specialty}</div>
            <div className="text-xs text-muted-foreground">{doctor.experience} yrs experience</div>
            <div className="text-xs text-muted-foreground">{doctor.location}</div>
            <div className="text-xs text-muted-foreground">Languages: {doctor.languages.join(", ")}</div>
            <div className="text-xs text-muted-foreground">Fee: ${doctor.fee}</div>
            <div className="mt-2">
              <span className={doctor.available ? "text-green-600" : "text-red-500"}>
                {doctor.available ? "Available" : "Unavailable"}
              </span>
            </div>
            <Button className="mt-4 w-full" onClick={() => router.push(`/main/book-appointment/${doctor.id}`)}>
              Book Appointment
            </Button>
          </div>
          <div className="md:w-2/3">
            <div className="flex gap-4 border-b pb-2 mb-4">
              <button
                className={`px-2 py-1 font-medium ${tab === "bio" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setTab("bio")}
              >
                Bio
              </button>
              <button
                className={`px-2 py-1 font-medium ${tab === "education" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setTab("education")}
              >
                Education
              </button>
              <button
                className={`px-2 py-1 font-medium ${tab === "services" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setTab("services")}
              >
                Services
              </button>
              <button
                className={`px-2 py-1 font-medium ${tab === "reviews" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setTab("reviews")}
              >
                Reviews
              </button>
            </div>
            {tab === "bio" && (
              <div className="text-base whitespace-pre-line">{doctor.bio || "No bio available."}</div>
            )}
            {tab === "education" && (
              <div className="text-base whitespace-pre-line">{doctor.education || "No education info provided."}</div>
            )}
            {tab === "services" && (
              <ul className="list-disc pl-5">
                {doctor.services && doctor.services.length > 0 ? (
                  doctor.services.map((service, idx) => <li key={idx}>{service}</li>)
                ) : (
                  <li>No services listed.</li>
                )}
              </ul>
            )}
            {tab === "reviews" && (
              <div>
                {doctor.reviews && doctor.reviews.length > 0 ? (
                  doctor.reviews.map((review, idx) => (
                    <div key={idx} className="mb-3 p-2 border rounded bg-muted">
                      <div className="font-semibold">{review.reviewer}</div>
                      <div className="text-xs text-muted-foreground">Rating: {review.rating}/5</div>
                      <div className="text-base">{review.comment}</div>
                    </div>
                  ))
                ) : (
                  <div>No reviews yet.</div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
