// Auth page (App Router)
import { redirect } from 'next/navigation';

export default function AuthPage() {
  redirect('/auth/login');
}
