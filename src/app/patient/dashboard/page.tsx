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

const MOCK_PATIENT_ID = "mockPatient123";

export default function PatientDashboardPage() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{
    userProfile: UserProfile | null;
    patientProfile: PatientProfile | null;
  }>({ userProfile: null, patientProfile: null });
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoadingProfile(true);
      setLoadingAppointments(true);
      setError(null);
      logInfo("[3.10] PatientDashboard: Fetching profile and appointments", { testId: "3.10" });
      const perfStart = performance.now();

      try {
        const profile = await loadPatientProfile(MOCK_PATIENT_ID);
        const appointments = await loadPatientAppointments(MOCK_PATIENT_ID);
        if (!profile.userProfile || !profile.patientProfile) {
          throw new Error("Profile not found for mockPatient123");
        }
        setProfileData(profile);
        const upcoming = appointments.filter((appt) => appt.status === AppointmentStatus.PENDING || appt.status === AppointmentStatus.CONFIRMED);
        const past = appointments.filter((appt) => appt.status === AppointmentStatus.COMPLETED || appt.status === AppointmentStatus.CANCELLED);
        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
      } catch (err) {
        logError("[3.10] Failed to fetch patient profile", { error: err });
        setError("Failed to load dashboard data.");
      } finally {
        setLoadingProfile(false);
        setLoadingAppointments(false);
        const perfEnd = performance.now();
        logInfo("[3.10] PatientDashboard: Data fetch complete", { durationMs: perfEnd - perfStart });
        logValidation("3.10", "success");
      }
    }
    fetchDashboardData();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoadingAppointments(true);
      setError(null);
      try {
        const userId = profileData.userProfile?.id;
        console.log('[DEBUG] userId:', userId);
        const appts = await loadPatientAppointments(userId!);
        console.log('[DEBUG] fetched upcoming appointments:', appts);
        setUpcomingAppointments(appts.filter(a => a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED));
        setPastAppointments(appts.filter(a => a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CANCELLED));
      } catch (err) {
        setError('Failed to load appointments.');
        setUpcomingAppointments([]);
        setPastAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    }
    if (profileData.userProfile) {
      fetchData();
    }
  }, [profileData.userProfile]);

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

      {/* Quick Links */}
      <div className="w-full flex flex-wrap gap-4 justify-end mb-6">
        <Button asChild variant="secondary"><Link href="/patient/profile">Profile</Link></Button>
        <Button asChild variant="secondary"><Link href="/notifications">Notifications</Link></Button>
        <Button asChild variant="secondary"><Link href="/auth/logout">Logout</Link></Button>
      </div>
      {/* Book Appointment CTA */}
      <div className="w-full flex justify-end mb-4">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"><Link href="/find">Book Appointment</Link></Button>
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
            <Button size="sm" variant="secondary">View All</Button>
          </Link>
        </div>
        {loadingAppointments ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : error ? (
          <Alert type="error">{error}</Alert>
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
                  <div className="text-gray-700 dark:text-gray-300 mb-1">{appt.appointmentDate ? appt.appointmentDate.toDate().toLocaleString() : ''}</div>
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
                  <Button asChild size="sm" aria-label={`View appointment details`}><Link href={`/patient/appointments/${appt.id}`}>View</Link></Button>
                  {appt.status === AppointmentStatus.PENDING && <Button size="sm" variant="secondary" disabled>Cancel</Button>}
                  {appt.status === AppointmentStatus.PENDING && <Button size="sm" variant="secondary" disabled>Reschedule</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold dark:text-white mb-2">Past Appointments</h2>
        {!loadingAppointments && !error && upcomingAppointments.length === 0 && (
          <div className="text-gray-500 dark:text-gray-400">No past appointments found.</div>
        )}
        {!loadingAppointments && upcomingAppointments.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {pastAppointments.map((appt) => (
              <div key={appt.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <div className="font-bold text-lg mb-1 text-blue-900 dark:text-white">
                    <Link href={appt.doctorId ? `/main/doctor-profile/${appt.doctorId}` : '#'} className="hover:underline" aria-label={`View profile for ${appt.doctorName || 'Doctor'}`}>{appt.doctorName || 'Doctor'}</Link>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 mb-1">{appt.appointmentDate ? appt.appointmentDate.toDate().toLocaleString() : ''}</div>
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
                  <Button asChild size="sm" aria-label={`View appointment details`}><Link href={`/patient/appointments/${appt.id}`}>View</Link></Button>
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
            <Button size="sm" variant="secondary">Edit Profile</Button>
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
                <div className="font-semibold dark:text-white">{profileData.patientProfile.dateOfBirth && profileData.patientProfile.dateOfBirth.toDate().toLocaleDateString()}</div>
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
            <Alert type="error">Profile data not found.</Alert>
          )}
        </Card>
      </div>
    </div>
  );
}
