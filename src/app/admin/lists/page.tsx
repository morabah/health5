"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { mockGetAllUsers } from "@/lib/mockApiService";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export default function AdminListsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "admin" | "doctor" | "patient">("all");
  const router = useRouter();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const items = await mockGetAllUsers();
        setUsers(items);
      } catch (err) {
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleViewUserDetails = (userId: string, userType: string) => {
    if (userType.toLowerCase() === 'doctor') {
      router.push(`/admin/doctor-verification/${userId}`);
    } else {
      router.push(`/admin/users/${userId}`);
    }
  };

  // Filter the users based on filter
  const filteredUsers = filter === "all" 
    ? users 
    : users.filter(user => user.userType.toLowerCase() === filter);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">System Users</h1>
      <Card className="w-full max-w-5xl mb-8 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">User Directory</h2>
            <div className="flex items-center">
              <label htmlFor="filter" className="text-sm font-medium mr-2">Role:</label>
              <select
                id="filter"
                className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100"
                value={filter}
                onChange={e => setFilter(e.target.value as "all" | "admin" | "doctor" | "patient")}
              >
                <option value="all">All</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              label="Back to Dashboard"
              pageName="admin-lists"
              asChild
            >
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
            <Button 
              label="User Management"
              pageName="admin-lists"
              variant="secondary"
              asChild
            >
              <Link href="/admin/users">Full User Management</Link>
            </Button>
          </div>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && filteredUsers.length === 0 && (
          <EmptyState
            title="No users found."
            message="There are no users in this category. Try a different filter or check back later."
            className="my-8"
          />
        )}
        {!loading && filteredUsers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 whitespace-nowrap">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{user.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap capitalize">{user.userType}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${user.isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <Button
                        label="View Profile"
                        pageName="admin-lists"
                        size="sm"
                        onClick={() => handleViewUserDetails(user.id, user.userType)}
                      >
                        View Profile
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
