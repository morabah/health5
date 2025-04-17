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
import NotificationBell from "../shared/NotificationBell";

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
              
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* User Dropdown Menu */}
              <Menu as="div" className="relative ml-4">
                <Menu.Button className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
                  {userProfile.profilePictureUrl ? (
                    <img
                      src={userProfile.profilePictureUrl}
                      alt="User avatar"
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-lg">
                      {(userProfile.firstName ?? userProfile.email ?? '').charAt(0)}
                    </span>
                  )}
                  <span className="text-gray-800 dark:text-gray-100 font-medium max-w-[120px] truncate">
                    {userProfile.firstName && userProfile.lastName
                      ? `${userProfile.firstName} ${userProfile.lastName}`
                      : userProfile.email || 'User'}
                  </span>
                  {/* Role badge */}
                  {role && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 capitalize">
                      {role}
                    </span>
                  )}
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
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 rounded-md shadow-lg focus:outline-none z-50">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href={profilePath}
                            className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                          >
                            Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/settings"
                            className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                          >
                            Settings
                          </Link>
                        )}
                      </Menu.Item>
                      {role === 'admin' && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin/dashboard"
                              className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                            >
                              Admin Panel
                            </Link>
                          )}
                        </Menu.Item>
                      )}
                    </div>
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={`block w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                          >
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </>
          ) : (
            renderLoginButtons()
          )}
          <Button variant="primary" onClick={toggleTheme} aria-label="Toggle theme" label="Toggle theme" pageName="Navbar">
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
              
              {/* Notification Bell (Mobile) */}
              <div className="flex items-center gap-2 py-2">
                <NotificationBell />
                <span className="text-gray-700 dark:text-gray-300">Notifications</span>
              </div>
              
              {/* User Dropdown Menu (mobile) */}
              <Menu as="div" className="relative mt-2">
                <Menu.Button className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary w-full">
                  {userProfile.profilePictureUrl ? (
                    <img
                      src={userProfile.profilePictureUrl}
                      alt="User avatar"
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-lg">
                      {(userProfile.firstName ?? userProfile.email ?? '').charAt(0)}
                    </span>
                  )}
                  <span className="text-gray-800 dark:text-gray-100 font-medium max-w-[120px] truncate">
                    {userProfile.firstName && userProfile.lastName
                      ? `${userProfile.firstName} ${userProfile.lastName}`
                      : userProfile.email || 'User'}
                  </span>
                  {role && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 capitalize">
                      {role}
                    </span>
                  )}
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
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 rounded-md shadow-lg focus:outline-none z-50">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href={profilePath}
                            className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                          >
                            Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/settings"
                            className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                          >
                            Settings
                          </Link>
                        )}
                      </Menu.Item>
                      {role === 'admin' && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin/dashboard"
                              className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                            >
                              Admin Panel
                            </Link>
                          )}
                        </Menu.Item>
                      )}
                    </div>
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={`block w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                          >
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </>
          ) : (
            renderLoginButtons()
          )}
          <Button variant="primary" onClick={toggleTheme} aria-label="Toggle theme" label="Toggle theme" pageName="Navbar">
            <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
