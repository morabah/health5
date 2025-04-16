"use client";
/**
 * Navbar component: Main site navigation with mock authentication state.
 * Supports desktop/mobile, dark mode, and theme toggle.
 */
import React, { useState, Fragment } from "react";
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

const Navbar: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Mock auth state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-white dark:bg-gray-900 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Branding */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold text-primary dark:text-white">
              Health Appointment
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-4 items-center">
            <Link href="/" className="hover:text-primary font-medium transition-colors">Home</Link>
            <Link href="/about" className="hover:text-primary font-medium transition-colors">About</Link>
            <Link href="/contact" className="hover:text-primary font-medium transition-colors">Contact</Link>
            <ApiModeLabel />
            {isLoggedIn ? (
              <>
                <Link href="/main/find-doctors" className="hover:text-primary font-medium transition-colors">
                  Find Doctors
                </Link>
                {/* Notifications */}
                <button
                  className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => logInfo("Notifications clicked")}
                  aria-label="Notifications"
                >
                  <FontAwesomeIcon icon={faBell} className="text-xl" />
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-900" style={{fontSize:'0.75rem'}}>1</span>
                </button>
                {/* Profile Menu */}
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="flex items-center focus:outline-none">
                    <FontAwesomeIcon icon={faUserCircle} className="text-2xl ml-2" />
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
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg focus:outline-none z-50">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link href="/dashboard" className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>Dashboard</Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link href="/profile" className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>Profile</Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => { logInfo('Logout clicked'); setIsLoggedIn(false); }}
                              className={`block w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                            >
                              Logout
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
                {/* Theme Toggle */}
                <button
                  className="ml-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="secondary" size="sm" className="ml-2">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm" className="ml-2">Register</Button>
                </Link>
                <button
                  className="ml-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle mobile menu"
            >
              <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="text-xl" />
            </button>
          </div>
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
        <div className="md:hidden absolute z-40 w-full bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col p-4 space-y-2">
            <Link href="/" className="py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Home</Link>
            <Link href="/about" className="py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800">About</Link>
            <Link href="/contact" className="py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Contact</Link>
            {isLoggedIn ? (
              <>
                <Link href="/main/find-doctors" className="py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800">Find Doctors</Link>
                <button
                  className="flex items-center py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => logInfo('Notifications clicked')}
                >
                  <FontAwesomeIcon icon={faBell} className="mr-2" /> Notifications
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white dark:border-gray-900" style={{fontSize:'0.75rem'}}>1</span>
                </button>
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="flex items-center w-full py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                    <FontAwesomeIcon icon={faUserCircle} className="mr-2 text-xl" /> Profile
                  </Menu.Button>
                  <Transition as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute left-0 mt-2 w-48 origin-top-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg focus:outline-none z-50">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link href="/dashboard" className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>Dashboard</Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link href="/profile" className={`block px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>Profile</Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => { logInfo('Logout clicked'); setIsLoggedIn(false); }}
                              className={`block w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                            >
                              Logout
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
                <button
                  className="py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="secondary" size="sm" className="w-full mb-2">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm" className="w-full mb-2">Register</Button>
                </Link>
                <button
                  className="py-2 px-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
                </button>
              </>
            )}
          </div>
        </div>
      </Transition>
    </nav>
  );
};

export default Navbar;
