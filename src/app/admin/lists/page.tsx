"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { getFirestoreDb } from '@/lib/improvedFirebaseClient';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { UserProfile } from '@/types/user';
import { useRouter } from 'next/navigation';

// Zod schema for user validation
const UserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  userType: z.enum(['ADMIN', 'DOCTOR', 'PATIENT']),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
});

export default function AdminListsPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ADMIN' | 'DOCTOR' | 'PATIENT'>('all');
  const [search, setSearch] = useState('');
  const router = useRouter();
  
  // State for Add User modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userType: "PATIENT",
    phone: ""
  });
  const [addingUser, setAddingUser] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Fetch users from Firestore
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await getFirestoreDb();
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as UserProfile));
    } catch (e) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

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
  
  // Add user to Firestore
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUser(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      const validated = UserSchema.parse({ ...newUser, isActive: true });
      const db = await getFirestoreDb();
      await addDoc(collection(db, 'users'), {
        ...validated,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setAddSuccess(`User ${validated.firstName} ${validated.lastName} added successfully`);
      toast.success('User added');
      await fetchUsers();
      setNewUser({ firstName: '', lastName: '', email: '', userType: 'PATIENT', phone: '' });
      setTimeout(() => {
        setShowAddUserModal(false);
        setAddSuccess(null);
      }, 2000);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add user');
      toast.error('Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  // Filter and search logic
  const filteredUsers = users.filter(user => {
    if (filter !== 'all' && user.userType.toUpperCase() !== filter) return false;
    if (search && !(`${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">System Users</h1>
      <Card className="w-full max-w-5xl mb-8 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">User Directory</h2>
            <Input
              className="ml-4"
              placeholder="Search name or email"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex items-center ml-4">
              <label htmlFor="filter" className="text-sm font-medium mr-2">Role:</label>
              <select
                id="filter"
                className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-gray-100"
                value={filter}
                onChange={e => setFilter(e.target.value.toUpperCase() as 'all' | 'ADMIN' | 'DOCTOR' | 'PATIENT')}
              >
                <option value="all">All</option>
                <option value="ADMIN">Admin</option>
                <option value="DOCTOR">Doctor</option>
                <option value="PATIENT">Patient</option>
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
                    { value: "PATIENT", label: "Patient" },
                    { value: "DOCTOR", label: "Doctor" },
                    { value: "ADMIN", label: "Admin" }
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
