'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { UserRole } from '@/lib/firebase'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [instagramId, setInstagramId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!fullName.trim()) {
      toast.error('Please enter your full name')
      return
    }

    if (fullName.trim().length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }

    if (!email.trim()) {
      toast.error('Please enter your email')
      return
    }

    if (!password) {
      toast.error('Please enter a password')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!role) {
      toast.error('Please select a role')
      return
    }

    if (role === 'freelancer' && !instagramId.trim()) {
      toast.error('Please enter your Instagram ID')
      return
    }

    // Validate Instagram ID format (basic validation)
    if (role === 'freelancer' && instagramId.trim() && !/^[a-zA-Z0-9._]+$/.test(instagramId.trim())) {
      toast.error('Instagram ID can only contain letters, numbers, dots, and underscores')
      return
    }

    setLoading(true)

    try {
      await auth.signUp(email.trim(), password, fullName.trim(), role as UserRole, instagramId.trim())
      toast.success('Account created successfully!')
      
      // Sign in after signup
      await auth.signIn(email.trim(), password)
      const user = await auth.getCurrentUser()
      
      if (user?.role === 'business_owner') {
        router.push('/dashboard/business')
      } else if (user?.role === 'freelancer') {
        router.push('/dashboard/freelancer')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="p-8">
            <div className="mb-8">
              <h2 className="text-center text-3xl font-extrabold text-white">
                Create your account
              </h2>
              <p className="mt-2 text-center text-sm text-gray-400">
                Choose your role to get started
              </p>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {role === 'freelancer' && (
                <div>
                  <label htmlFor="instagramId" className="block text-sm font-medium text-gray-300">
                    Instagram ID *
                  </label>
                  <input
                    id="instagramId"
                    name="instagramId"
                    type="text"
                    required
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-400 text-white bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="your_instagram_handle"
                    value={instagramId}
                    onChange={(e) => setInstagramId(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your Instagram username (without @)
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('business_owner')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      role === 'business_owner'
                        ? 'border-primary-500 bg-primary-900/30 text-primary-300'
                        : 'border-gray-700 hover:border-primary-600 text-white bg-gray-800'
                    }`}
                  >
                    <div className="font-semibold">Business Owner</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Post tasks and find freelancers
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('freelancer')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      role === 'freelancer'
                        ? 'border-primary-500 bg-primary-900/30 text-primary-300'
                        : 'border-gray-700 hover:border-primary-600 text-white bg-gray-800'
                    }`}
                  >
                    <div className="font-semibold">Freelancer</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Browse and apply to tasks
                    </div>
                  </button>
                </div>
              </div>
            </div>

              <div>
                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full"
                >
                  Sign up
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}

