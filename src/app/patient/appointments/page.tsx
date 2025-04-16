"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mockGetMyAppointments, mockCancelAppointment } from "@/lib/mockApiService";
import { useAuth } from "@/context/AuthContext";
import { UserType, AppointmentStatus } from "@/types/enums";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { logValidation } from "@/lib/logger";
import EmptyState from "@/components/ui/EmptyState";

type TabKey = "upcoming" | "past" | "cancelled";

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  async function fetchAppointments() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      console.log('[DEBUG] user.uid:', user.uid, 'userType:', user.userType);
      const items = await mockGetMyAppointments(user.uid, UserType.PATIENT);
      console.log('[DEBUG] fetched appointments:', items);
      setAppointments(items);
    } catch (err: any) {
      setError("Failed to load appointments.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    logValidation("patient-appointments-ui", "success");
  }, []);

  const filteredAppointments = appointments.filter(appt => {
    if (tab === "upcoming") {
      return appt.status === AppointmentStatus.PENDING || appt.status === AppointmentStatus.CONFIRMED;
    }
    if (tab === "past") {
      return appt.status === AppointmentStatus.COMPLETED || appt.status === AppointmentStatus.CANCELLED;
    }
    if (tab === "cancelled") {
      return appt.status === AppointmentStatus.CANCELLED;
    }
    return true;
  });

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return "Pending";
      case AppointmentStatus.CONFIRMED:
        return "Confirmed";
      case AppointmentStatus.COMPLETED:
        return "Completed";
      case AppointmentStatus.CANCELLED:
        return "Cancelled";
      default:
        return status;
    }
  };

  const handleCancel = (id: string) => {
    setCancellingId(id);
    setCancelReason("");
    setCancelSuccess(false);
  };

  const confirmCancel = async () => {
    if (!cancellingId || !user) return;
    setLoading(true);
    setError(null);
    try {
      await mockCancelAppointment({ appointmentId: cancellingId, reason: cancelReason, userId: user.uid });
      setCancelSuccess(true);
      setCancellingId(null);
      setCancelReason("");
      await fetchAppointments();
    } catch (err: any) {
      setError("Failed to cancel appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 md:px-12 lg:px-32">
      <div className="max-w-4xl mx-auto">
        <div className="w-full flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Appointments</h1>
          <Button asChild>
            <a href="/patient/dashboard">Back to Dashboard</a>
          </Button>
        </div>
        <div className="flex gap-4 mb-6">
          {(["upcoming", "past", "cancelled"] as TabKey[]).map((key) => (
            <button
              key={key}
              className={`px-4 py-2 rounded font-medium border-b-2 transition-all ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              onClick={() => setTab(key)}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!loading && !error && filteredAppointments.length === 0 && (
              <EmptyState
                title="No appointments found."
                message="You have no appointments in this category. Book an appointment to get started."
                className="my-8"
                action={<Button onClick={() => router.push('/find')}>Book Appointment</Button>}
              />
            )}
            {filteredAppointments.length > 0 && filteredAppointments.map((appt) => (
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
            ))}
          </div>
        )}
        {error && (
          <div className="text-red-600 mt-2">{error}</div>
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
