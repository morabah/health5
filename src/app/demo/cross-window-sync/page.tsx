'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { AppointmentStatus, UserType } from '@/types/enums';
import { mockBookAppointment, mockCancelAppointment, mockGetMyAppointments, mockGetNotifications, mockMarkNotificationRead } from '@/lib/mockApiService';
import { Timestamp } from 'firebase/firestore';
import { formatDate } from '@/utils/dateUtils';
import Link from 'next/link';

export default function CrossWindowSyncDemo() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [addingAppointment, setAddingAppointment] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
        // Get appointments
        const userProfile = (user as any).userProfile || user;
        const userType = userProfile.userType || UserType.PATIENT;
        const appts = await mockGetMyAppointments(user.uid, userType === 'DOCTOR' ? UserType.DOCTOR : UserType.PATIENT);
        setAppointments(appts);
        
        // Get notifications
        const notifs = await mockGetNotifications(user.uid);
        setNotifications(notifs);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, refreshKey]);

  // Refresh data periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Create a demo appointment
  const createDemoAppointment = async () => {
    if (!user) return;
    
    setAddingAppointment(true);
    setFeedback('');
    
    try {
      // Generate a future date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      // Create appointment data
      const userProfile = (user as any).userProfile || user;
      const isPatient = userProfile.userType === 'PATIENT';
      const isDoctor = userProfile.userType === 'DOCTOR';
      const appointmentData = {
        patientId: isPatient ? user.uid : 'user_patient_001',
        patientName: isPatient ? `${userProfile.firstName} ${userProfile.lastName}` : 'Alice Smith',
        doctorId: isDoctor ? user.uid : 'user_doctor_001',
        doctorName: isDoctor ? `Dr. ${userProfile.firstName} ${userProfile.lastName}` : 'Dr. Bob Johnson',
        doctorSpecialty: 'Cardiology',
        appointmentDate: Timestamp.fromDate(tomorrow),
        startTime: '10:00',
        endTime: '10:30',
        reason: `Demo appointment created at ${new Date().toLocaleTimeString()}`,
        appointmentType: 'In-person' as 'In-person' | 'Video',
      };
      
      // Book the appointment
      const result = await mockBookAppointment(appointmentData);
      
      if (result.success) {
        setFeedback(`Appointment created with ID: ${result.appointmentId}`);
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      setFeedback('Error creating appointment');
    } finally {
      setAddingAppointment(false);
    }
  };

  // Cancel an appointment
  const cancelAppointment = async (appointmentId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await mockCancelAppointment({
        appointmentId,
        reason: `Cancelled at ${new Date().toLocaleTimeString()}`,
        userId: user.uid,
      });
      
      setFeedback(`Appointment cancelled: ${appointmentId}`);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setFeedback('Error cancelling appointment');
    } finally {
      setLoading(false);
    }
  };

  // Mark a notification as read
  const markNotificationRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await mockMarkNotificationRead({
        notificationId,
        userId: user.uid,
      });
      
      setFeedback(`Notification marked as read: ${notificationId}`);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error marking notification:', error);
      setFeedback('Error marking notification as read');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Cross-Window Sync Demo</h1>
          <p className="mb-4">Please log in to test the cross-window synchronization.</p>
          <Link href="/auth/login">
            <Button label="Login" pageName="CrossWindowSyncDemo">Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Cross-Window Sync Demo</h1>
        <p className="mb-4">
          This page demonstrates how data changes are synchronized across browser windows.
          Open this page in multiple windows or tabs and make changes in one window to see them reflect in others.
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            label="Create Appointment"
            pageName="CrossWindowSyncDemo"
            onClick={createDemoAppointment}
            disabled={addingAppointment}
            isLoading={addingAppointment}
          >
            Create Demo Appointment
          </Button>
          
          <Button
            label="Refresh Data"
            pageName="CrossWindowSyncDemo"
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={loading}
          >
            Refresh Data
          </Button>
        </div>
        
        {feedback && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {feedback}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointments Card */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Your Appointments</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500">No appointments found.</p>
          ) : (
            <div className="space-y-4">
              {appointments.map(appointment => (
                <div 
                  key={appointment.id} 
                  className="border border-gray-200 rounded p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between mb-2">
                    <div className="font-semibold">
                      {appointment.doctorName}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      appointment.status === AppointmentStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                      appointment.status === AppointmentStatus.CONFIRMED ? 'bg-green-100 text-green-800' :
                      appointment.status === AppointmentStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {formatDate(appointment.appointmentDate)} at {appointment.startTime}
                  </div>
                  
                  <div className="text-sm mb-2">{appointment.reason}</div>
                  
                  {(appointment.status === AppointmentStatus.PENDING || 
                    appointment.status === AppointmentStatus.CONFIRMED) && (
                    <Button
                      size="sm"
                      variant="danger"
                      label="Cancel"
                      pageName="CrossWindowSyncDemo"
                      onClick={() => cancelAppointment(appointment.id)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notifications Card */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Your Notifications</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-gray-500">No notifications found.</p>
          ) : (
            <div className="space-y-4">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`border rounded p-4 ${notification.isRead ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50'}`}
                >
                  <div className="flex justify-between mb-2">
                    <div className="font-semibold">
                      {notification.title || notification.type}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  
                  <div className="text-sm mb-2">{notification.message}</div>
                  
                  {!notification.isRead && (
                    <Button
                      size="sm"
                      label="Mark as Read"
                      pageName="CrossWindowSyncDemo"
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 