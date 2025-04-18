'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { mockGetDoctorVerifications } from '@/lib/mockApiService';
import { VerificationStatus } from '@/types/enums';
import type { DoctorVerification } from '@/types/doctor';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | VerificationStatus>('ALL');
  const router = useRouter();

  useEffect(() => {
    async function loadDoctors() {
      setLoading(true);
      setError(null);
      try {
        const items = await mockGetDoctorVerifications();
        setDoctors(items);
      } catch (err) {
        console.error('Error loading doctors:', err);
        setError('Failed to load doctors.');
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, []);

  const filtered =
    filter === 'ALL'
      ? doctors
      : doctors.filter((d: DoctorVerification) => d.status === filter);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Doctor Management
        </h1>
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <label className="font-medium text-gray-700 dark:text-gray-300">Filter:</label>
              <select
                className="input input-bordered"
                value={filter}
                onChange={e => setFilter(e.target.value as any)}
              >
                <option value="ALL">All</option>
                <option value={VerificationStatus.PENDING}>Pending</option>
                <option value={VerificationStatus.APPROVED}>Approved</option>
                <option value={VerificationStatus.REJECTED}>Rejected</option>
                <option value={VerificationStatus.MORE_INFO_REQUIRED}>
                  More Info Required
                </option>
              </select>
            </div>
          </div>
          {loading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}
          {error && <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>}
          {!loading && filtered.length === 0 && (
            <div className="text-gray-600 dark:text-gray-400 text-center py-8">
              No doctors found.
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Doctor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Specialty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.map(doc => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">{doc.name || doc.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{doc.specialty || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.dateSubmitted).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            doc.status === VerificationStatus.APPROVED
                              ? 'bg-green-100 text-green-800'
                              : doc.status === VerificationStatus.REJECTED
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          size="sm"
                          label="Review"
                          pageName="admin-doctors"
                          onClick={() =>
                            router.push(`/admin/doctor-verification/${doc.id}`)
                          }
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
