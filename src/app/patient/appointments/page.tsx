"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { logValidation } from "@/lib/logger";

interface Appointment {
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

type TabKey = "upcoming" | "past" | "cancelled";

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchAppointments() {
      if (!db) return;
      setLoading(true);
      try {
        const apptRef = collection(db, "mockPatientAppointments");
        const snapshot = await getDocs(apptRef);
        const appts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Appointment[];
        setAppointments(appts);
      } catch {
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  useEffect(() => {
    logValidation("patient-appointments-ui", "success");
  }, []);

  const filtered = appointments.filter((a) => a.status === tab);
  const getStatusLabel = (status: string) => {
    if (status === "upcoming") return "Upcoming";
    if (status === "past") return "Past";
    return "Cancelled";
  };

  const handleCancel = (id: string) => {
    setCancellingId(id);
    setCancelReason("");
    setCancelSuccess(false);
  };

  const confirmCancel = () => {
    // Simulate cancel
    setTimeout(() => {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === cancellingId ? { ...a, status: "cancelled" } : a
        )
      );
      setCancelSuccess(true);
      setTimeout(() => {
        setCancellingId(null);
        setCancelReason("");
        setCancelSuccess(false);
      }, 1200);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 md:px-12 lg:px-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Appointments</h1>
        <div className="flex gap-4 mb-6">
          {(["upcoming", "past", "cancelled"] as TabKey[]).map((key) => (
            <button
              key={key}
              className={`px-4 py-2 rounded font-medium border-b-2 transition-all ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              onClick={() => setTab(key)}
            >
              {getStatusLabel(key)}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground">No appointments.</div>
            ) : (
              filtered.map((appt) => (
                <Card key={appt.id} className="p-4">
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold text-lg">{appt.doctorName}</div>
                    <div className="text-sm text-muted-foreground">{appt.specialty}</div>
                    <div className="text-xs text-muted-foreground">{new Date(appt.date).toLocaleDateString()} {appt.time}</div>
                    <div className="text-xs text-muted-foreground">Type: {appt.type}</div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="secondary" onClick={() => setDetailId(appt.id)} size="sm">View Details</Button>
                      {tab === "upcoming" && (
                        <Button variant="destructive" onClick={() => handleCancel(appt.id)} size="sm">Cancel</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
        {/* Detail Modal */}
        {detailId && (
          <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
            <div className="bg-background rounded shadow-lg p-6 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-xl" onClick={() => setDetailId(null)}>&times;</button>
              <h2 className="font-bold text-lg mb-2">Appointment Details</h2>
              {(() => {
                const appt = appointments.find((a) => a.id === detailId);
                if (!appt) return null;
                return (
                  <div className="flex flex-col gap-2">
                    <div><span className="font-medium">Doctor:</span> {appt.doctorName}</div>
                    <div><span className="font-medium">Specialty:</span> {appt.specialty}</div>
                    <div><span className="font-medium">Date:</span> {new Date(appt.date).toLocaleDateString()} {appt.time}</div>
                    <div><span className="font-medium">Type:</span> {appt.type}</div>
                    <div><span className="font-medium">Reason:</span> {appt.reason || "-"}</div>
                    <div><span className="font-medium">Notes:</span> {appt.notes || "-"}</div>
                    <div><span className="font-medium">Status:</span> {getStatusLabel(appt.status)}</div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        {/* Cancel Modal */}
        {cancellingId && (
          <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
            <div className="bg-background rounded shadow-lg p-6 w-full max-w-md relative">
              <button className="absolute top-2 right-2 text-xl" onClick={() => setCancellingId(null)}>&times;</button>
              <h2 className="font-bold text-lg mb-2">Cancel Appointment</h2>
              <div className="mb-2">Are you sure you want to cancel this appointment?</div>
              <input
                type="text"
                className="input input-bordered w-full mb-2"
                placeholder="Reason for cancellation (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <Button variant="secondary" onClick={() => setCancellingId(null)} size="sm">Back</Button>
                <Button variant="destructive" onClick={confirmCancel} size="sm">Confirm Cancel</Button>
              </div>
              {cancelSuccess && <div className="text-green-600 mt-2">Appointment cancelled.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
