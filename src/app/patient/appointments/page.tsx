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
import { FaCalendarCheck, FaCalendarTimes, FaHistory, FaFilter, FaSearch, 
  FaUserMd, FaNotesMedical, FaClock, FaMapMarkerAlt, FaExclamationTriangle } from "react-icons/fa";
import Link from "next/link";
import { formatDate } from "@/utils/dateUtils";
import { useSearchParams } from "next/navigation";

type FilterType = "all" | "upcoming" | "past" | "cancelled";

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showJustBookedParam = searchParams.get("justBooked") === "true";
  const [showJustBookedBanner, setShowJustBookedBanner] = useState(showJustBookedParam);

  async function fetchAppointments() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      console.log('[PatientAppointments] Fetching with user ID:', user.uid);
      const items = await mockGetMyAppointments(user.uid, UserType.PATIENT);
      console.log('[PatientAppointments] Loaded appointments:', items.length);
      setAppointments(items);
    } catch (err: any) {
      console.error('[PatientAppointments] Error:', err);
      setError("Failed to load appointments.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
    fetchAppointments();
    } else {
      setError("Please log in to view your appointments");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    logValidation("patient-appointments-ui", "success");
  }, []);

  // Filter appointments based on selected filter and search query
  const getFilteredAppointments = () => {
    let filtered = [...appointments];
    
    // Apply status/time filters
    if (activeFilter === "upcoming") {
      filtered = filtered.filter(appt => 
        appt.status === AppointmentStatus.PENDING || 
        appt.status === AppointmentStatus.CONFIRMED
      );
    } else if (activeFilter === "past") {
      filtered = filtered.filter(appt => 
        appt.status === AppointmentStatus.COMPLETED
      );
    } else if (activeFilter === "cancelled") {
      filtered = filtered.filter(appt => 
        appt.status === AppointmentStatus.CANCELLED
      );
    }
    
    // Apply search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(appt => 
        (appt.doctorName && appt.doctorName.toLowerCase().includes(query)) ||
        (appt.specialty && appt.specialty.toLowerCase().includes(query)) ||
        (appt.reason && appt.reason.toLowerCase().includes(query)) ||
        (appt.notes && appt.notes.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  const filteredAppointments = getFilteredAppointments();

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
      await mockCancelAppointment({ appointmentId: cancellingId, reason: cancelReason, userId: user.uid });
      setCancelSuccess(true);
      fetchAppointments().then(() => {
        // Wait a moment before closing the modal
        setTimeout(() => setCancellingId(null), 1500);
      });
    } catch (err: any) {
      setError("Failed to cancel appointment.");
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
        
        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm"
                onClick={() => setActiveFilter("all")}
                className={`flex items-center gap-1 ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                label="All" 
                pageName="PatientAppointments"
              >
                <FaFilter size={12} />
                <span>All</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => setActiveFilter("upcoming")}
                className={`flex items-center gap-1 ${activeFilter === "upcoming" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                label="Upcoming" 
                pageName="PatientAppointments"
              >
                <FaCalendarCheck size={12} />
                <span>Upcoming</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => setActiveFilter("past")}
                className={`flex items-center gap-1 ${activeFilter === "past" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                label="Past" 
                pageName="PatientAppointments"
              >
                <FaHistory size={12} />
                <span>Past</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => setActiveFilter("cancelled")}
                className={`flex items-center gap-1 ${activeFilter === "cancelled" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                label="Cancelled" 
                pageName="PatientAppointments"
              >
                <FaCalendarTimes size={12} />
                <span>Cancelled</span>
              </Button>
            </div>
            
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Search doctors, specialties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
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
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No matching appointments found" : "No appointments found"}
            message={
              searchQuery 
                ? "Try adjusting your search or filters to find what you're looking for."
                : "You have no appointments scheduled. Book an appointment with a doctor to get started."
            }
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
            {filteredAppointments.map((appt) => (
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
