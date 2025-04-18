// Doctor dynamic page (App Router)
import { redirect } from 'next/navigation';

export default function DoctorIdPage() {
  redirect('/doctor/dashboard');
}
