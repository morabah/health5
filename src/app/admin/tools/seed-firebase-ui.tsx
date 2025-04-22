"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { toast } from "react-hot-toast";

const SEED_OPTIONS = [
  { key: "users", label: "Users" },
  { key: "doctors", label: "Doctors" },
  { key: "patients", label: "Patients" },
  { key: "doctorSchedules", label: "Doctor Schedules" },
  { key: "appointments", label: "Appointments" },
  { key: "notifications", label: "Notifications" },
  { key: "verificationDocs", label: "Doctor Verifications" },
];

export default function SeedFirebaseUI() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleToggle = (key: string) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/seed-firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collections: selected.join(",") })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Seeded: ${selected.join(", ")}`);
        toast.success("Seeding complete!");
      } else {
        setResult(data.error || "Seeding failed");
        toast.error(data.error || "Seeding failed");
      }
    } catch (err) {
      setResult("Seeding failed");
      toast.error("Seeding failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-8 p-6">
      <h2 className="text-xl font-bold mb-4">Seed Firebase Data</h2>
      <div className="space-y-2 mb-4">
        {SEED_OPTIONS.map(opt => (
          <div key={opt.key} className="flex items-center">
            <Checkbox
              id={opt.key}
              checked={selected.includes(opt.key)}
              onChange={() => handleToggle(opt.key)}
            />
            <label htmlFor={opt.key} className="ml-2 cursor-pointer">{opt.label}</label>
          </div>
        ))}
      </div>
      <Button onClick={handleSeed} disabled={loading || selected.length === 0}>
        {loading ? "Seeding..." : "Seed Selected Data"}
      </Button>
      {result && <div className="mt-4 text-sm text-gray-600">{result}</div>}
    </Card>
  );
}
