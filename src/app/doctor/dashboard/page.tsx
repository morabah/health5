"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Link from "next/link";
import { FaUser, FaCalendarCheck, FaUserMd, FaNotesMedical } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { mockGetDoctorPublicProfile, mockGetMyAppointments } from "@/lib/mockApiService";
import { AppointmentStatus, UserType } from "@/types/enums";
import ProtectedPage from "@/components/shared/ProtectedPage";

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoadingProfile(true);
      setError(null);
      try {
        if (!user) return;
        const data = await mockGetDoctorPublicProfile({ doctorId: user.uid });
        setProfile(data);
      } catch (err) {
        setError("Failed to load profile.");
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    async function fetchAppointments() {
      setLoadingAppointments(true);
      setError(null);
      try {
        if (!user) return;
        const items = await mockGetMyAppointments(user.uid, UserType.DOCTOR);
        setAppointments(items);
      } catch (err) {
        setError("Failed to load appointments.");
        setAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    }
    fetchAppointments();
  }, [user]);

  const upcomingAppointments = appointments.filter(a => a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED);
  const pastAppointments = appointments.filter(a => a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CANCELLED);

  const stats = [
    {
      title: "Upcoming",
      icon: <FaCalendarCheck className="text-blue-500 dark:text-blue-400" />,
      value: loadingAppointments ? "-" : upcomingAppointments.length,
    },
    {
      title: "Patients",
      icon: <FaUserMd className="text-green-500 dark:text-green-400" />,
      value: appointments.length > 0 ? new Set(appointments.map(a => a.patientName)).size : "-",
    },
    {
      title: "Profile",
      icon: <FaUser className="text-purple-500 dark:text-purple-400" />,
      value: profile ? "Complete" : "-",
    },
    {
      title: "Notes",
      icon: <FaNotesMedical className="text-pink-500 dark:text-pink-400" />,
      value: "-", // Placeholder
    },
  ];

  return (
    <ProtectedPage>
      <div className="max-w-5xl mx-auto p-4">
        {/* Welcome Header */}
        <h1 className="text-3xl font-bold mb-2 dark:text-white">
          Welcome{profile?.firstName ? `, Dr. ${profile.firstName}` : "!"}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">This is your doctor dashboard.</p>

        {/* Quick Links */}
        <div className="w-full flex flex-wrap gap-4 justify-end mb-6">
          <Button label="Profile" variant="secondary" pageName="DoctorDashboard"><Link href="/doctor/profile">Profile</Link></Button>
          <Button label="Notifications" variant="secondary" pageName="DoctorDashboard"><Link href="/notifications">Notifications</Link></Button>
          <Button label="Logout" variant="secondary" pageName="DoctorDashboard"><Link href="/auth/logout">Logout</Link></Button>
        </div>
        {/* Book Availability CTA */}
        <div className="w-full flex justify-end mb-4">
          <Button label="Set Availability" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" pageName="DoctorDashboard"><Link href="/doctor/availability">Set Availability</Link></Button>
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
            <Link href="/doctor/appointments">
              <Button label="View All" variant="secondary" pageName="DoctorDashboard">View All</Button>
            </Link>
          </div>
          {loadingAppointments ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : error ? (
            <Alert variant="error" message={error || ''} isVisible={!!error} />
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">No upcoming appointments found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {upcomingAppointments.slice(0, 3).map((appt) => (
                <div key={appt.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1 text-blue-900 dark:text-white">
                      {appt.patientName || 'Patient'}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 mb-1">{appt.date} {appt.time}</div>
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
                    <Button label="View Details" disabled title="Feature coming soon" pageName="DoctorDashboard">View Details</Button>
                    <Button label="Mark as Completed" disabled variant="secondary" title="Feature coming soon" pageName="DoctorDashboard">Mark as Completed</Button>
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
              {pastAppointments.slice(0, 3).map((appt) => (
                <div key={appt.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1 text-blue-900 dark:text-white">
                      {appt.patientName || 'Patient'}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 mb-1">{appt.date} {appt.time}</div>
                    <div className="mb-1">
                      <span className={
                        appt.status === AppointmentStatus.COMPLETED ? "inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                        appt.status === AppointmentStatus.CANCELLED ? "inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                        "inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }>
                        {appt.status === AppointmentStatus.COMPLETED ? "Completed" : appt.status === AppointmentStatus.CANCELLED ? "Cancelled" : "Unknown"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 md:mt-0">
                    <Button label="View Details" disabled title="Feature coming soon" pageName="DoctorDashboard">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
