"use client";
import React, { useEffect, useState } from "react";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { loadAdminDashboardData } from '@/data/adminLoaders';

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const data = await loadAdminDashboardData();
        setDashboardData(data);
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <ProtectedPage>
      <main className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Admin Dashboard (Protected)</h1>
        <p className="mt-2 text-gray-600">Only visible to authenticated admins.</p>
      </main>
    </ProtectedPage>
  );
}
