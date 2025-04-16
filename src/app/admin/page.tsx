"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";
import { db } from "@/lib/firebaseClient";
import { loadAdminDashboardData } from '@/data/adminLoaders';

interface UserVerification {
  id: string;
  name: string;
  role: string;
  status: string;
}

export default function AdminPage() {
  const [verifications, setVerifications] = useState<UserVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVerifications() {
      setLoading(true);
      setError(null);
      try {
        const data = await loadAdminDashboardData();
        setVerifications(data);
      } catch (err) {
        setError("Failed to load verifications.");
      } finally {
        setLoading(false);
      }
    }
    fetchVerifications();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
      <Card className="w-full max-w-4xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">User Verification Requests</h2>
          <Button asChild>
            <Link href="/admin/lists">View All Users</Link>
          </Button>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && verifications.length === 0 && (
          <div className="text-gray-600 dark:text-gray-300">No verification requests.</div>
        )}
        {!loading && verifications.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {verifications.map(user => (
                  <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.role}</td>
                    <td className="px-4 py-2">{user.status}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button size="sm" onClick={() => console.log('Approve', user.id)} disabled={user.status === 'approved'}>
                        Approve
                      </Button>
                      <Button size="sm" onClick={() => console.log('Reject', user.id)} disabled={user.status === 'rejected'} variant="secondary">
                        Reject
                      </Button>
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
}
