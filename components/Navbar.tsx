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
    <nav className="bg-gray-900 shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Logo size="md" />
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href={
                    user.role === 'admin' ? '/dashboard/admin' :
                    user.role === 'business_owner' ? '/dashboard/business' : 
                    '/dashboard/freelancer'
                  }
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-primary-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-500 transition-colors"
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

