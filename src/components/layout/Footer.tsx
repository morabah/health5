import React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";

/**
 * Footer component: Standard site footer with copyright, links, and social icons.
 */
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-8 text-center border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
        <div className="flex gap-6 mb-2">
          <Link href="/terms" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Terms</Link>
          <Link href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Privacy</Link>
        </div>
        <div className="flex gap-4 justify-center mb-2">
          <a href="#" aria-label="Twitter" className="hover:text-primary text-gray-500 dark:text-gray-300">
            <FontAwesomeIcon icon={faTwitter} size="lg" />
          </a>
          <a href="#" aria-label="GitHub" className="hover:text-primary text-gray-500 dark:text-gray-300">
            <FontAwesomeIcon icon={faGithub} size="lg" />
          </a>
          <a href="#" aria-label="LinkedIn" className="hover:text-primary text-gray-500 dark:text-gray-300">
            <FontAwesomeIcon icon={faLinkedin} size="lg" />
          </a>
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Health Appointment. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
