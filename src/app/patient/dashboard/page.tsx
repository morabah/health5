"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import { UserProfile } from "@/types/user";
import { PatientProfile } from "@/types/patient";
import { Appointment } from "@/types/appointment";
import { AppointmentStatus } from "@/types/enums";
import { loadPatientProfile, loadPatientAppointments } from "@/data/patientLoaders";
import { logInfo, logWarn, logError, logValidation } from "@/lib/logger";
import { FaUserMd, FaCalendarCheck, FaUser, FaNotesMedical } from "react-icons/fa";
import Link from "next/link";
import { getApiMode, onApiModeChange } from "@/config/apiConfig";
import { formatDate, isPastDate } from "@/utils/dateUtils";
import { useAuth } from "@/context/AuthContext";

const MOCK_PATIENT_ID = "mockPatient123";

export default function PatientDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{
    userProfile: UserProfile | null;
    patientProfile: PatientProfile | null;
  }>({ userProfile: null, patientProfile: null });
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [apiMode, setApiMode] = useState<'live' | 'mock'>(getApiMode());
  const [hasMounted, setHasMounted] = useState(false);

  // Add effect to handle component mounting
  useEffect(() => {
    setHasMounted(true);
    return () => setHasMounted(false);
  }, []);

  // Add effect to listen for API mode changes
  useEffect(() => {
    if (!hasMounted) return;

    console.log('[PatientDashboard] Setting up API mode listener, current mode:', apiMode);
    
    // Register for API mode changes
    const unsubscribe = onApiModeChange((newMode) => {
      console.log('[PatientDashboard] API mode changed:', newMode);
      setApiMode(newMode);
    });
    
    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [hasMounted]);

  // Update main data fetch to use authenticated user data if available
  useEffect(() => {
    if (!hasMounted) return;
    
    async function fetchDashboardData() {
      setLoadingProfile(true);
      setLoadingAppointments(true);
      setError(null);
      logInfo("[PatientDashboard] Fetching profile and appointments", { apiMode });
      const perfStart = performance.now();

      try {
        // Use auth context user if available, otherwise use mock ID
        const userId = user?.uid || MOCK_PATIENT_ID;
        console.log("[PatientDashboard] Using user ID:", userId);
        
        // If we have a userProfile from auth, use it directly
        if (userProfile) {
          console.log("[PatientDashboard] Using authenticated user profile");
          
          // Set profile data from auth context
          setProfileData({
            userProfile,
            patientProfile: { 
              userId: userProfile.id,
              dateOfBirth: new Date('1990-01-01'), // Default values if not in auth profile
              gender: 'Other', // Valid enum value
              bloodType: 'Unknown',
              medicalHistory: 'None provided'
            }
          });
        } else {
          // Fall back to loading profile from mock data
          console.log("[PatientDashboard] Falling back to mock profile data");
          const profile = await loadPatientProfile(userId);
          
          // Handle different response structures
          const formattedProfile = {
            userProfile: profile?.userProfile || profile?.user || null,
            patientProfile: profile?.patientProfile || profile?.profile || null
          };
          
          setProfileData(formattedProfile);
        }
        
        // Load appointments for the user
        const appointments = await loadPatientAppointments(userId);
        console.log("[PatientDashboard] Loaded appointments:", appointments.length);
        
        // Filter appointments using the isPastDate utility
        const upcoming = appointments.filter((appt) => 
          appt.status === AppointmentStatus.PENDING || 
          appt.status === AppointmentStatus.CONFIRMED ||
          !isPastDate(appt.appointmentDate)
        );
        
        const past = appointments.filter((appt) => 
          appt.status === AppointmentStatus.COMPLETED || 
          appt.status === AppointmentStatus.CANCELLED ||
          isPastDate(appt.appointmentDate)
        );
        
        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
      } catch (err) {
        logError("[PatientDashboard] Failed to fetch patient data", { error: err });
        setError("Failed to load dashboard data.");
      } finally {
        setLoadingProfile(false);
        setLoadingAppointments(false);
        const perfEnd = performance.now();
        logInfo("[PatientDashboard] Data fetch complete", { durationMs: perfEnd - perfStart, apiMode });
        logValidation("3.10", "success");
      }
    }
    
    // Only fetch data when auth loading is complete
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [apiMode, hasMounted, user, userProfile, authLoading]);

  // UI: Stats Cards
  const stats = [
    {
      title: "Upcoming",
      icon: <FaCalendarCheck className="text-blue-500 dark:text-blue-400" />,
      value: loadingAppointments ? "-" : upcomingAppointments.length,
    },
    {
      title: "Doctors",
      icon: <FaUserMd className="text-green-500 dark:text-green-400" />,
      value: "3", // Placeholder
    },
    {
      title: "Profile",
      icon: <FaUser className="text-purple-500 dark:text-purple-400" />,
      value: profileData.userProfile ? "Complete" : "-",
    },
    {
      title: "Notes",
      icon: <FaNotesMedical className="text-pink-500 dark:text-pink-400" />,
      value: "-", // Placeholder
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Welcome Header */}
      <h1 className="text-3xl font-bold mb-2 dark:text-white">
        Welcome{profileData.userProfile?.firstName ? `, ${profileData.userProfile.firstName}` : "!"}
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">This is your patient dashboard.</p>

      {/* API Mode Indicator - Add this to show current mode */}
      <div className={`inline-flex items-center px-3 py-1 mb-4 rounded-full border text-xs font-semibold ${apiMode === 'live' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-blue-100 text-blue-800 border-blue-300'}`}
           aria-label={`Current data source: ${apiMode === 'live' ? 'Live (Firestore)' : 'Mock (Offline Data)'}`}>
        <span className="mr-2">Data Source:</span> {apiMode === 'live' ? 'Live (Firestore)' : 'Mock (Offline Data)'}
      </div>

      {/* Quick Links */}
      <div className="w-full flex flex-wrap gap-4 justify-end mb-6">
        <Button 
          asChild 
          variant="secondary" 
          label="Profile" 
          pageName="PatientDashboard"
        >
          <Link href="/patient/profile">Profile</Link>
        </Button>
        <Button 
          asChild 
          variant="secondary" 
          label="Notifications" 
          pageName="PatientDashboard"
        >
          <Link href="/notifications">Notifications</Link>
        </Button>
        <Button 
          asChild 
          variant="secondary" 
          label="Logout" 
          pageName="PatientDashboard"
        >
          <Link href="/auth/logout">Logout</Link>
        </Button>
      </div>
      {/* Book Appointment CTA */}
      <div className="w-full flex justify-end mb-4">
        <Button 
          asChild 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" 
          label="Book Appointment" 
          pageName="PatientDashboard"
        >
          <Link href="/find">Book Appointment</Link>
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="flex flex-col items-center py-6 dark:bg-gray-800">
            {stat.icon}
            <div className="mt-2 text-lg font-semibold dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-300">{stat.title}</div>
          </Card>
        ))}
      </div>

      {/* Upcoming Appointments Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold dark:text-white">Upcoming Appointments</h2>
          <Link href="/patient/appointments">
            <Button 
              size="sm" 
              variant="secondary" 
              label="View All" 
              pageName="PatientDashboard"
            >
              View All
            </Button>
          </Link>
        </div>
        {loadingAppointments ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : error ? (
          <Alert variant="error" message={error} isVisible={true} />
        ) : upcomingAppointments.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">No upcoming appointments found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {upcomingAppointments.map((appt) => (
              <div key={appt.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <div className="font-bold text-lg mb-1 text-blue-900 dark:text-white">
                    <Link href={appt.doctorId ? `/main/doctor-profile/${appt.doctorId}` : '#'} className="hover:underline" aria-label={`View profile for ${appt.doctorName || 'Doctor'}`}>{appt.doctorName || 'Doctor'}</Link>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-1">
                    {formatDate(appt.appointmentDate)}
                  </div>
                  <div className="mb-1">
                    <span className={
                      appt.status === AppointmentStatus.PENDING ? "inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                      appt.status === AppointmentStatus.CONFIRMED ? "inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                      appt.status === AppointmentStatus.CANCELLED ? "inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                      "inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }>
                      {appt.status === AppointmentStatus.PENDING ? "Pending" : appt.status === AppointmentStatus.CONFIRMED ? "Confirmed" : appt.status === AppointmentStatus.CANCELLED ? "Cancelled" : "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 md:mt-0">
                  <Button 
                    asChild 
                    size="sm" 
                    aria-label={`View appointment details`}
                    label="View" 
                    pageName="PatientDashboard"
                  >
                    <Link href={`/patient/appointments/${appt.id}`}>View</Link>
                  </Button>
                  {appt.status === AppointmentStatus.PENDING && 
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      disabled 
                      label="Cancel" 
                      pageName="PatientDashboard"
                    >
                      Cancel
                    </Button>
                  }
                  {appt.status === AppointmentStatus.PENDING && 
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      disabled 
                      label="Reschedule" 
                      pageName="PatientDashboard"
                    >
                      Reschedule
                    </Button>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold dark:text-white mb-2">Past Appointments</h2>
        {!loadingAppointments && !error && pastAppointments.length === 0 && (
          <div className="text-gray-500 dark:text-gray-400">No past appointments found.</div>
        )}
        {!loadingAppointments && pastAppointments.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {pastAppointments.map((appt) => (
              <div key={appt.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <div className="font-bold text-lg mb-1 text-blue-900 dark:text-white">
                    <Link href={appt.doctorId ? `/main/doctor-profile/${appt.doctorId}` : '#'} className="hover:underline" aria-label={`View profile for ${appt.doctorName || 'Doctor'}`}>{appt.doctorName || 'Doctor'}</Link>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-1">
                    {formatDate(appt.appointmentDate)}
                  </div>
                  <div className="mb-1">
                    <span className={
                      appt.status === AppointmentStatus.COMPLETED ? "inline-block px-2 py-1 text-xs rounded bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200" :
                      appt.status === AppointmentStatus.CANCELLED ? "inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                      "inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }>
                      {appt.status === AppointmentStatus.COMPLETED ? "Completed" : appt.status === AppointmentStatus.CANCELLED ? "Cancelled" : "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 md:mt-0">
                  <Button 
                    asChild 
                    size="sm" 
                    aria-label={`View appointment details`}
                    label="View" 
                    pageName="PatientDashboard"
                  >
                    <Link href={`/patient/appointments/${appt.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold dark:text-white">Profile Info</h2>
          <Link href="/patient/profile">
            <Button 
              size="sm" 
              variant="secondary"
              label="Edit Profile" 
              pageName="PatientDashboard"
            >
              Edit Profile
            </Button>
          </Link>
        </div>
        <Card className="dark:bg-gray-800">
          {loadingProfile ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : profileData.userProfile && profileData.patientProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">Name</div>
                <div className="font-semibold dark:text-white">{profileData.userProfile.firstName} {profileData.userProfile.lastName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">Email</div>
                <div className="font-semibold dark:text-white">{profileData.userProfile.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">DOB</div>
                <div className="font-semibold dark:text-white">
                  {formatDate(profileData.patientProfile.dateOfBirth, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">Gender</div>
                <div className="font-semibold dark:text-white">{profileData.patientProfile.gender}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">Blood Type</div>
                <div className="font-semibold dark:text-white">{profileData.patientProfile.bloodType}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-300">Medical History</div>
                <div className="font-semibold dark:text-white">{profileData.patientProfile.medicalHistory || "-"}</div>
              </div>
            </div>
          ) : (
            <Alert variant="error" message="Profile data not found." isVisible={true} />
          )}
        </Card>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          label="View Medical Records"
          pageName="PatientDashboard"
        >
          View Medical Records
        </Button>
      </div>

      {/* Alert message for errors */}
      {error && (
        <Alert
          variant="error"
          message={error}
          isVisible={true}
        />
      )}
    </div>
  );
}
