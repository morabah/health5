"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import Select from "@/components/ui/Select";
import dynamic from 'next/dynamic';

interface Tool {
  id: string;
  label: string;
  apiEndpoint: string;
}

const tools: Tool[] = [
  {
    id: "validate-firestore-schemas",
    label: "Validate Firestore Against Zod Schemas",
    apiEndpoint: "/api/admin/validate-firestore-schemas",
  },
  {
    id: "fix-missing-user-names",
    label: "Fix Missing User Names",
    apiEndpoint: "/api/admin/run-script?name=fix-missing-user-names",
  },
  {
    id: "add-default-availability-to-doctors",
    label: "Add Default Doctor Availability",
    apiEndpoint: "/api/admin/run-script?name=add-default-availability-to-doctors",
  },
  {
    id: "fix-doctor-availability-dayofweek",
    label: "Fix Doctor Availability Day of Week",
    apiEndpoint: "/api/admin/run-script?name=fix-doctor-availability-dayofweek",
  },
  {
    id: "create-admin-user",
    label: "Create Admin User",
    apiEndpoint: "/api/admin/run-script?name=create-admin-user",
  },
  {
    id: "fix-user-uid-associations",
    label: "Fix User UID Associations",
    apiEndpoint: "/api/admin/run-script?name=fix-user-uid-associations",
  },
];

const backendFns: Tool[] = [
  {
    id: "createUserProfileInFirestore",
    label: "Create User Profile",
    apiEndpoint: "/api/admin/run-backend-fn?name=createUserProfileInFirestore",
  },
  {
    id: "createDoctorProfileInFirestore",
    label: "Create Doctor Profile",
    apiEndpoint: "/api/admin/run-backend-fn?name=createDoctorProfileInFirestore",
  },
  {
    id: "createPatientProfileInFirestore",
    label: "Create Patient Profile",
    apiEndpoint: "/api/admin/run-backend-fn?name=createPatientProfileInFirestore",
  },
];

// Dynamically import the SeedFirebaseUI component (for client-side only)
const SeedFirebaseUI = dynamic(() => import('./seed-firebase-ui'), { ssr: false });

