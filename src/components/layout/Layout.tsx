import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Provides the main application layout structure, including Navbar and Footer.
 * Applies base background colors for light/dark modes.
 */
interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    // Flex column to push footer down, min height ensures it covers screen
    <div className="min-h-screen flex flex-col bg-light dark:bg-gray-900 text-dark dark:text-light transition-colors duration-200">
      <Navbar />
      {/* Main content area grows to fill space, applies container constraints and padding */}
      <main className="flex-grow container mx-auto px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
