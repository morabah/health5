// Main dynamic page (App Router)
import { useParams } from 'next/navigation';
import { redirect } from 'next/navigation';

export default function MainIdPage() {
  // In App Router, useParams is only for client components, but placeholder here
  // For now, just display the id param
  // (If you need client-side logic, add 'use client'; at the top)
  // const params = useParams();
  // return <div>Main Dynamic Page: {params?.id}</div>;
  redirect('/main/find-doctors');
}
