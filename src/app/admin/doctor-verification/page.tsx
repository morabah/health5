"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { VerificationStatus, UserType } from "@/types/enums";
import type { DoctorVerification } from "@/types/doctor";
import { collection, getDocs, getFirestore, updateDoc, doc, getDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/improvedFirebaseClient";
import { DoctorVerificationSchema } from "@/lib/zodSchemas";
import { safeValidateWithZod } from "@/lib/zodValidator";

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  useEffect(() => {
    async function fetchVerifications() {
      setLoading(true);
      setError(null);
      try {
        console.log("[DoctorVerificationListPage] Fetching doctor verifications");
        
        // Fetch all doctor verifications from Firestore
        const db = await getFirestoreDb();
        const snapshot = await getDocs(collection(db, "doctorVerifications"));
        
        // First pass - extract verification data
        const rawVerifications = snapshot.docs.map(docSnapshot => ({ 
          id: docSnapshot.id, 
          ...docSnapshot.data() 
        }));
        
        // Create an array to hold all promises for user data fetch
        const userPromises = [];
        
        // Create promises to fetch user data
        for (const verification of rawVerifications) {
          const userId = verification.userId || verification.doctorId;
          if (userId) {
            const userPromise = getDoc(doc(db, "users", userId))
              .then(userDoc => ({ 
                userId,
                userExists: userDoc.exists(),
                userData: userDoc.exists() ? userDoc.data() : null
              }))
              .catch(() => ({ userId, userExists: false, userData: null }));
            
            userPromises.push(userPromise);
          }
        }
        
        // Wait for all user data promises to resolve
        const usersData = await Promise.all(userPromises);
        
        // Create a map of userId -> user data for easy lookup
        const userDataMap = {};
        usersData.forEach(userData => {
          if (userData.userExists && userData.userData) {
            userDataMap[userData.userId] = userData.userData;
          }
        });
        
        // Second pass - construct the final verification objects with user data
        const items = rawVerifications.map(raw => {
          // Get the user data for this verification
          const userId = raw.userId || raw.doctorId;
          const userData = userId ? userDataMap[userId] : null;
          
          // Enhance raw data with user information if available
          const enhancedRaw = {
            ...raw,
            name: userData ? `${userData.firstName} ${userData.lastName}` : null,
          };
          
          // Validate using the Zod schema
          const validationResult = safeValidateWithZod(
            DoctorVerificationSchema, 
            enhancedRaw,
            {
              contextName: 'doctor-verification-list',
              logErrors: true
            }
          );
          
          if (!validationResult.success) {
            console.warn('[Zod Validation] Invalid doctor verification:', enhancedRaw, validationResult.error);
            return null;
          }
          
          return { id: raw.id, ...validationResult.data, name: enhancedRaw.name };
        }).filter((v): v is DoctorVerification => v !== null);
        
        console.log("[DoctorVerificationListPage] Received verifications:", items);
        setVerifications(items);
      } catch (err) {
        console.error("[DoctorVerificationListPage] Error fetching verifications:", err);
        setError('Failed to load doctor verifications.');
      } finally {
        setLoading(false);
      }
    }
    fetchVerifications();
  }, []);

  const filtered = filter === "all"
    ? verifications
    : verifications.filter(v => v.status === filter);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Doctor Verification</h1>
        <Link
          href="/admin/dashboard"
          className="rounded bg-blue-700 hover:bg-blue-900 text-white px-2 py-1 text-sm transition-all duration-300 ease-in-out"
        >
          Back to Admin Dashboard
        </Link>
      </div>
      <Card className="w-full max-w-4xl mb-8 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Verification Requests</h2>
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              label="Approve All Pending"
              pageName="DoctorVerificationListPage"
              variant="primary"
              onClick={() => {
                const pendingDocs = verifications.filter(v => v.status === VerificationStatus.PENDING);
                if (pendingDocs.length > 0) {
                  // Approve all pending doctors
                  Promise.all(
                    pendingDocs.map(doc => 
                      updateDoc(doc(db, "doctorVerifications", doc.id), { status: VerificationStatus.APPROVED })
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
                  });
                } else {
                  showSuccess("No pending doctors to approve");
                }
              }}
              className="mr-2"
            >
              Approve All Pending
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
                    <td className="px-4 py-2 whitespace-nowrap">{doctor.name || doctor.id}</td>
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
    </main>
  );
};

export default DoctorVerificationListPage;
