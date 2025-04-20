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
import { loadPatientAppointments } from "@/data/patientLoaders";
import { logInfo, logWarn, logError, logValidation } from "@/lib/logger";
import { FaUserMd, FaCalendarCheck, FaUser, FaNotesMedical, FaBell, FaSignOutAlt, FaClipboardList, FaClock } from "react-icons/fa";
import Link from "next/link";
import { getApiMode, onApiModeChange } from "@/config/apiConfig";
import { formatDate, isPastDate } from "@/utils/dateUtils";
import { useAuth } from "@/context/AuthContext";
import { getFunctions, httpsCallable } from "firebase/functions";

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
        // Fetch live profile via Cloud Function
        logInfo("[PatientDashboard] Fetching live profile data");
        if (!user) throw new Error("User not authenticated");
        const functions = getFunctions();
        const getProfileFn = httpsCallable<{}, { userProfile: UserProfile; patientProfile: PatientProfile }>(functions, "getMyUserProfileData");
        const response = await getProfileFn({});
        const { userProfile, patientProfile } = response.data;
        setProfileData({ userProfile, patientProfile });

        // Load appointments for the user
        const appointments = await loadPatientAppointments(user.uid);
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

  // Spinner & Error states
  if (loadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <Alert message={error} />
      </div>
    );
  }

  // UI: Stats Cards
  const stats = [
    {
      title: "Upcoming",
      icon: <FaCalendarCheck size={24} className="text-blue-500 dark:text-blue-400" />,
      value: loadingAppointments ? "-" : upcomingAppointments.length,
      color: "bg-blue-50 dark:bg-blue-900/30",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      title: "Doctors",
      icon: <FaUserMd size={24} className="text-emerald-500 dark:text-emerald-400" />,
      value: "3", // Placeholder
      color: "bg-emerald-50 dark:bg-emerald-900/30",
      borderColor: "border-emerald-200 dark:border-emerald-800"
    },
    {
      title: "Profile",
      icon: <FaUser size={24} className="text-purple-500 dark:text-purple-400" />,
      value: profileData.userProfile ? "Complete" : "-",
      color: "bg-purple-50 dark:bg-purple-900/30",
      borderColor: "border-purple-200 dark:border-purple-800"
    },
    {
      title: "Documents",
      icon: <FaClipboardList size={24} className="text-pink-500 dark:text-pink-400" />,
      value: "2", // Placeholder
      color: "bg-pink-50 dark:bg-pink-900/30",
      borderColor: "border-pink-200 dark:border-pink-800"
    },
  ];

  // Determine the greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* API Mode Indicator - Small and subtle */}
        <div className="fixed top-2 right-2 z-50">
          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            apiMode === 'live' 
              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
          }`}>
            <span className="mr-1">API:</span> {apiMode === 'live' ? 'Live' : 'Mock'}
          </div>
        </div>

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {greeting}{profileData.userProfile?.firstName ? `, ${profileData.userProfile.firstName}` : ""}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button 
              asChild 
              variant="secondary" 
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              label="Notifications" 
              pageName="PatientDashboard"
            >
              <Link href="/notifications" className="flex items-center gap-2">
                <FaBell size={16} />
                <span>Notifications</span>
              </Link>
            </Button>
            <Button 
              asChild 
              variant="secondary" 
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              label="Logout" 
              pageName="PatientDashboard"
            >
              <Link href="/auth/logout" className="flex items-center gap-2">
                <FaSignOutAlt size={16} />
                <span>Logout</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column (2/3 width on desktop) */}
          <div className="md:col-span-2 space-y-6">
            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card 
                  key={stat.title} 
                  className={`flex flex-col p-4 border ${stat.borderColor} ${stat.color} hover:shadow-md transition-shadow`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                      {stat.icon}
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-auto">
                    {stat.title}
                  </div>
                </Card>
              ))}
            </div>

            {/* Upcoming Appointments Section */}
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <FaCalendarCheck className="text-blue-500 dark:text-blue-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Appointments</h2>
                </div>
                <Link href="/patient/appointments">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="text-sm border border-gray-300 dark:border-gray-700"
                    label="View All" 
                    pageName="PatientDashboard"
                  >
                    View All
                  </Button>
                </Link>
              </div>
              
              <div className="p-4">
                {loadingAppointments ? (
                  <div className="flex justify-center py-6"><Spinner /></div>
                ) : error ? (
                  <Alert variant="error" message={error} isVisible={true} />
                ) : upcomingAppointments.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming appointments found.</p>
                    <Button 
                      asChild 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      label="Book Appointment" 
                      pageName="PatientDashboard"
                    >
                      <Link href="/find">Book Appointment</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.slice(0, 3).map((appt) => (
                      <div key={appt.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <div className="md:w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center md:mr-2">
                          <FaClock className="text-blue-600 dark:text-blue-400 text-xl" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">Dr. {appt.doctorName}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{appt.doctorSpecialty || "General Practitioner"}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {formatDate(appt.appointmentDate)} • {appt.startTime}
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 md:items-center mt-2 md:mt-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            appt.status === AppointmentStatus.CONFIRMED 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                              : appt.status === AppointmentStatus.PENDING
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}>
                            {appt.status === AppointmentStatus.CONFIRMED ? "Confirmed" : 
                             appt.status === AppointmentStatus.PENDING ? "Pending" : 
                             appt.status === AppointmentStatus.CANCELLED ? "Cancelled" : "Unknown"}
                          </span>
                          <Button 
                            asChild
                            size="sm" 
                            className="text-sm whitespace-nowrap"
                            label="View Details" 
                            pageName="PatientDashboard"
                          >
                            <Link href={`/patient/appointments/${appt.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {upcomingAppointments.length > 3 && (
                      <div className="text-center pt-2">
                        <Link 
                          href="/patient/appointments" 
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          View all {upcomingAppointments.length} appointments
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: "Book Appointment", href: "/find", bgColor: "bg-blue-600 hover:bg-blue-700" },
                  { name: "My Appointments", href: "/patient/appointments", bgColor: "bg-green-600 hover:bg-green-700" },
                  { name: "My Profile", href: "/patient/profile", bgColor: "bg-purple-600 hover:bg-purple-700" },
                  { name: "Medical Records", href: "/patient/records", bgColor: "bg-pink-600 hover:bg-pink-700" },
                  { name: "Find Doctors", href: "/find", bgColor: "bg-indigo-600 hover:bg-indigo-700" },
                  { name: "Contact Support", href: "/contact", bgColor: "bg-amber-600 hover:bg-amber-700" }
                ].map((action, i) => (
                  <Button 
                    key={i} 
                    asChild
                    className={`whitespace-nowrap text-white ${action.bgColor}`}
                    label={action.name} 
                    pageName="PatientDashboard"
                  >
                    <Link href={action.href}>{action.name}</Link>
                  </Button>
                ))}
              </div>
            </Card>
          </div>
          
          {/* Right Column (1/3 width on desktop) */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-24 flex items-end p-4">
                <div className="bg-white dark:bg-gray-800 rounded-full h-20 w-20 border-4 border-white dark:border-gray-800 shadow-md flex items-center justify-center overflow-hidden">
                  <FaUser size={32} className="text-gray-400" />
                </div>
              </div>
              
              <div className="p-4 pt-8">
                {loadingProfile ? (
                  <div className="flex justify-center py-4"><Spinner /></div>
                ) : !profileData.userProfile ? (
                  <Alert variant="error" message="Profile data not found." isVisible={true} />
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {profileData.userProfile.firstName} {profileData.userProfile.lastName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Patient</p>
                    
                    <div className="space-y-2">
                      {profileData.patientProfile && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Date of Birth</span>
                            <span className="text-gray-900 dark:text-white">{
                              formatDate(profileData.patientProfile.dateOfBirth, { 
                                year: 'numeric', month: 'short', day: 'numeric' 
                              })
                            }</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Gender</span>
                            <span className="text-gray-900 dark:text-white">{profileData.patientProfile.gender}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Blood Type</span>
                            <span className="text-gray-900 dark:text-white">{profileData.patientProfile.bloodType}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Email</span>
                        <span className="text-gray-900 dark:text-white">{profileData.userProfile.email}</span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button 
                        asChild
                        className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                        label="Edit Profile" 
                        pageName="PatientDashboard"
                      >
                        <Link href="/patient/profile">Edit Profile</Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
            
            {/* Recent Activity Card */}
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <div className="p-4">
                {loadingAppointments ? (
                  <div className="flex justify-center py-4"><Spinner /></div>
                ) : pastAppointments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity found</p>
                ) : (
                  <div className="space-y-4">
                    {pastAppointments.slice(0, 3).map((appt, index) => (
                      <div key={index} className="flex gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <FaUserMd className="text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Appointment with Dr. {appt.doctorName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(appt.appointmentDate)} • {appt.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
            
            {/* Health Tips Card */}
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Health Tips</h2>
              </div>
              <div className="p-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Daily Health Reminder</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    Remember to stay hydrated and take short breaks from screen time every 20 minutes to reduce eye strain.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
