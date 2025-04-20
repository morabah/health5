"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { mockGetDoctorVerifications, mockGetAllUsers } from "@/lib/mockApiService";
import { VerificationStatus, UserType } from "@/types/enums";
import type { DoctorVerification } from "@/types/doctor";
import { persistDoctorProfiles, persistAllData } from '@/lib/mockDataPersistence';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";

/**
 * Admin Doctor Verification List Page
 * Displays all doctors pending or completed verification, with filters and navigation to detail pages.
 * Also provides access to patient profiles for editing.
 */
const DoctorVerificationListPage: React.FC = () => {
  const [verifications, setVerifications] = useState<DoctorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<VerificationStatus | "all">("all");
  const [patients, setPatients] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Force persistence of doctor data on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        console.log("[DoctorVerificationListPage] Ensuring data persistence");
        persistDoctorProfiles();
        persistAllData();
      } catch (e) {
        console.error('Error persisting data:', e);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchVerifications() {
      setLoading(true);
      setError(null);
      const key = 'health_app_data_doctor_verifications';
      try {
        console.log("[DoctorVerificationListPage] Fetching doctor verifications");
        
        // Fetch the verifications data directly from the API
        const items = await mockGetDoctorVerifications();
        console.log("[DoctorVerificationListPage] Received verifications:", items);
        setVerifications(items);
        
        // Fetch all users to get patients
        const users = await mockGetAllUsers();
        const patientUsers = users.filter(user => user.userType === UserType.PATIENT);
        setPatients(patientUsers);
        
        // Also persist to localStorage for future use
        try {
          localStorage.setItem(key, JSON.stringify(items));
          console.log("[DoctorVerificationListPage] Saved verifications to localStorage");
        } catch (e) {
          console.error('Failed to persist doctor verifications', e);
        }
      } catch (err) {
        console.error("[DoctorVerificationListPage] Error fetching verifications:", err);
        setError('Failed to load doctor verifications.');
        
        // Try to load from localStorage as fallback
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            console.log("[DoctorVerificationListPage] Loading from localStorage fallback");
            setVerifications(JSON.parse(stored));
          }
        } catch (e) {
          console.error("[DoctorVerificationListPage] Fallback loading failed:", e);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchVerifications();
  }, []);

  // Save to localStorage whenever verifications change
  useEffect(() => {
    try {
      localStorage.setItem(
        'health_app_data_doctor_verifications',
        JSON.stringify(verifications)
      );
    } catch (e) {
      console.error('Failed to sync doctor verifications to localStorage', e);
    }
  }, [verifications]);

  const filtered = filter === "all"
    ? verifications
    : verifications.filter(v => v.status === filter);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Admin Manager</h1>
      
      <Tabs defaultValue="doctors" className="w-full max-w-4xl">
        <TabsList className="mb-6 grid grid-cols-2">
          <TabsTrigger value="doctors">Doctor Verifications</TabsTrigger>
          <TabsTrigger value="patients">Manage Patients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="doctors">
          <Card className="w-full max-w-4xl mb-8 p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold">Verification Requests</h2>
              <div className="flex gap-2 items-center">
                <Button
                  size="sm"
                  label="Approve All Pending"
                  pageName="DoctorVerificationListPage"
                  variant="success"
                  onClick={() => {
                    const pendingDocs = verifications.filter(v => v.status === VerificationStatus.PENDING);
                    if (pendingDocs.length > 0) {
                      // Approve all pending doctors
                      Promise.all(
                        pendingDocs.map(doc => 
                          mockSetDoctorVerificationStatus(doc.id, VerificationStatus.APPROVED, "Auto-approved")
                        )
                      ).then(() => {
                        // Update local state
                        setVerifications(prev => 
                          prev.map(v => v.status === VerificationStatus.PENDING 
                            ? {...v, status: VerificationStatus.APPROVED} 
                            : v
                          )
                        );
                        showSuccess(`Approved ${pendingDocs.length} doctor(s) successfully!`);
                        // Force data persistence
                        persistDoctorProfiles();
                        persistAllData();
                      });
                    } else {
                      showSuccess("No pending doctors to approve");
                    }
                  }}
                  className="mr-2"
                >
                  Approve All Pending
                </Button>
                <Button
                  size="sm"
                  label="Import All Users"
                  pageName="DoctorVerificationListPage"
                  variant="outline"
                  onClick={() => {
                    persistAllData();
                    showSuccess("All user data imported successfully!");
                  }}
                  className="mr-2"
                >
                  Import All Users
                </Button>
                <label htmlFor="filter" className="text-sm font-medium">Status:</label>
                <select
                  id="filter"
                  className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100"
                  value={filter}
                  onChange={e => setFilter(e.target.value as VerificationStatus | "all")}
                >
                  <option value="all">All</option>
                  <option value={VerificationStatus.PENDING}>Pending</option>
                  <option value={VerificationStatus.APPROVED}>Approved</option>
                  <option value={VerificationStatus.REJECTED}>Rejected</option>
                </select>
              </div>
            </div>
            {successMessage && (
              <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
                {successMessage}
              </div>
            )}
            {loading && <div className="flex justify-center py-8"><Spinner /></div>}
            {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
            {!loading && !error && filtered.length === 0 && (
              <EmptyState
                title="No doctor verifications."
                message="There are no doctor verification requests in this category."
                className="my-8"
              />
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Specialty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(doctor => (
                      <tr key={doctor.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 whitespace-nowrap">{doctor.name ?? doctor.id}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{doctor.specialty}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{doctor.experience} yrs</td>
                        <td className="px-4 py-2 whitespace-nowrap">{doctor.location}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            doctor.status === VerificationStatus.PENDING ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                            doctor.status === VerificationStatus.APPROVED ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {doctor.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link href={`/admin/doctor-verification/${doctor.id}`}>
                            <Button 
                              size="sm" 
                              label="Review" 
                              pageName="DoctorVerificationListPage"
                            >
                              Review
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="patients">
          <Card className="w-full max-w-4xl mb-8 p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold">Patient Profiles</h2>
            </div>
            {loading && <div className="flex justify-center py-8"><Spinner /></div>}
            {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
            {!loading && !error && patients.length === 0 && (
              <EmptyState
                title="No patients found."
                message="There are no patient profiles in the system."
                className="my-8"
              />
            )}
            {!loading && !error && patients.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(patient => (
                      <tr key={patient.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 whitespace-nowrap">{patient.firstName} {patient.lastName}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{patient.email}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            patient.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {patient.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link href={`/admin/users/${patient.id}`}>
                            <Button 
                              size="sm" 
                              label="Edit" 
                              pageName="PatientListPage"
                            >
                              Edit
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default DoctorVerificationListPage;
