"use client";
import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, CalendarIcon, ClockIcon, UserGroupIcon, VideoCameraIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { Button } from "../../../../components/ui/Button";
// ...other imports...

export default function BookAppointmentPage() {
  // Add the missing state for modal visibility
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ time: string; index: number } | null>(null);
  const [appointmentType, setAppointmentType] = useState<'IN_PERSON' | 'VIDEO'>('IN_PERSON');
  const [doctor, setDoctor] = useState<{ fee?: number } | null>(null);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [insuranceProvider, setInsuranceProvider] = useState<string>("");
  const [insuranceFile, setInsuranceFile] = useState<{ name: string } | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState<boolean>(false);
  // ...all your hooks, state, and logic...

  let mainContent: JSX.Element;
  // ...mainContent assignment logic...

  // ...rest of your component logic...

  return (
    <>
      {mainContent}
      {/* DEBUG: Always render modal debug info at root */}
      {showSummaryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, background: 'rgba(255,0,0,0.8)', color: 'white', padding: 16 }}>
          DEBUG: MODAL OPEN (showSummaryModal is true)
        </div>
      )}
      {/* Always render modal at root (not after early return) */}
      <Transition appear show={showSummaryModal} as={Fragment}>
        <Dialog as="div" role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => setShowSummaryModal(false)}>
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
            </Transition.Child>
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="relative inline-block w-full max-w-md p-6 my-8 max-h-[80vh] overflow-y-auto text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  Confirm Appointment
                </Dialog.Title>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  aria-label="Close modal"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
                <div className="mt-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    <span>Date: {format(selectedDate, 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    <span>Time: {selectedSlot?.time}</span>
                  </div>
                  <div className="flex items-center">
                    {appointmentType === 'IN_PERSON' ? (
                      <UserGroupIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <VideoCameraIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    )}
                    <span>
                      Type: {appointmentType === 'IN_PERSON' ? 'In-Person Visit' : 'Video Consultation'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
                    <span>Fee: ${doctor?.fee}</span>
                  </div>
                  {reason && (
                    <div>
                      <span className="font-semibold">Reason:</span> {reason}
                    </div>
                  )}
                  {appointmentType === 'VIDEO' && notes && (
                    <div>
                      <span className="font-semibold">Notes:</span> {notes}
                    </div>
                  )}
                  {appointmentType === 'IN_PERSON' && insuranceProvider && (
                    <div>
                      <span className="font-semibold">Insurance:</span> {insuranceProvider}
                    </div>
                  )}
                  {appointmentType === 'IN_PERSON' && insuranceFile && (
                    <div>
                      <span className="font-semibold">Card:</span> {insuranceFile.name}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="secondary" onClick={() => setShowSummaryModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowSummaryModal(false);
                      handleBookAppointment();
                    }}
                    isLoading={bookingInProgress}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
