'use client';
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { logInfo } from '@/lib/logger';
import { db } from '@/lib/firebaseClient';
import type { Firestore } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';

interface ContactInfo {
  address: string;
  phone: string;
  email: string;
}

export default function ContactPage() {
  // Form state
  const [name, setName] = useLocalStorage<string>('contact_name', '');
  const [email, setEmail] = useLocalStorage<string>('contact_email', '');
  const [message, setMessage] = useLocalStorage<string>('contact_message', '');

  // Contact info state
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contact info from Firestore
  useEffect(() => {
    async function fetchContactInfo() {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db! as Firestore, 'siteInfo', 'mainContact');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setContactInfo(snap.data() as ContactInfo);
        } else {
          setError('Contact information not found.');
        }
      } catch (err) {
        setError('Failed to load contact info.');
      } finally {
        setLoading(false);
      }
    }
    fetchContactInfo();
  }, []);

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logInfo('Contact form submitted', { name, email, message });
    // Placeholder: implement actual submission logic
  };

  return (
    <main className="min-h-screen px-4 py-12 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Contact Form */}
        <section className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-8 flex flex-col">
          <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input label="Name" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Textarea label="Message" value={message} onChange={e => setMessage(e.target.value)} rows={4} required />
            <Button type="submit" className="w-full" label="Send Message" pageName="ContactPage">Send Message</Button>
          </form>
        </section>
        {/* Right: Contact Info */}
        <section className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-8 flex flex-col">
          <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
          {loading && <div className="text-gray-500 dark:text-gray-400">Loading contact info...</div>}
          {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
          {contactInfo && (
            <ul className="space-y-4">
              <li className="flex items-start">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                <span>{contactInfo.address}</span>
              </li>
              <li className="flex items-start">
                <FontAwesomeIcon icon={faPhone} className="h-6 w-6 mr-3 text-green-600 dark:text-green-400" />
                <span>{contactInfo.phone}</span>
              </li>
              <li className="flex items-start">
                <FontAwesomeIcon icon={faEnvelope} className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
                <span>{contactInfo.email}</span>
              </li>
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
