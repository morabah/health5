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
  const { user, userProfile, loading, login, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Determine dashboard/profile links based on userProfile.userType
  let dashboardPath = "/";
  let profilePath = "/";
  if (userProfile?.userType === UserType.DOCTOR) {
    dashboardPath = "/doctor/dashboard";
    profilePath = "/doctor/profile";
  } else if (userProfile?.userType === UserType.PATIENT) {
    dashboardPath = "/patient/dashboard";
    profilePath = "/patient/profile";
  }

  // Helper: Render role-based links
  const renderRoleLinks = () => {
    if (!user || !userProfile) return null;
    if (userProfile.userType === UserType.PATIENT) {
      return (
        <>
          <Link href="/main/find-doctors" className="hover:text-primary font-medium transition-colors">Find Doctors</Link>
          <Link href="/patient/appointments" className="hover:text-primary font-medium transition-colors">My Appointments</Link>
          <Link href="/patient/profile" className="hover:text-primary font-medium transition-colors">Profile</Link>
        </>
      );
    }
    if (userProfile.userType === UserType.DOCTOR) {
      return (
        <>
          <Link href="/doctor/profile" className="hover:text-primary font-medium transition-colors">Profile</Link>
          <Link href="/doctor/availability" className="hover:text-primary font-medium transition-colors">Availability</Link>
          <Link href="/main/notifications" className="hover:text-primary font-medium transition-colors">Notifications</Link>
        </>
      );
    }
    return null;
  };

  return (
    <nav className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-xl text-primary">Health 5</Link>
          <ApiModeLabel />
        </div>
        <div className="hidden md:flex items-center gap-6">
          {/* Show links only when not loading */}
          {!loading && !user && (
            <>
              <Button variant="secondary" onClick={() => login("patient")}>Login as Patient</Button>
              <Button variant="secondary" onClick={() => login("doctor")}>Login as Doctor</Button>
            </>
          )}
          {!loading && user && renderRoleLinks()}
          {/* Theme toggle */}
          <Button variant="ghost" aria-label="Toggle theme" onClick={toggleTheme} className="ml-2">
            <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
          </Button>
          {/* Profile dropdown if logged in */}
          {!loading && user && (
            <Menu as="div" className="relative">
              <Menu.Button className="ml-2 flex items-center gap-2 focus:outline-none">
                <FontAwesomeIcon icon={faUserCircle} className="text-2xl text-gray-700 dark:text-gray-200" />
                <span className="font-medium text-sm text-gray-700 dark:text-gray-200">
                  {userProfile?.firstName}
                </span>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link href={dashboardPath} className={`block px-4 py-2 text-sm ${active ? "bg-gray-100 dark:bg-gray-700" : ""}`}>Dashboard</Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href={profilePath} className={`block px-4 py-2 text-sm ${active ? "bg-gray-100 dark:bg-gray-700" : ""}`}>Profile</Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={logout} className={`block w-full text-left px-4 py-2 text-sm text-red-600 ${active ? "bg-gray-100 dark:bg-gray-700" : ""}`}>Logout</button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="text-xl" />
          </button>
        </div>
      </div>
      {/* Mobile menu panel */}
      <Transition
        show={mobileMenuOpen}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 -translate-y-4"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-4"
      >
        <div className="md:hidden bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex flex-col gap-4 p-4">
            {!loading && !user && (
              <>
                <Button variant="secondary" onClick={() => login("patient")}>Login as Patient</Button>
                <Button variant="secondary" onClick={() => login("doctor")}>Login as Doctor</Button>
              </>
            )}
            {!loading && user && renderRoleLinks()}
            {!loading && user && (
              <div className="flex flex-col gap-2 mt-2">
                <Link href={dashboardPath} className="px-4 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800">Dashboard</Link>
                <Link href={profilePath} className="px-4 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800">Profile</Link>
                <button onClick={logout} className="px-4 py-2 text-sm text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Logout</button>
              </div>
            )}
            <Button variant="ghost" aria-label="Toggle theme" onClick={toggleTheme} className="mt-2">
              <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
            </Button>
          </div>
        </div>
      </Transition>
    </nav>
  );
};

export default Navbar;
