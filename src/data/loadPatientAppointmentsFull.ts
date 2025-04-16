// This file is deprecated. Use patientLoaders.ts for all patient appointment data loading.
throw new Error("loadPatientAppointmentsFull.ts is deprecated. Use patientLoaders.ts instead.");

import { db } from "@/lib/firebaseClient";

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string; // ISO
  time: string;
  status: "upcoming" | "past" | "cancelled";
  type: "In-person" | "Video";
  reason?: string;
  notes?: string;
}

// Fallback mock data for dev
const MOCK_PATIENT_ID = "mockPatient123";
const mockAppointments: Appointment[] = [
  {
    id: "1",
    doctorName: "Dr. Smith",
    specialty: "Cardiology",
    date: "2025-04-20",
    time: "10:00",
    status: "upcoming",
    type: "In-person",
    reason: "Checkup",
    notes: "Bring previous reports."
  },
  {
    id: "2",
    doctorName: "Dr. Lee",
    specialty: "Dermatology",
    date: "2025-03-10",
    time: "14:30",
    status: "past",
    type: "Video",
    reason: "Rash follow-up",
    notes: "Resolved."
  },
  {
    id: "3",
    doctorName: "Dr. Patel",
    specialty: "Pediatrics",
    date: "2025-04-15",
    time: "09:00",
    status: "cancelled",
    type: "In-person",
    reason: "Fever",
    notes: "Cancelled by patient."
  }
];

export async function loadPatientAppointmentsFull(patientId: string = MOCK_PATIENT_ID): Promise<Appointment[]> {
  try {
    if (!db) return mockAppointments;
    const apptRef = collection(db, "appointments");
    const q = query(apptRef, where("patientId", "==", patientId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return mockAppointments;
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Appointment[];
  } catch {
    return mockAppointments;
  }
}