export default function AdminToolsPage() {
  // Optionally, protect this page with a server-side admin check or redirect
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, string>>({});
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/list-doctors")
      .then((res) => res.json())
      .then((data) => setDoctors(data.doctors || []));
  }, []);

  const handleRunTool = async (tool: Tool) => {
    setLoading(tool.id);
    setResult((r) => ({ ...r, [tool.id]: "" }));
    try {
      const res = await fetch(tool.apiEndpoint, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Prefer output if available, otherwise message
        setResult((r) => ({ ...r, [tool.id]: data.output || data.message || "Success" }));
        toast.success(data.message || "Success");
      } else {
        setResult((r) => ({ ...r, [tool.id]: data.error || "Failed" }));
        toast.error(data.error || "Error");
      }
    } catch (e: any) {
      setResult((r) => ({ ...r, [tool.id]: e.message || "Error" }));
      toast.error(e.message || "Error");
    } finally {
      setLoading(null);
    }
  };

  // Handler for get appointments by doctor
  async function handleGetAppointmentsByDoctor() {
    if (!selectedDoctor) return;
    setLoading("get-appointments-by-doctor");
    setResult((r) => ({ ...r, ["get-appointments-by-doctor"]: "" }));
    try {
      const res = await fetch("/api/admin/run-backend-fn?name=getAppointmentsByDoctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: selectedDoctor }),
      });
      const data = await res.json();
      setResult((r) => ({ ...r, ["get-appointments-by-doctor"]: data.output || data.error || "No output" }));
    } catch (e: any) {
      setResult((r) => ({ ...r, ["get-appointments-by-doctor"]: e.message || "Error" }));
    } finally {
      setLoading(null);
    }
  }

  const handleResetDatabase = async () => {
    setLoading('reset-database');
    setResult((r) => ({ ...r, ['reset-database']: '' }));
    try {
      const res = await fetch('/api/admin/run-script?name=delete-all-firestore-data', { method: 'POST' });
      const data = await res.json();
      setResult((r) => ({ ...r, ['reset-database']: data.message || data.error || 'No output' }));
      toast.success('Database reset complete!');
    } catch (e: any) {
      setResult((r) => ({ ...r, ['reset-database']: e.message || 'Error' }));
      toast.error('Database reset failed!');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Tools</h1>
      <div className="mb-10">
        <div className="space-y-4">
          {tools.map((tool) => (
            <div key={tool.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <Button
                  label={tool.label}
                  pageName="AdminToolsPage"
                  variant="primary"
                  isLoading={loading === tool.id}
                  disabled={!!loading}
                  onClick={() => handleRunTool(tool)}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {result[tool.id] && result[tool.id].length < 80 ? result[tool.id] : ''}
                </span>
              </div>
              {result[tool.id] && (
                <textarea
                  className="w-full min-h-[80px] rounded border border-gray-300 dark:border-gray-600 p-2 text-xs font-mono bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 resize-y"
                  value={result[tool.id]}
                  readOnly
                  spellCheck={false}
                  aria-label={`Output for ${tool.label}`}
                />
              )}
            </div>
          ))}
        </div>
        <h2 className="text-xl font-semibold mt-10 mb-4">Backend Functions</h2>
        <div className="space-y-4">
          {backendFns.map((tool) => (
            <div key={tool.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <Button
                  label={tool.label}
                  pageName="AdminToolsPage"
                  variant="primary"
                  isLoading={loading === tool.id}
                  disabled={!!loading}
                  onClick={() => handleRunTool(tool)}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {result[tool.id] && result[tool.id].length < 80 ? result[tool.id] : ''}
                </span>
              </div>
              {result[tool.id] && (
                <textarea
                  className="w-full min-h-[80px] rounded border border-gray-300 dark:border-gray-600 p-2 text-xs font-mono bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 resize-y"
                  value={result[tool.id]}
                  readOnly
                  spellCheck={false}
                  aria-label={`Output for ${tool.label}`}
                />
              )}
            </div>
          ))}
        </div>
        <h2 className="text-xl font-semibold mt-10 mb-4">Get Appointments by Doctor</h2>
        <div className="flex flex-col gap-4 max-w-lg">
          <Select
            label="Select Doctor"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            options={[
              { value: '', label: '-- Select --' },
              ...doctors.map((d) => ({
                value: d.userId || d.id,
                label: `${d.firstName || ''} ${d.lastName || ''} (${d.userId || d.id})`,
              })),
            ]}
          />
          <Button
            label="Get Appointments"
            pageName="AdminToolsPage"
            variant="primary"
            isLoading={loading === "get-appointments-by-doctor"}
            disabled={!selectedDoctor || !!loading}
            onClick={handleGetAppointmentsByDoctor}
          />
          {result["get-appointments-by-doctor"] && (
            <textarea
              className="w-full min-h-[120px] rounded border border-gray-300 dark:border-gray-600 p-2 text-xs font-mono bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 resize-y"
              value={result["get-appointments-by-doctor"]}
              readOnly
              spellCheck={false}
              aria-label="Appointments Output"
            />
          )}
        </div>
        <div className="flex flex-col gap-4 mt-8">
          <Button
            label="Reset Firestore Database"
            pageName="AdminToolsPage"
            variant="danger"
            onClick={handleResetDatabase}
            isLoading={loading === 'reset-database'}
          >
            Reset Firestore Database
          </Button>
          {result['reset-database'] && (
            <textarea
              className="w-full mt-2 text-xs bg-gray-100 dark:bg-gray-800 rounded p-2"
              rows={3}
              value={result['reset-database']}
              readOnly
              spellCheck={false}
              aria-label="Output for Firestore reset"
            />
          )}
        </div>
      </div>
      {/* --- Firebase Seeder UI --- */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Seed Firebase Data</h2>
        <SeedFirebaseUI />
      </div>
    </div>
  );
}
