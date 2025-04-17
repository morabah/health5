"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { mockGetAllUsers, mockDeactivateUser, mockResetUserPassword } from "@/lib/mockApiService";
import { UserType } from "@/types/enums";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: UserType | string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "admin" | "doctor" | "patient">("all");
  const [search, setSearch] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const items = await mockGetAllUsers();
        setUsers(items);
        
        // Apply filter from URL if present
        const urlFilter = searchParams?.get('filter');
        if (urlFilter && ['all', 'admin', 'doctor', 'patient'].includes(urlFilter)) {
          setFilter(urlFilter as "all" | "admin" | "doctor" | "patient");
        }
      } catch (err) {
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [searchParams]);

  // Filter the users based on filter and search term
  const filteredUsers = users
    .filter(user => filter === "all" || user.userType.toLowerCase() === filter)
    .filter(user => 
      search === "" || 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase())
    );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleDeactivateUser = async (userId: string) => {
    setActionInProgress(userId);
    try {
      await mockDeactivateUser(userId);
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, isActive: !user.isActive } : user
        )
      );
      showSuccess(`User ${userId} status updated successfully.`);
    } catch (error) {
      setError("Failed to update user status.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    setActionInProgress(userId);
    try {
      await mockResetUserPassword(userId);
      showSuccess(`Password reset email sent to user.`);
    } catch (error) {
      setError("Failed to send password reset email.");
    } finally {
      setActionInProgress(null);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleViewUserDetails = (userId: string, userType: string) => {
    if (userType.toLowerCase() === 'doctor') {
      router.push(`/admin/doctor-verification/${userId}`);
    } else {
      router.push(`/admin/users/${userId}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">User Management</h1>
      <Card className="w-full max-w-5xl mb-8 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">User List</h2>
          
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="pl-8 pr-4 py-2 border rounded-md w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
                value={search}
                onChange={handleSearch}
              />
              <svg
                className="absolute left-2 top-3 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            
            {/* Role filter */}
            <div className="flex items-center">
              <label htmlFor="filter" className="text-sm font-medium mr-2">Role:</label>
              <select
                id="filter"
                className="border rounded px-2 py-2 text-sm dark:bg-gray-800 dark:text-gray-100"
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
        </div>
        
        {successMessage && (
          <div className="bg-green-100 text-green-800 p-3 mb-4 rounded-md">
            {successMessage}
          </div>
        )}
        
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        
        {error && <div className="text-red-600 dark:text-red-400 p-3 mb-4 rounded-md bg-red-50 dark:bg-red-900">{error}</div>}
        
        {!loading && !error && filteredUsers.length === 0 && (
          <EmptyState
            title="No users found."
            message={search ? "Try adjusting your search or filter." : "There are no users in this category."}
            className="my-8"
          />
        )}
        
        {!loading && !error && filteredUsers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                    <td className="px-4 py-4 whitespace-nowrap">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-4 py-4 whitespace-nowrap capitalize">{user.userType}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${user.isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button
                          label="View"
                          pageName="admin-users"
                          size="sm"
                          onClick={() => handleViewUserDetails(user.id, user.userType as string)}
                        >
                          View
                        </Button>
                        
                        <Button
                          label={user.isActive ? "Deactivate" : "Activate"}
                          pageName="admin-users"
                          size="sm"
                          variant="warning"
                          onClick={() => handleDeactivateUser(user.id)}
                          isLoading={actionInProgress === user.id}
                          disabled={actionInProgress !== null}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        
                        <Button
                          label="Reset Password"
                          pageName="admin-users"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleResetPassword(user.id)}
                          isLoading={actionInProgress === user.id}
                          disabled={actionInProgress !== null || !user.isActive}
                        >
                          Reset Password
                        </Button>
                      </div>
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

export default UserListPage;
