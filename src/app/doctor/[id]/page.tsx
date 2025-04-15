// Doctor dynamic page (App Router)
import { useParams } from 'next/navigation';

export default function DoctorIdPage() {
  // In App Router, useParams is only for client components, but placeholder here
  // For now, just display the id param
  // (If you need client-side logic, add 'use client'; at the top)
  // const params = useParams();
  // return <div>Doctor Dynamic Page: {params?.id}</div>;
  return <div>Doctor Dynamic Page (id param)</div>;
}
