'use client'

import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Us */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">About Us</h3>
            <p className="text-gray-400 text-sm mb-4">
              Skilvo connects talented video editors with businesses looking for quality work. 
              We make it easy to find the perfect match for your project.
            </p>
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Contact us:</p>
              <a
                href="mailto:teamskilvo@gmail.com"
                className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
              >
                teamskilvo@gmail.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/tasks" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Browse Tasks
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Brand */}
          <div>
            <Logo size="md" />
            <p className="text-gray-400 text-sm mt-4">
              Connecting Talent & Projects
            </p>
            <p className="text-gray-500 text-xs mt-6">
              © {new Date().getFullYear()} Skilvo. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

