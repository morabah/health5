'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logInfo } from '@/lib/logger';
import { setEventInLocalStorage } from '@/lib/eventBus';
import { appEventBus, LogPayload } from '@/lib/eventBus';
import { useEffect } from 'react';

/**
 * Helper function: always use this to log events so cross-tab sync works.
 */
function logEventToCMS(message: string, data?: Record<string, any>) {
  const payload: LogPayload = {
    level: 'INFO',
    message,
    timestamp: new Date().toISOString(),
    data,
  };
  // In-memory event bus (for same tab)
  appEventBus.emit('log_event', payload);
  // Cross-tab sync (for all tabs)
  setEventInLocalStorage(payload);
  // Logger fallback (for legacy support)
  logInfo(message, data);
}

/**
 * Home page with navigation links to all main project pages. 
 * Demonstrates different approaches to event tracking that all log to the CMS.
 */
export default function Home() {
  const router = useRouter();

  // Logs navigation, then navigates
  const handleNav = (destination: string, href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    logEventToCMS(`Navigation: From Home to "${destination}"`, { from: 'Home', to: destination, path: href });
    setTimeout(() => {
      router.push(href);
    }, 50);
  };

  // Logs all button clicks in the home page
  const handleButtonClick = (buttonName: string) => {
    logEventToCMS(`Button Clicked: ${buttonName}`, { buttonName, page: 'Home' });
  };

  useEffect(() => {
    logEventToCMS('HOME PAGE LOADED', { page: 'Home', source: 'useEffect' });
    // Send a test event after a delay to ensure it's captured
    setTimeout(() => {
      logEventToCMS('Delayed test event from Home page', { delayed: true });
    }, 2000);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to the Health Appointment System</h1>
      {/* Test Buttons */}
      <div className="mb-8 p-4 border border-red-300 rounded bg-red-50 dark:bg-red-900/20">
        <h2 className="text-xl font-semibold mb-4">Test Button Events</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button onClick={() => handleButtonClick('Red Button')} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-800">Red Button</button>
          <button onClick={() => handleButtonClick('Blue Button')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800">Blue Button</button>
          <button onClick={() => handleButtonClick('Green Button')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-800">Green Button</button>
          <button onClick={() => handleButtonClick('Purple Button')} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-800">Purple Button</button>
        </div>
        <p className="text-sm text-gray-500">Click these buttons and check the CMS page for logs.</p>
      </div>
      {/* Navigation Section */}
      <nav className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Navigation Links</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <li><Link href="/cms-validation" className="block p-4 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleNav('CMS / Validation', '/cms-validation')}>CMS / Validation</Link></li>
          <li><Link href="/about" className="block p-4 rounded bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleNav('About', '/about')}>About</Link></li>
          <li><Link href="/contact" className="block p-4 rounded bg-purple-600 text-white hover:bg-purple-700" onClick={handleNav('Contact', '/contact')}>Contact</Link></li>
          <li><Link href="/auth" className="block p-4 rounded bg-orange-600 text-white hover:bg-orange-700" onClick={handleNav('Auth', '/auth')}>Auth</Link></li>
          <li><Link href="/patient" className="block p-4 rounded bg-teal-600 text-white hover:bg-teal-700" onClick={handleNav('Patient', '/patient')}>Patient</Link></li>
          <li><Link href="/doctor" className="block p-4 rounded bg-pink-600 text-white hover:bg-pink-700" onClick={handleNav('Doctor', '/doctor')}>Doctor</Link></li>
          <li><Link href="/admin" className="block p-4 rounded bg-gray-700 text-white hover:bg-gray-900" onClick={handleNav('Admin', '/admin')}>Admin</Link></li>
          <li><Link href="/main" className="block p-4 rounded bg-yellow-600 text-white hover:bg-yellow-700" onClick={handleNav('Main', '/main')}>Main</Link></li>
        </ul>
      </nav>
      <p className="text-sm text-gray-500">Select a section to begin navigating the app or use the test buttons above to log an event.</p>
    </main>
  );
}
