"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { loadAdminDashboardData } from '@/data/adminLoaders';
import { mockGetDoctorVerificationData } from '@/lib/mockApiService';
import { VerificationStatus } from "@/types/enums";

interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  pendingVerifications: number;
  activeAppointments: number;
}

interface PendingDoctor {
  id: string;
  name: string;
  specialty: string;
  status: VerificationStatus;
  submittedAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    pendingVerifications: 0,
    activeAppointments: 0
  });
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const data = await loadAdminDashboardData();
        
        // Set stats
        setStats({
          totalUsers: data.stats?.totalUsers || 0,
          totalPatients: data.stats?.totalPatients || 0,
          totalDoctors: data.stats?.totalDoctors || 0,
          pendingVerifications: data.stats?.pendingVerifications || 0,
          activeAppointments: data.stats?.activeAppointments || 0
        });
        
        // Set pending doctors
        if (data.pendingDoctors && Array.isArray(data.pendingDoctors)) {
          setPendingDoctors(data.pendingDoctors);
        }
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  const handleViewDoctor = (doctorId: string) => {
    console.log("Navigating to doctor verification page for doctorId:", doctorId);
    
    // For debugging: show the URL we're navigating to
    const url = `/admin/doctor-verification/${doctorId}`;
    console.log("URL:", url);
    
    // Navigate to the doctor verification page
    router.push(url);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </Card>
          <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Patients</h3>
            <p className="text-2xl font-bold">{stats.totalPatients}</p>
          </Card>
          <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Doctors</h3>
            <p className="text-2xl font-bold">{stats.totalDoctors}</p>
          </Card>
          <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Verifications</h3>
            <p className="text-2xl font-bold">{stats.pendingVerifications}</p>
          </Card>
          <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Appointments</h3>
            <p className="text-2xl font-bold">{stats.activeAppointments}</p>
          </Card>
        </div>
        
        {/* Pending verifications */}
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Doctor Verification Requests</h2>
            <Button 
              label="View All Doctors"
              pageName="admin-dashboard"
              asChild
            >
              <Link href="/admin/users?filter=doctor">View All Doctors</Link>
            </Button>
          </div>
          
          {loading && <div className="flex justify-center py-8"><Spinner /></div>}
          
          {error && <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>}
          
          {!loading && !error && pendingDoctors.length === 0 && (
            <div className="text-gray-600 dark:text-gray-400 text-center py-8">
              No pending verification requests
            </div>
          )}
          
          {!loading && !error && pendingDoctors.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap">{doctor.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{doctor.specialty}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doctor.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {doctor.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          label="Review"
                          pageName="admin-dashboard"
                          size="sm"
                          onClick={() => handleViewDoctor(doctor.id)}
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
        
        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-medium mb-2">Manage Users</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">View and manage all system users</p>
            <Button 
              label="User Management"
              pageName="admin-dashboard"
              size="sm"
              asChild
            >
              <Link href="/admin/users">Go to User Management</Link>
            </Button>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-medium mb-2">System Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Configure system behavior and features</p>
            <Button 
              label="Settings"
              pageName="admin-dashboard"
              size="sm"
              asChild
            >
              <Link href="/admin/settings">Go to Settings</Link>
            </Button>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-medium mb-2">System Logs</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">View system activity and error logs</p>
            <Button 
              label="View Logs"
              pageName="admin-dashboard"
              size="sm"
              asChild
            >
              <Link href="/admin/logs">View Logs</Link>
            </Button>
          </Card>
        </div>
      </div>
    </main>
  );
}
