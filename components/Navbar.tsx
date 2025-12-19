'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { auth, User } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Logo from './Logo'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await auth.getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [])

  const handleSignOut = async () => {
    await auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Logo size="md" />
          </div>
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  href={
                    user.role === 'admin' ? '/dashboard/admin' :
                    user.role === 'business_owner' ? '/dashboard/business' : 
                    '/dashboard/freelancer'
                  }
                  className="text-gray-700 hover:text-primary-500 transition-colors font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-primary-500 transition-colors font-medium"
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-primary-500 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-primary-500 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-500 text-white px-5 py-2 rounded-md hover:bg-primary-600 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

