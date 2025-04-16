import React from 'react';

export default function AboutPage() {
  return (
    <main className="min-h-screen px-4 py-12 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-6 text-center">About Our Health Appointment System</h1>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
          <p className="text-lg leading-relaxed dark:text-gray-300">
            We are dedicated to making healthcare more accessible and efficient by providing a robust appointment management platform for both patients and providers. Our mission is to simplify scheduling, reduce wait times, and empower users with modern, reliable tools.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">What We Offer</h2>
          <ul className="list-disc pl-6 space-y-2 dark:text-gray-300">
            <li>Easy appointment booking for patients</li>
            <li>Comprehensive schedule management for healthcare professionals</li>
            <li>Secure and private data handling</li>
            <li>Responsive design for all devices</li>
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Our Vision</h2>
          <p className="text-lg leading-relaxed dark:text-gray-300">
            We envision a future where healthcare is streamlined, patient-centric, and technologically advanced, ensuring everyone receives the care they deserve.
          </p>
        </section>
      </div>
    </main>
  );
}
