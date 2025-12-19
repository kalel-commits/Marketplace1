'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import Logo from '@/components/Logo'
import Button from '@/components/ui/Button'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const session = await auth.getSession()
      if (session) {
        const user = await auth.getCurrentUser()
        if (user?.role === 'admin') {
          router.push('/dashboard/admin')
        } else if (user?.role === 'business_owner') {
          router.push('/dashboard/business')
        } else if (user?.role === 'freelancer') {
          router.push('/dashboard/freelancer')
        }
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-gray-900 shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Logo size="lg" showTagline={true} />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-300 hover:text-primary-400 transition-colors"
              >
                Login
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
            Connect Talent with
            <span className="text-primary-400"> Projects</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            The premier marketplace for businesses to find skilled video editors and for freelancers to showcase their work
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/tasks">
              <Button size="lg" variant="secondary">Browse Tasks</Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="text-3xl mb-4">🎬</div>
            <h3 className="text-xl font-bold text-white mb-2">For Business Owners</h3>
            <p className="text-gray-400">
              Post your video editing tasks and find talented freelancers. Review their sample reels to choose the perfect editor for your project.
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="text-3xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-white mb-2">For Freelancers</h3>
            <p className="text-gray-400">
              Showcase your best work with sample reels. Browse tasks, apply to projects, and grow your client base.
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2">Quality First</h3>
            <p className="text-gray-400">
              Every freelancer uploads 3 sample reels, so you can see their editing style and quality before making a decision.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

