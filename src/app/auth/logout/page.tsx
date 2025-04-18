'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    // Clear any stored user session data
    localStorage.clear();
    // Redirect to login
    router.push('/auth/login');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      Logging out...
    </div>
  );
}
