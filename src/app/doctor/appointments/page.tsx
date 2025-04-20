"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/dateUtils";
import { UserType, AppointmentStatus } from "@/types/enums";
import { Timestamp } from "firebase/firestore";
import { FaCalendarCheck, FaCalendarTimes, FaHistory, FaFilter, FaSearch, FaUserInjured, FaNotesMedical, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import Link from "next/link";
import { toast } from "react-hot-toast";
import Textarea from "@/components/ui/Textarea";
import { getFunctions, httpsCallable } from "firebase/functions";
import { initializeFirebaseClient } from "@/lib/firebaseClient";
import { AppointmentSchema } from "@/lib/zodSchemas";

interface Appointment {
  id: string;
  patientName: string;
  patientId?: string;
  date?: string | Date | Timestamp;
  appointmentDate?: string | Date | Timestamp;
  time?: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  status: string;
  notes?: string;
  reason?: string;
  location?: string;
}

type FilterType = "all" | "today" | "upcoming" | "past" | "cancelled";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [completeApptId, setCompleteApptId] = useState<string | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [cancelApptId, setCancelApptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  async function fetchAppointments() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Always use live mode
      initializeFirebaseClient('live');
      const functions = getFunctions();
      const getMyAppointments = httpsCallable(functions, "getMyAppointments");
      const res = await getMyAppointments({ userId: user.uid, userType: UserType.DOCTOR });
      if (!res.data || !Array.isArray(res.data)) throw new Error("Malformed response from backend");
      // Zod validation for each appointment
      const items = res.data.map((item: any) => AppointmentSchema.parse(item));
      setAppointments(items);
    } catch (err: any) {
      console.error('[DoctorAppointments] Error:', err);
      setError("Failed to load appointments.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  // Filter appointments based on selected filter
  const getFilteredAppointments = (): Appointment[] => {
    let filtered = [...appointments];
    
    // First apply status/time filters
    if (activeFilter === "today") {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(appointment => {
        const appointmentDate = appointment.appointmentDate || appointment.date;
        if (typeof appointmentDate === 'string') {
          return appointmentDate.includes(today);
        } else if (appointmentDate instanceof Date) {
          return appointmentDate.toISOString().split('T')[0] === today;
        } else if (appointmentDate && typeof appointmentDate === 'object' && 'toDate' in appointmentDate) {
          return appointmentDate.toDate().toISOString().split('T')[0] === today;
        }
        return false;
      });
    } else if (activeFilter === "upcoming") {
      filtered = filtered.filter(appointment => 
        appointment.status === AppointmentStatus.PENDING || 
        appointment.status === AppointmentStatus.CONFIRMED
      );
    } else if (activeFilter === "past") {
      filtered = filtered.filter(appointment => 
        appointment.status === AppointmentStatus.COMPLETED
      );
    } else if (activeFilter === "cancelled") {
      filtered = filtered.filter(appointment => 
        appointment.status === AppointmentStatus.CANCELLED
      );
    }
    
    // Then apply search if there is a search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(appointment => 
        appointment.patientName.toLowerCase().includes(query) ||
        (appointment.reason && appointment.reason.toLowerCase().includes(query)) ||
        (appointment.notes && appointment.notes.toLowerCase().includes(query))
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

  const handleOpenComplete = (id: string) => {
    setCompleteApptId(id);
    setCompleteNotes("");
    setShowCompleteModal(true);
  };

  const handleOpenCancel = (id: string) => {
    setCancelApptId(id);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleComplete = async (id: string, notes: string) => {
    setShowCompleteModal(false);
    setActionLoadingId(id);
    try {
      const res = await mockCompleteAppointment({ appointmentId: id, notes, doctorId: user?.uid || "" });
      if (res.success) {
        toast.success("Appointment marked completed");
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: AppointmentStatus.COMPLETED, notes } : a));
        setDetailsOpen(null);
      } else throw new Error();
    } catch {
      toast.error("Failed to complete appointment");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    setShowCancelModal(false);
    setActionLoadingId(id);
    try {
      const ok = await mockCancelAppointmentDetails(id, "doctor", reason);
      if (ok) {
        toast.success("Appointment cancelled");
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: AppointmentStatus.CANCELLED_BY_DOCTOR, notes: (a.notes ? a.notes + "\n" : "") + "Cancellation reason: " + reason } : a));
        setDetailsOpen(null);
      } else throw new Error();
    } catch {
      toast.error("Failed to cancel appointment");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              My Appointments
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your patient appointments
            </p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button 
              asChild
              variant="secondary" 
              className="flex items-center gap-2"
              label="Set Availability" 
              pageName="DoctorAppointments"
            >
              <Link href="/doctor/availability" className="flex items-center gap-2">
                <FaClock size={16} />
                <span>Set Availability</span>
              </Link>
            </Button>
            <Button 
              asChild
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              label="Dashboard" 
              pageName="DoctorAppointments"
            >
              <Link href="/doctor/dashboard" className="flex items-center gap-2">
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
                pageName="DoctorAppointments"
              >
                <FaFilter size={12} />
                <span>All</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => setActiveFilter("today")}
                className={`flex items-center gap-1 ${activeFilter === "today" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                label="Today" 
                pageName="DoctorAppointments"
              >
                <FaClock size={12} />
                <span>Today</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => setActiveFilter("upcoming")}
                className={`flex items-center gap-1 ${activeFilter === "upcoming" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                label="Upcoming" 
                pageName="DoctorAppointments"
              >
                <FaCalendarCheck size={12} />
                <span>Upcoming</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => setActiveFilter("past")}
                className={`flex items-center gap-1 ${activeFilter === "past" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                label="Past" 
                pageName="DoctorAppointments"
              >
                <FaHistory size={12} />
                <span>Past</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => setActiveFilter("cancelled")}
                className={`flex items-center gap-1 ${activeFilter === "cancelled" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}
                label="Cancelled" 
                pageName="DoctorAppointments"
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
                placeholder="Search patients..."
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
            title={searchQuery ? "No matching appointments found" : "No appointments scheduled"}
            message={
              searchQuery 
                ? "Try adjusting your search or filters to find what you're looking for."
                : "You have no appointments scheduled. When patients book appointments, they will appear here."
            }
          className="my-8"
            action={
              <Button 
                asChild
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                label="Set Availability" 
                pageName="DoctorAppointments"
              >
                <Link href="/doctor/availability">Set Availability</Link>
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
                      <FaUserInjured className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{appt.patientName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Patient ID: {appt.patientId || 'N/A'}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(appt.status)}`}>
                    {appt.status === AppointmentStatus.CONFIRMED ? "Confirmed" : 
                     appt.status === AppointmentStatus.PENDING ? "Pending" : 
                     appt.status === AppointmentStatus.COMPLETED ? "Completed" :
                     appt.status === AppointmentStatus.CANCELLED ? "Cancelled" : "Unknown"}
                  </span>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-start gap-2">
                      <FaClock className="text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Date & Time</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(appt.appointmentDate || appt.date)} 
                          <span className="ml-1">{appt.startTime || appt.time}</span>
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
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{appt.type || 'In-person'}</div>
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
                      onClick={() => setDetailsOpen(appt.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      size="sm" 
                      label="View Details" 
                      pageName="DoctorAppointments"
                    >
                      View Details
                    </Button>
                    
                    {(appt.status === AppointmentStatus.CONFIRMED || appt.status === AppointmentStatus.PENDING) && (
                      <>
                        <Button
                          onClick={() => handleOpenComplete(appt.id)}
                          disabled={actionLoadingId === appt.id}
                          variant="secondary"
                          size="sm"
                          label="Mark as Completed"
                          pageName="DoctorAppointments"
                        >
                          {actionLoadingId === appt.id ? <Spinner size="sm" /> : "Mark as Completed"}
                        </Button>
                        <Button
                          onClick={() => handleOpenCancel(appt.id)}
                          disabled={actionLoadingId === appt.id}
                          variant="danger"
                          size="sm"
                          label="Cancel"
                          pageName="DoctorAppointments"
                        >
                          {actionLoadingId === appt.id ? <Spinner size="sm" /> : "Cancel"}
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
        {detailsOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" 
                onClick={() => setDetailsOpen(null)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Appointment Details</h2>
              
              {(() => {
                const appt = appointments.find(a => a.id === detailsOpen);
                if (!appt) return null;
                
                return (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <FaUserInjured className="text-indigo-600 dark:text-indigo-400 text-xl" />
                      </div>
                      <div>
                        <div className="font-semibold text-lg text-gray-900 dark:text-white">{appt.patientName}</div>
                        <div className="text-gray-500 dark:text-gray-400">Patient ID: {appt.patientId || 'N/A'}</div>
                      </div>
                      <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(appt.status)}`}>
                        {appt.status === AppointmentStatus.CONFIRMED ? "Confirmed" : 
                        appt.status === AppointmentStatus.PENDING ? "Pending" : 
                        appt.status === AppointmentStatus.COMPLETED ? "Completed" :
                        appt.status === AppointmentStatus.CANCELLED ? "Cancelled" : "Unknown"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Date</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatDate(appt.appointmentDate || appt.date)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Time</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {appt.startTime || appt.time}
                          {appt.endTime && ` - ${appt.endTime}`}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Type</div>
                        <div className="font-medium text-gray-900 dark:text-white">{appt.type || 'In-person'}</div>
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
                        onClick={() => setDetailsOpen(null)}
                        variant="secondary" 
                        className="flex-1" 
                        label="Close" 
                        pageName="DoctorAppointments"
                      >
                        Close
                      </Button>
                      {(appt.status === AppointmentStatus.CONFIRMED || appt.status === AppointmentStatus.PENDING) && (
                        <Button 
                          onClick={() => handleOpenComplete(appt.id)}
                          disabled={actionLoadingId === appt.id}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" 
                          label="Start Appointment" 
                          pageName="DoctorAppointments"
                        >
                          {actionLoadingId === appt.id ? <Spinner size="sm" /> : "Start Appointment"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        
        {/* Completion Modal */}
        {showCompleteModal && completeApptId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={() => setShowCompleteModal(false)}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Complete Appointment</h2>
              <Textarea
                id="complete-notes"
                label="Completion Notes (optional)"
                rows={4}
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
              />
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCompleteModal(false)} label="Cancel" pageName="DoctorAppointments">
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={actionLoadingId === completeApptId}
                  onClick={() => handleComplete(completeApptId as string, completeNotes)}
                  label="Confirm"
                  pageName="DoctorAppointments"
                >
                  {actionLoadingId === completeApptId ? <Spinner size="sm" /> : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Cancellation Modal */}
        {showCancelModal && cancelApptId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg relative">
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={() => setShowCancelModal(false)}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cancel Appointment</h2>
              <Textarea
                id="cancel-reason"
                label="Cancellation Reason (optional)"
                rows={4}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" className="flex-1" onClick={() => setShowCancelModal(false)} label="Close" pageName="DoctorAppointments">
                  Close
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={actionLoadingId === cancelApptId}
                  onClick={() => handleCancel(cancelApptId as string, cancelReason)}
                  label="Confirm"
                  pageName="DoctorAppointments"
                >
                  {actionLoadingId === cancelApptId ? <Spinner size="sm" /> : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
