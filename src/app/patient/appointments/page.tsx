"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserType, AppointmentStatus } from "@/types/enums";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { logValidation } from "@/lib/logger";
import EmptyState from "@/components/ui/EmptyState";
import { FaCalendarCheck, FaCalendarTimes, FaHistory, FaFilter, FaSearch, 
  FaUserMd, FaNotesMedical, FaClock, FaMapMarkerAlt, FaExclamationTriangle } from "react-icons/fa";
import Link from "next/link";
import { formatDate } from "@/utils/dateUtils";
import { useSearchParams } from "next/navigation";
import { getFunctions, httpsCallable } from "firebase/functions";
import { initializeFirebaseClient } from '@/lib/improvedFirebaseClient';
import { AppointmentSchema } from '@/lib/zodSchemas';

type FilterType = "all" | "upcoming" | "past" | "cancelled";

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterType>("all");
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showJustBookedParam = searchParams?.get("justBooked") === "true";
  const [showJustBookedBanner, setShowJustBookedBanner] = useState(showJustBookedParam);

  // Fetch appointments via backend function
  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const perf = performance.now();
    try {
      // Always use live mode
      initializeFirebaseClient('live');
      const functions = getFunctions();
      const getMyAppointments = httpsCallable(functions, "getMyAppointments");
      const res = await getMyAppointments({ statusFilter: activeTab });
      if (!res.data || !Array.isArray(res.data)) throw new Error("Malformed response from backend");
      // Fix type: ensure each appointment has a string id
      const items = res.data.map((item: any, idx: number) => ({
        ...AppointmentSchema.parse(item),
        id: item.id ?? item.appointmentId ?? `appt-${idx}`
      }));
      setAppointments(items);
      // Log validation event for 7.2b success
      logValidation('7.2b', 'success', 'Appointments pages connected to live getMyAppointments function.');
    } catch (err: any) {
      console.error('[PatientAppointments] Error:', err);
      setError("Failed to load appointments.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    logValidation("patient-appointments-ui", "success");
  }, []);

  // Tab controls
  const tabOptions: FilterType[] = ["all", "upcoming", "past", "cancelled"];

  // Get status badge style based on appointment status
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case AppointmentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case AppointmentStatus.COMPLETED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case AppointmentStatus.CANCELLED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

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
      initializeFirebaseClient('live');
      const functions = getFunctions();
      const cancelAppointment = httpsCallable(functions, 'cancelAppointment');
      await cancelAppointment({ appointmentId: cancellingId, reason: cancelReason, userId: user.uid });
      setCancelSuccess(true);
      fetchAppointments().then(() => {
        setTimeout(() => setCancellingId(null), 1500);
      });
    } catch (err: any) {
      setError('Failed to cancel appointment.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {showJustBookedBanner && (
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex justify-between items-center">
              <span>Your appointment was just booked!</span>
              <button onClick={() => setShowJustBookedBanner(false)} className="text-green-800 hover:text-green-600">&times;</button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              My Appointments
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your healthcare appointments
            </p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button 
              asChild
              variant="secondary" 
              className="flex items-center gap-2"
              label="Find Doctors" 
              pageName="PatientAppointments"
            >
              <Link href="/find" className="flex items-center gap-2">
                <FaUserMd size={16} />
                <span>Find Doctors</span>
              </Link>
            </Button>
            <Button 
              asChild
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              label="Dashboard" 
              pageName="PatientAppointments"
            >
              <Link href="/patient/dashboard" className="flex items-center gap-2">
                <span>Dashboard</span>
              </Link>
          </Button>
          </div>
        </div>
        
        {/* Tab controls */}
        <div className="flex space-x-2 mb-4">
          {tabOptions.map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? "primary" : "secondary"}
              onClick={() => setActiveTab(tab)}
              label={tab.charAt(0).toUpperCase() + tab.slice(1)}
              pageName="PatientAppointments"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
        
        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Card className="p-6 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="text-red-600 dark:text-red-400">{error}</div>
          </Card>
        ) : appointments.length === 0 ? (
          <EmptyState
            title="No appointments"
            message="You have no appointments scheduled. Book an appointment with a doctor to get started."
            className="my-8"
            action={
              <Button 
                asChild
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                label="Book Appointment" 
                pageName="PatientAppointments"
              >
                <Link href="/find">Book Appointment</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {appointments.map((appt) => (
              <Card key={appt.id} className="overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <FaUserMd className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Dr. {appt.doctorName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{appt.specialty || 'General Practitioner'}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(appt.status)}`}>
                    {getStatusLabel(appt.status)}
                  </span>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-start gap-2">
                      <FaClock className="text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Date & Time</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(appt.appointmentDate)} 
                          <span className="ml-1">{appt.startTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaNotesMedical className="text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Reason</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{appt.reason || 'Not specified'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{appt.location || 'Main Office'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaClock className="text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Type</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{appt.appointmentType || 'In-person'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes section - collapsed by default */}
                  {appt.notes && (
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-indigo-600 dark:text-indigo-400 font-medium">
                          View Notes
                        </summary>
                        <p className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                          {appt.notes}
                        </p>
                      </details>
                    </div>
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button 
                      onClick={() => setDetailId(appt.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      size="sm" 
                      label="View Details" 
                      pageName="PatientAppointments"
                    >
                      View Details
                    </Button>
                    
                    {(appt.status === AppointmentStatus.PENDING || appt.status === AppointmentStatus.CONFIRMED) && (
                      <>
                        <Button 
                          variant="danger" 
                          onClick={() => handleCancel(appt.id)} 
                          size="sm"
                          label="Cancel"
                          pageName="PatientAppointments"
                        >
                          Cancel
                        </Button>
                        <Button 
                          asChild
                          variant="secondary" 
                          size="sm"
                          label="Reschedule"
                          pageName="PatientAppointments"
                        >
                          <Link href={`/patient/reschedule/${appt.id}`}>Reschedule</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Appointment Details Modal */}
        {detailId && (
          <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" 
                onClick={() => setDetailId(null)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Appointment Details</h2>
              
              {(() => {
                const appt = appointments.find(a => a.id === detailId);
                if (!appt) return null;
                
                return (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <FaUserMd className="text-indigo-600 dark:text-indigo-400 text-xl" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg text-gray-900 dark:text-white">Dr. {appt.doctorName}</div>
                        <div className="text-gray-500 dark:text-gray-400">{appt.specialty || 'General Practitioner'}</div>
                      </div>
                      <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(appt.status)}`}>
                        {getStatusLabel(appt.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Date</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatDate(appt.appointmentDate)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Time</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {appt.startTime}
                          {appt.endTime && ` - ${appt.endTime}`}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Type</div>
                        <div className="font-medium text-gray-900 dark:text-white">{appt.appointmentType || 'In-person'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Location</div>
                        <div className="font-medium text-gray-900 dark:text-white">{appt.location || 'Main Office'}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Reason for Visit</div>
                      <div className="font-medium text-gray-900 dark:text-white">{appt.reason || 'Not specified'}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Notes</div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                        {appt.notes || 'No notes available for this appointment'}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button 
                        onClick={() => setDetailId(null)}
                        variant="secondary" 
                        className="flex-1" 
                        label="Close" 
                        pageName="PatientAppointments"
                      >
                        Close
                      </Button>
                      {(appt.status === AppointmentStatus.PENDING || appt.status === AppointmentStatus.CONFIRMED) && (
                        <Button 
                          variant="danger" 
                          onClick={() => {
                            setDetailId(null);
                            handleCancel(appt.id);
                          }} 
                          className="flex-1" 
                          label="Cancel Appointment" 
                          pageName="PatientAppointments"
                        >
                          Cancel Appointment
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        
        {/* Cancel Appointment Modal */}
        {cancellingId && (
          <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" 
                onClick={() => setCancellingId(null)}
                disabled={loading}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-center gap-2 mb-4">
                <FaExclamationTriangle className="text-amber-500" size={20} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cancel Appointment</h2>
              </div>
              
              {cancelSuccess ? (
                <div className="text-center py-4">
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-3 rounded-lg mb-4">
                    Your appointment has been cancelled successfully.
                  </div>
                  <Button 
                    onClick={() => setCancellingId(null)} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    label="Back to Appointments"
                    pageName="PatientAppointments"
                  >
                    Back to Appointments
                  </Button>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-gray-700 dark:text-gray-300">
                    Are you sure you want to cancel this appointment? This action cannot be undone.
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reason for cancellation (optional)
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Please provide a reason for cancelling..."
                      rows={3}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="secondary" 
                      onClick={() => setCancellingId(null)} 
                      className="flex-1"
                      disabled={loading}
                      label="Back"
                      pageName="PatientAppointments"
                    >
                      Back
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={confirmCancel} 
                      className="flex-1"
                      disabled={loading}
                      label="Confirm Cancel"
                      pageName="PatientAppointments"
                    >
                      {loading ? <Spinner size="sm" /> : 'Confirm Cancel'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
