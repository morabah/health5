"use client";
/**
 * Navbar component: Main site navigation with mock authentication state.
 * Supports desktop/mobile, dark mode, and theme toggle.
 */
import React, { Fragment } from "react";
import Button from "@/components/ui/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faUserCircle,
  faBars,
  faTimes,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import { logInfo } from "@/lib/logger";
import { useTheme } from "../../context/ThemeContext";
import ApiModeLabel from "./ApiModeLabel";
import { useAuth } from "../../context/AuthContext";
import { UserType } from "@/types/enums";

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, userProfile, loading, login, logout, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Determine dashboard/profile links based on role
  let dashboardPath = "/";
  let profilePath = "/";
  if (role === "doctor") {
    dashboardPath = "/doctor/dashboard";
    profilePath = "/doctor/profile";
  } else if (role === "patient") {
    dashboardPath = "/patient/dashboard";
    profilePath = "/patient/profile";
  } else if (role === "admin") {
    dashboardPath = "/admin/dashboard";
    profilePath = "/admin/profile";
  }

  // Helper: Render role-based links
  const renderRoleLinks = () => {
    if (!user || !userProfile) return null;
    if (role === "patient") {
      return (
        <>
          <Link href="/patient/dashboard" className="hover:text-primary font-medium transition-colors">Dashboard</Link>
          <Link href="/find" className="hover:text-primary font-medium transition-colors">Find Doctors</Link>
          <Link href="/patient/appointments" className="hover:text-primary font-medium transition-colors">My Appointments</Link>
          <Link href="/notifications" className="hover:text-primary font-medium transition-colors">Notifications</Link>
          <Link href="/patient/profile" className="hover:text-primary font-medium transition-colors">Profile</Link>
        </>
      );
    }
    if (role === "doctor") {
      return (
        <>
          <Link href="/doctor/dashboard" className="hover:text-primary font-medium transition-colors">Dashboard</Link>
          <Link href="/doctor/appointments" className="hover:text-primary font-medium transition-colors">My Appointments</Link>
          <Link href="/doctor/patients" className="hover:text-primary font-medium transition-colors">My Patients</Link>
          <Link href="/doctor/availability" className="hover:text-primary font-medium transition-colors">Availability</Link>
          <Link href="/doctor/notes" className="hover:text-primary font-medium transition-colors">Notes</Link>
          <Link href="/doctor/profile" className="hover:text-primary font-medium transition-colors">Profile</Link>
          <Link href="/notifications" className="hover:text-primary font-medium transition-colors">Notifications</Link>
        </>
      );
    }
    if (role === "admin") {
      return (
        <>
          <Link href="/admin/dashboard" className="hover:text-primary font-medium transition-colors">Dashboard</Link>
          <Link href="/admin/lists" className="hover:text-primary font-medium transition-colors">User Lists</Link>
          <Link href="/admin/profile" className="hover:text-primary font-medium transition-colors">Profile</Link>
          <Link href="/admin/doctor-verification" className="hover:text-primary font-medium transition-colors">Doctor Verification</Link>
          <Link href="/cms-validation" className="hover:text-primary font-medium transition-colors">CMS Validation</Link>
        </>
      );
    }
    return null;
  };

  // Helper: Render login buttons for each role
  const renderLoginButtons = () => (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        onClick={() => login('patient')}
        label="Login as Patient"
        pageName="Navbar"
        additionalLogData={{ method: 'quick-patient' }}
      >Login as Patient</Button>
      <Button
        variant="secondary"
        onClick={() => login('doctor')}
        label="Login as Doctor"
        pageName="Navbar"
        additionalLogData={{ method: 'quick-doctor' }}
      >Login as Doctor</Button>
      <Button
        variant="secondary"
        onClick={() => login('admin')}
        label="Login as Admin"
        pageName="Navbar"
        additionalLogData={{ method: 'quick-admin' }}
      >Login as Admin</Button>
    </div>
  );

  return (
    <nav className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-xl text-primary">Health 5</Link>
          <ApiModeLabel />
        </div>
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : user && userProfile ? (
            <>
              {renderRoleLinks()}
              <Button variant="ghost" onClick={logout} className="ml-2">Logout</Button>
            </>
          ) : (
            renderLoginButtons()
          )}
          <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
            <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
          </Button>
        </div>
        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-2xl p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
        </button>
      </div>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 px-4 py-4 flex flex-col gap-4">
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : user && userProfile ? (
            <>
              {renderRoleLinks()}
              <Button variant="ghost" onClick={() => { setMobileMenuOpen(false); logout(); }} className="mt-2">Logout</Button>
            </>
          ) : (
            renderLoginButtons()
          )}
          <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
            <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
