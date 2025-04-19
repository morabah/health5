"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { mockGetAllUsers, mockAddUser } from "@/lib/mockApiService";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

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
  
  // State for Add User modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userType: "patient",
    phone: ""
  });
  const [addingUser, setAddingUser] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const items = await mockGetAllUsers();
        // Check for persisted users in localStorage
        let loaded: User[] = items;
        try {
          const stored = localStorage.getItem('health_app_data_users');
          if (stored) loaded = JSON.parse(stored) as User[];
        } catch (e) {
          console.error('Failed to parse persisted users', e);
        }
        setUsers(loaded);
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
  
  const handleAddUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUser(true);
    setAddError(null);
    setAddSuccess(null);
    
    try {
      // Basic validation
      if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.userType) {
        throw new Error("Please fill all required fields");
      }
      
      // Email validation
      if (!/^\S+@\S+\.\S+$/.test(newUser.email)) {
        throw new Error("Please enter a valid email address");
      }
      
      // Submit to API
      const addedUser = await mockAddUser({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        userType: newUser.userType,
        phone: newUser.phone || undefined
      });
      
      // Update the user list with the new user and persist to localStorage
      setUsers(prev => {
        const updated = [...prev, addedUser];
        try {
          localStorage.setItem('health_app_data_users', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to persist users to localStorage', e);
        }
        return updated;
      });
      
      // Show success message
      setAddSuccess(`User ${newUser.firstName} ${newUser.lastName} added successfully`);
      
      // Reset form
      setNewUser({
        firstName: "",
        lastName: "",
        email: "",
        userType: "patient",
        phone: ""
      });
      
      // Close modal after a delay
      setTimeout(() => {
        setShowAddUserModal(false);
        setAddSuccess(null);
      }, 2000);
      
    } catch (err: any) {
      if (err.message === "email-already-exists") {
        setAddError("A user with this email already exists");
      } else {
        setAddError(err.message || "Failed to add user");
      }
    } finally {
      setAddingUser(false);
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
              label="Add User"
              pageName="admin-lists"
              variant="primary"
              onClick={() => setShowAddUserModal(true)}
            >
              Add User
            </Button>
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
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Add New User</h2>
            <form onSubmit={handleAddUserSubmit}>
              <div className="space-y-4">
                <Input
                  label="First Name *"
                  name="firstName"
                  value={newUser.firstName}
                  onChange={handleAddUserChange}
                  required
                />
                <Input
                  label="Last Name *"
                  name="lastName"
                  value={newUser.lastName}
                  onChange={handleAddUserChange}
                  required
                />
                <Input
                  label="Email *"
                  name="email"
                  type="email"
                  value={newUser.email}
                  onChange={handleAddUserChange}
                  required
                />
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={newUser.phone}
                  onChange={handleAddUserChange}
                />
                <Select
                  label="User Type *"
                  name="userType"
                  value={newUser.userType}
                  onChange={handleAddUserChange}
                  options={[
                    { value: "patient", label: "Patient" },
                    { value: "doctor", label: "Doctor" },
                    { value: "admin", label: "Admin" }
                  ]}
                  required
                />
                
                {addError && (
                  <div className="text-red-600 dark:text-red-400 text-sm">{addError}</div>
                )}
                
                {addSuccess && (
                  <div className="text-green-600 dark:text-green-400 text-sm">{addSuccess}</div>
                )}
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddUserModal(false)}
                    label="Cancel"
                    pageName="admin-lists"
                    disabled={addingUser}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={addingUser}
                    label="Add User"
                    pageName="admin-lists"
                    disabled={addingUser}
                  >
                    {addingUser ? "Adding..." : "Add User"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}
