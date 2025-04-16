"use client";
import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { loadDoctorForms } from '@/data/loadDoctorForms';

interface FormSubmission {
  id: string;
  patientName: string;
  formType: string;
  submittedAt: string;
  status: string;
}

export default function DoctorFormsPage() {
  const [forms, setForms] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForms() {
      setLoading(true);
      setError(null);
      try {
        const items = await loadDoctorForms();
        setForms(items);
      } catch (err) {
        setError('Failed to load forms.');
      } finally {
        setLoading(false);
      }
    }
    fetchForms();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Patient Forms</h1>
      <Card className="w-full max-w-4xl mb-8 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Submitted Forms</h2>
          <Button asChild>
            <a href="/doctor/dashboard">Back to Dashboard</a>
          </Button>
        </div>
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
        {!loading && !error && forms.length === 0 && (
          <EmptyState
            title="No forms submitted."
            message="You have not received any patient forms yet. When a patient submits a form, it will appear here."
            className="my-8"
          />
        )}
        {!loading && forms.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-2 text-left">Patient</th>
                  <th className="px-4 py-2 text-left">Form Type</th>
                  <th className="px-4 py-2 text-left">Submitted At</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {forms.map(form => (
                  <tr key={form.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{form.patientName}</td>
                    <td className="px-4 py-2">{form.formType}</td>
                    <td className="px-4 py-2">{form.submittedAt}</td>
                    <td className="px-4 py-2">{form.status}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button size="sm" disabled title="Form detail view coming soon">
                        View
                      </Button>
                      <Button size="sm" disabled={form.status === 'reviewed'} variant="secondary" title="Mark as reviewed coming soon">
                        Mark as Reviewed
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
