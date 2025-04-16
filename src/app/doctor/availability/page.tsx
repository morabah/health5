"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { loadDoctorAvailability } from '@/data/loadDoctorAvailability';

interface AvailabilitySlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export default function DoctorAvailabilityPage() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      setError(null);
      try {
        const items = await loadDoctorAvailability();
        setSlots(items);
      } catch (err) {
        setError('Failed to load availability slots.');
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Set Availability</h1>
      <Card className="w-full max-w-3xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Available Slots</h2>
          <Button asChild>
            <Link href="/doctor">Back to Dashboard</Link>
          </Button>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && slots.length === 0 && (
          <EmptyState
            title="No availability slots found."
            message="You have not set any availability. Use the scheduling tools to add slots."
            className="my-8"
          />
        )}
        {!loading && slots.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Available</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{slot.date}</td>
                    <td className="px-4 py-2">{slot.time}</td>
                    <td className="px-4 py-2">
                      {slot.available ? (
                        <span className="text-green-600 dark:text-green-400">Yes</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button size="sm" disabled title="Edit slot feature coming soon">
                        Edit
                      </Button>
                      <Button size="sm" disabled variant="secondary" title="Remove slot feature coming soon">
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
