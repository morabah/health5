"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { mockGetDoctorVerifications } from "@/lib/mockApiService";
import { VerificationStatus } from "@/types/enums";
import type { DoctorVerification } from "@/types/doctor";

/**
 * Admin Doctor Verification List Page
 * Displays all doctors pending or completed verification, with filters and navigation to detail pages.
 */
const DoctorVerificationListPage: React.FC = () => {
  const [verifications, setVerifications] = useState<DoctorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<VerificationStatus | "all">("all");
  const router = useRouter();

  useEffect(() => {
    async function fetchVerifications() {
      setLoading(true);
      setError(null);
      const key = 'health_app_data_doctor_verifications';
      try {
        // Try loading from localStorage first
        const stored = localStorage.getItem(key);
        if (stored) {
          setVerifications(JSON.parse(stored));
        } else {
          // No stored data: fetch from API and persist
          const items = await mockGetDoctorVerifications();
          setVerifications(items);
          try {
            localStorage.setItem(key, JSON.stringify(items));
          } catch (e) {
            console.error('Failed to persist doctor verifications', e);
          }
        }
      } catch (err) {
        setError('Failed to load doctor verifications.');
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
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Doctor Verifications</h1>
      <Card className="w-full max-w-4xl mb-8 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">Verification Requests</h2>
          <div className="flex gap-2 items-center">
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
    </main>
  );
};

export default DoctorVerificationListPage;
