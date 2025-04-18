// Auth dynamic page (App Router)
import { redirect } from 'next/navigation';

export default function AuthIdPage() {
  redirect('/auth/login');
}
