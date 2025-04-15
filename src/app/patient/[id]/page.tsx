// Patient dynamic page (App Router)
import { useParams } from 'next/navigation';

export default function PatientIdPage() {
  // In App Router, useParams is only for client components, but placeholder here
  // For now, just display the id param
  // (If you need client-side logic, add 'use client'; at the top)
  // const params = useParams();
  // return <div>Patient Dynamic Page: {params?.id}</div>;
  return <div>Patient Dynamic Page (id param)</div>;
}
