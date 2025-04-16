"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadDoctors } from '@/data/loadDoctors';
import { db } from "@/lib/firebase";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
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
}

export default function FindDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      try {
        // Use the unified loader for dynamic data source
        let allDoctors = await loadDoctors();
        // Filtering (for demo, only specialty filter is implemented)
        if (specialty) {
          allDoctors = allDoctors.filter((doc: Doctor) => doc.specialty === specialty);
        }
        setDoctors(allDoctors);
      } catch (e) {
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, [specialty, location, language]);

  useEffect(() => {
    logValidation("main-find-doctors-ui", "success");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 md:px-12 lg:px-32">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Find a Doctor</h1>
        <div className="flex flex-wrap gap-4 mb-6">
          <Input
            type="text"
            placeholder="Specialty"
            value={specialty}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpecialty(e.target.value)}
            className="w-48"
          />
          <Input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
            className="w-48"
          />
          <Input
            type="text"
            placeholder="Language"
            value={language}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLanguage(e.target.value)}
            className="w-48"
          />
          <Button onClick={() => { setSpecialty(""); setLocation(""); setLanguage(""); }}>Clear</Button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground">No doctors found.</div>
            ) : (
              doctors.map((doctor) => (
                <Card
                  key={doctor.id}
                  className="cursor-pointer hover:shadow-lg transition"
                  onClick={() => router.push(`/main/doctor-profile/${doctor.id}`)}
                >
                  <div className="flex flex-col items-center p-4">
                    <img
                      src={doctor.profilePicUrl}
                      alt={doctor.name}
                      className="w-20 h-20 rounded-full mb-2 object-cover border"
                    />
                    <div className="font-semibold text-lg">{doctor.name}</div>
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
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
