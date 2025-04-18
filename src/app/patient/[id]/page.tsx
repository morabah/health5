// Patient dynamic page (App Router)
import { redirect } from 'next/navigation';

export default function PatientIdPage() {
  redirect('/patient/dashboard');
}
