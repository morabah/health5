"use client";
import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import { UserProfile } from "@/types/user";
import { PatientProfile } from "@/types/patient";
import { Appointment } from "@/types/appointment";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
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

  useEffect(() => {
    let isMounted = true;
    setLoadingProfile(true);
    setLoadingAppointments(true);
    setError(null);
    logInfo("[3.10] PatientDashboard: Fetching profile and appointments", { testId: "3.10" });
    const perfStart = performance.now();

    // Fetch User + Patient profile
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", MOCK_PATIENT_ID));
        const patientDoc = await getDoc(doc(db, "patients", MOCK_PATIENT_ID));
        if (!userDoc.exists() || !patientDoc.exists()) {
          throw new Error("Profile not found for mockPatient123");
        }
        if (isMounted) {
          setProfileData({
            userProfile: userDoc.data() as UserProfile,
            patientProfile: patientDoc.data() as PatientProfile,
          });
          logInfo("[3.10] PatientDashboard: Profile loaded", { user: userDoc.data() });
        }
      } catch (err) {
        logError("[3.10] Failed to fetch patient profile", { error: err });
        if (isMounted) setError("Failed to load profile.");
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    // Fetch Upcoming Appointments
    const fetchAppointments = async () => {
      try {
        const now = Timestamp.now();
        const q = query(
          collection(db, "appointments"),
          where("patientId", "==", MOCK_PATIENT_ID),
          where("appointmentDate", ">=", now),
          orderBy("appointmentDate", "asc"),
          limit(3)
        );
        const snap = await getDocs(q);
        const appts: Appointment[] = [];
        snap.forEach((doc) => appts.push({ id: doc.id, ...doc.data() } as Appointment));
        if (isMounted) {
          setUpcomingAppointments(appts);
          logInfo("[3.10] PatientDashboard: Appointments loaded", { count: appts.length });
        }
      } catch (err) {
        logError("[3.10] Failed to fetch appointments", { error: err });
        if (isMounted) setError("Failed to load appointments.");
      } finally {
        if (isMounted) setLoadingAppointments(false);
      }
    };

    Promise.all([fetchProfile(), fetchAppointments()]).finally(() => {
      const perfEnd = performance.now();
      logInfo("[3.10] PatientDashboard: Data fetch complete", { durationMs: perfEnd - perfStart });
      logValidation("3.10", "success");
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
    <Layout>
      <div className="max-w-5xl mx-auto p-4">
        {/* Welcome Header */}
        <h1 className="text-3xl font-bold mb-2 dark:text-white">
          Welcome{profileData.userProfile?.firstName ? `, ${profileData.userProfile.firstName}` : "!"}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">This is your patient dashboard.</p>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingAppointments.map((appt) => (
                <Card key={appt.id} className="dark:bg-gray-800">
                  <div className="font-semibold dark:text-white">{appt.doctorName || "Dr. Name"}</div>
                  <div className="text-gray-500 dark:text-gray-300 text-sm">
                    {appt.appointmentDate &&
                      appt.appointmentDate.toDate().toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    {" "}
                    {appt.startTime} - {appt.endTime}
                  </div>
                  <div className="mt-2 text-xs font-medium px-2 py-1 rounded bg-blue-100 dark:bg-blue-700 dark:text-white inline-block">
                    {appt.status}
                  </div>
                </Card>
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
    </Layout>
  );
}
