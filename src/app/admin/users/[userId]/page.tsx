"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import Input from "@/components/ui/Input";
import { mockGetUserProfile, mockDeactivateUser, mockResetUserPassword, mockUpdateUserProfile } from "@/lib/mockApiService";
import { UserType } from "@/types/enums";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: UserType | string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  profilePicUrl?: string;
}

export default function UserDetailPage() {
  const { userId } = useParams() as { userId: string };
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<UserProfile>>({});
  const router = useRouter();

  useEffect(() => {
    async function fetchUserProfile() {
      setLoading(true);
      setError(null);
      try {
        const userData = await mockGetUserProfile(userId);
        setUser(userData);
        setEditedUser({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          address: userData.address,
        });
      } catch (err) {
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchUserProfile();
  }, [userId]);

  const handleDeactivateUser = async () => {
    if (!user) return;
    
    setActionInProgress('deactivate');
    try {
      await mockDeactivateUser(userId);
      // Update the user in the local state
      setUser(prev => {
        if (!prev) return null;
        return { ...prev, isActive: !prev.isActive };
      });
      
      showSuccess(`User status changed to ${user.isActive ? 'inactive' : 'active'} successfully.`);
    } catch (error) {
      setError("Failed to update user status.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResetPassword = async () => {
    setActionInProgress('reset');
    try {
      await mockResetUserPassword(userId);
      showSuccess("Password reset email sent to user.");
    } catch (error) {
      setError("Failed to send password reset email.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEditChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedUser(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveProfile = async () => {
    setActionInProgress('save');
    try {
      const result = await mockUpdateUserProfile(userId, editedUser);
      
      if (result && result.success) {
        setUser(prev => {
          if (!prev) return null;
          return { ...prev, ...editedUser };
        });
        setEditing(false);
        showSuccess("User profile updated successfully.");
      } else {
        setError("Failed to update user profile.");
      }
    } catch (error) {
      setError("Failed to update user profile.");
    } finally {
      setActionInProgress(null);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
        <Card className="w-full max-w-2xl p-6">
          <div className="text-red-600 dark:text-red-400 mb-4">{error || "User not found."}</div>
          <Button
            label="Back to Users"
            pageName="admin-user-detail"
            asChild
          >
            <Link href="/admin/users">Back to Users</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Profile</h1>
          <Button
            label="Back to Users"
            pageName="admin-user-detail"
            size="sm"
            asChild
          >
            <Link href="/admin/users">Back to Users</Link>
          </Button>
        </div>

        {successMessage && (
          <div className="bg-green-100 text-green-800 p-3 mb-4 rounded-md">
            {successMessage}
          </div>
        )}

        <Card className="mb-6 overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row gap-6">
            {/* User photo and basic info */}
            <div className="md:w-1/3 flex flex-col items-center md:items-start">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
                {user.profilePicUrl ? (
                  <img
                    src={user.profilePicUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500">
                    <span className="text-2xl font-bold">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="text-center md:text-left">
                <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
                <p className="text-gray-600 dark:text-gray-400 capitalize">{user.userType}</p>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 w-full">
                <Button
                  label={user.isActive ? "Deactivate User" : "Activate User"}
                  pageName="admin-user-detail"
                  variant="warning"
                  onClick={handleDeactivateUser}
                  isLoading={actionInProgress === 'deactivate'}
                  disabled={actionInProgress !== null}
                  className="w-full"
                >
                  {user.isActive ? "Deactivate User" : "Activate User"}
                </Button>
                
                <Button
                  label="Reset Password"
                  pageName="admin-user-detail"
                  variant="secondary"
                  onClick={handleResetPassword}
                  isLoading={actionInProgress === 'reset'}
                  disabled={actionInProgress !== null || !user.isActive}
                  className="w-full"
                >
                  Reset Password
                </Button>
              </div>
            </div>
            
            {/* User details */}
            <div className="md:w-2/3">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Profile Information</h3>
                {!editing ? (
                  <Button
                    label="Edit Profile"
                    pageName="admin-user-detail"
                    size="sm"
                    onClick={() => setEditing(true)}
                    disabled={actionInProgress !== null}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      label="Cancel"
                      pageName="admin-user-detail"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditing(false);
                        // Reset edited user to current user values
                        if (user) {
                          setEditedUser({
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            phoneNumber: user.phoneNumber,
                            address: user.address,
                          });
                        }
                      }}
                      disabled={actionInProgress !== null}
                    >
                      Cancel
                    </Button>
                    <Button
                      label="Save Changes"
                      pageName="admin-user-detail"
                      size="sm"
                      onClick={handleSaveProfile}
                      isLoading={actionInProgress === 'save'}
                      disabled={actionInProgress !== null}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
              
              {!editing ? (
                // Read-only view
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">First Name</div>
                      <div>{user.firstName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Last Name</div>
                      <div>{user.lastName}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div>{user.email}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Phone Number</div>
                    <div>{user.phoneNumber || "Not provided"}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Address</div>
                    <div>{user.address || "Not provided"}</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email Verified</div>
                      <div>{user.emailVerified ? "Yes" : "No"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Registration Date</div>
                      <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  {user.userType === 'patient' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Date of Birth</div>
                        <div>{user.dateOfBirth || "Not provided"}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Gender</div>
                        <div className="capitalize">{user.gender || "Not provided"}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Edit mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={editedUser.firstName || ''}
                      onChange={handleEditChange('firstName')}
                    />
                    <Input
                      label="Last Name"
                      value={editedUser.lastName || ''}
                      onChange={handleEditChange('lastName')}
                    />
                  </div>
                  
                  <Input
                    label="Email"
                    value={editedUser.email || ''}
                    onChange={handleEditChange('email')}
                    type="email"
                  />
                  
                  <Input
                    label="Phone Number"
                    value={editedUser.phoneNumber || ''}
                    onChange={handleEditChange('phoneNumber')}
                  />
                  
                  <Input
                    label="Address"
                    value={editedUser.address || ''}
                    onChange={handleEditChange('address')}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {user.userType === 'doctor' && (
          <div className="flex justify-end">
            <Button
              label="View Verification Details"
              pageName="admin-user-detail"
              asChild
            >
              <Link href={`/admin/doctor-verification/${userId}`}>View Verification Details</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
} 