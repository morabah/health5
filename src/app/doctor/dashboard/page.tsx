"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Link from "next/link";
import { FaUser, FaCalendarCheck, FaUserMd, FaNotesMedical, FaClipboardList, FaClock, FaUserInjured, FaBell, FaSignOutAlt, FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { mockGetDoctorPublicProfile, mockGetMyAppointments } from "@/lib/mockApiService";
import { AppointmentStatus, UserType } from "@/types/enums";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { formatDate, isPastDate } from "@/utils/dateUtils";

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    return () => setHasMounted(false);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    
    async function fetchProfile() {
      setLoadingProfile(true);
      setError(null);
      try {
        if (!user) return;
        const data = await mockGetDoctorPublicProfile({ doctorId: user.uid });
        setProfile(data);
      } catch (err) {
        setError("Failed to load profile.");
        console.error("Error loading doctor profile:", err);
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [user, hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    
    async function fetchAppointments() {
      setLoadingAppointments(true);
      setError(null);
      try {
        if (!user) return;
        const items = await mockGetMyAppointments(user.uid, UserType.DOCTOR);
        setAppointments(items);
      } catch (err) {
        setError("Failed to load appointments.");
        console.error("Error loading doctor appointments:", err);
        setAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    }
    fetchAppointments();
  }, [user, hasMounted]);

  const upcomingAppointments = appointments.filter(a => 
    a.status === AppointmentStatus.PENDING || 
    a.status === AppointmentStatus.CONFIRMED ||
    !isPastDate(a.appointmentDate)
  );
  
  const pastAppointments = appointments.filter(a => 
    a.status === AppointmentStatus.COMPLETED || 
    a.status === AppointmentStatus.CANCELLED ||
    isPastDate(a.appointmentDate)
  );

  // Calculate number of unique patients
  const uniquePatients = appointments.length > 0 
    ? new Set(appointments.map(a => a.patientId || a.patientName)).size 
    : 0;

  // Calculate profile completion percentage (placeholder logic)
  const profileCompletionPercentage = profile ? 
    ((profile.firstName ? 1 : 0) + 
     (profile.lastName ? 1 : 0) + 
     (profile.specialty ? 1 : 0) + 
     (profile.bio ? 1 : 0)) / 4 * 100 : 0;

  const stats = [
    {
      title: "Upcoming",
      icon: <FaCalendarCheck size={24} className="text-blue-500 dark:text-blue-400" />,
      value: loadingAppointments ? "-" : upcomingAppointments.length,
      color: "bg-blue-50 dark:bg-blue-900/30",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      title: "Patients",
      icon: <FaUserInjured size={24} className="text-emerald-500 dark:text-emerald-400" />,
      value: uniquePatients.toString(),
      color: "bg-emerald-50 dark:bg-emerald-900/30",
      borderColor: "border-emerald-200 dark:border-emerald-800"
    },
    {
      title: "Profile",
      icon: <FaUser size={24} className="text-purple-500 dark:text-purple-400" />,
      value: profile ? `${Math.round(profileCompletionPercentage)}%` : "-",
      color: "bg-purple-50 dark:bg-purple-900/30",
      borderColor: "border-purple-200 dark:border-purple-800"
    },
    {
      title: "Records",
      icon: <FaClipboardList size={24} className="text-pink-500 dark:text-pink-400" />,
      value: (pastAppointments.length || 0).toString(),
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
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {greeting}{profile?.firstName ? `, Dr. ${profile.firstName}` : ""}
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
                pageName="DoctorDashboard"
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
                pageName="DoctorDashboard"
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
                  <Link href="/doctor/appointments">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="text-sm border border-gray-300 dark:border-gray-700"
                      label="View All" 
                      pageName="DoctorDashboard"
                    >
                      View All
                    </Button>
                  </Link>
                </div>
                
                <div className="p-4">
                  {loadingAppointments ? (
                    <div className="flex justify-center py-6"><Spinner /></div>
                  ) : error ? (
                    <Alert variant="error" message={error || ''} isVisible={!!error} />
                  ) : upcomingAppointments.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming appointments found.</p>
                      <Button 
                        asChild
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        label="Set Availability" 
                        pageName="DoctorDashboard"
                      >
                        <Link href="/doctor/availability">Set Availability</Link>
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
                            <div className="font-semibold text-gray-900 dark:text-white">{appt.patientName || 'Patient'}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {appt.reason || 'General consultation'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {formatDate(appt.appointmentDate) || appt.date} • {appt.startTime || appt.time}
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
                              size="sm"
                              className="text-sm whitespace-nowrap" 
                              disabled 
                              title="Feature coming soon"
                              label="View Details" 
                              pageName="DoctorDashboard"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {upcomingAppointments.length > 3 && (
                        <div className="text-center pt-2">
                          <Link 
                            href="/doctor/appointments" 
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
                    { name: "Set Availability", href: "/doctor/availability", bgColor: "bg-blue-600 hover:bg-blue-700" },
                    { name: "My Appointments", href: "/doctor/appointments", bgColor: "bg-green-600 hover:bg-green-700" },
                    { name: "My Profile", href: "/doctor/profile", bgColor: "bg-purple-600 hover:bg-purple-700" },
                    { name: "Patient Records", href: "/doctor/records", bgColor: "bg-pink-600 hover:bg-pink-700" },
                    { name: "Calendar", href: "/doctor/calendar", bgColor: "bg-indigo-600 hover:bg-indigo-700" },
                    { name: "Contact Support", href: "/contact", bgColor: "bg-amber-600 hover:bg-amber-700" }
                  ].map((action, i) => (
                    <Button 
                      key={i} 
                      asChild
                      className={`whitespace-nowrap text-white ${action.bgColor}`}
                      label={action.name} 
                      pageName="DoctorDashboard"
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
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-24 flex items-end p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-full h-20 w-20 border-4 border-white dark:border-gray-800 shadow-md flex items-center justify-center overflow-hidden">
                    <FaUserMd size={32} className="text-gray-400" />
                  </div>
                </div>
                
                <div className="p-4 pt-8">
                  {loadingProfile ? (
                    <div className="flex justify-center py-4"><Spinner /></div>
                  ) : !profile ? (
                    <Alert variant="error" message="Profile data not found." isVisible={true} />
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        Dr. {profile.firstName} {profile.lastName}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{profile.specialty || "General Practitioner"}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Email</span>
                          <span className="text-gray-900 dark:text-white">{profile.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Location</span>
                          <span className="text-gray-900 dark:text-white">{profile.location || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Experience</span>
                          <span className="text-gray-900 dark:text-white">{profile.yearsOfExperience || "N/A"} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Languages</span>
                          <span className="text-gray-900 dark:text-white">{profile.languages?.join(", ") || "English"}</span>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Button 
                          asChild
                          className="w-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900"
                          label="Edit Profile" 
                          pageName="DoctorDashboard"
                        >
                          <Link href="/doctor/profile">Edit Profile</Link>
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
                            <FaUserInjured className="text-gray-600 dark:text-gray-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Appointment with {appt.patientName || "Patient"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(appt.appointmentDate) || appt.date} • {appt.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
              
              {/* Upcoming Schedule Card */}
              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Schedule</h2>
                </div>
                <div className="p-4">
                  {loadingAppointments ? (
                    <div className="flex justify-center py-4"><Spinner /></div>
                  ) : (
                    <div>
                      {/* Get today's appointments */}
                      {(() => {
                        const today = new Date().toISOString().split('T')[0];
                        const todaysAppointments = upcomingAppointments.filter(
                          appt => {
                            const apptDate = appt.appointmentDate || 
                                            appt.date || 
                                            '';
                            // Fix the type issue with includes by ensuring apptDate is a string
                            return typeof apptDate === 'string' 
                              ? apptDate.includes(today)
                              : apptDate instanceof Date
                                ? apptDate.toISOString().split('T')[0] === today
                                : false;
                          }
                        );
                        
                        if (todaysAppointments.length === 0) {
                          return (
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <FaCalendarAlt className="text-indigo-600 dark:text-indigo-400" />
                                <h3 className="font-medium text-indigo-800 dark:text-indigo-300">No appointments today</h3>
                              </div>
                              <p className="text-sm text-indigo-700 dark:text-indigo-200">
                                Enjoy your time off or consider adding more availability slots.
                              </p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-2">
                            {todaysAppointments.map((appt, i) => (
                              <div key={i} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                                <div className="w-12 text-center">
                                  <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                    {appt.startTime || appt.time}
                                  </div>
                                </div>
                                <div className="ml-4 flex-1">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {appt.patientName}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {appt.reason || "General consultation"}
                                  </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${
                                  appt.status === AppointmentStatus.CONFIRMED 
                                    ? "bg-green-500" 
                                    : appt.status === AppointmentStatus.PENDING
                                    ? "bg-yellow-500"
                                    : "bg-gray-500"
                                }`} />
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
