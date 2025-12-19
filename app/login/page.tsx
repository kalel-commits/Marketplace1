'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!email.trim()) {
      toast.error('Please enter your email')
      return
    }

    if (!password) {
      toast.error('Please enter your password')
      return
    }

    setLoading(true)

    try {
      await auth.signIn(email.trim(), password)
      const user = await auth.getCurrentUser()
      
      if (user?.role === 'admin') {
        router.push('/dashboard/admin')
      } else if (user?.role === 'business_owner') {
        router.push('/dashboard/business')
      } else if (user?.role === 'freelancer') {
        // Check if freelancer has uploaded reels
        if (!user.sample_reels || user.sample_reels.length < 3) {
          toast.error('Please upload 3 sample reels to complete your profile')
          router.push('/profile')
        } else {
          router.push('/dashboard/freelancer')
        }
      } else {
        router.push('/')
      }
      if (user?.role !== 'freelancer' || (user.sample_reels && user.sample_reels.length >= 3)) {
        toast.success('Logged in successfully!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card className="p-8">
            <div className="mb-8">
              <h2 className="text-center text-3xl font-extrabold text-gray-900">
                Sign in to your account
              </h2>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 bg-white rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 bg-white rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

              <div>
                <Button
                  type="submit"
                  isLoading={loading}
                  className="w-full"
                >
                  Sign in
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/signup"
                  className="text-primary-500 hover:text-primary-600 transition-colors"
                >
                  Don't have an account? Sign up
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}

