'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, User } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ReelUpload from '@/components/ReelUpload'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    bio: '',
    instagram_id: '',
  })
  const [sampleReels, setSampleReels] = useState<string[]>(['', '', ''])
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const currentUser = await auth.getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
      setFormData({
        full_name: currentUser.full_name || '',
        phone: currentUser.phone || '',
        location: currentUser.location || '',
        bio: currentUser.bio || '',
        instagram_id: currentUser.instagram_id || '',
      })
      // Initialize reels array
      if (currentUser.sample_reels && currentUser.sample_reels.length > 0) {
        const reels = [...currentUser.sample_reels]
        while (reels.length < 3) {
          reels.push('')
        }
        setSampleReels(reels.slice(0, 3))
      } else {
        setSampleReels(['', '', ''])
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

    // Validate reels for freelancers
    if (user.role === 'freelancer') {
      const uploadedReels = sampleReels.filter(r => r && r.trim() !== '')
      if (uploadedReels.length < 3) {
        toast.error('Please upload all 3 sample reels to complete your profile')
        return
      }
    }

    setSaving(true)
    try {
      const updateData: any = { ...formData }
      if (user.role === 'freelancer') {
        updateData.sample_reels = sampleReels.filter(r => r && r.trim() !== '')
      }
      await updateDoc(doc(db, 'users', user.id), updateData)
      toast.success('Profile updated successfully!')
      await loadProfile()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

          <Card className="p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
                  <p className="text-gray-400">{user.email}</p>
                  <span className="inline-block mt-1 px-3 py-1 text-xs font-medium bg-primary-900/50 text-primary-300 rounded-full border border-primary-700">
                    {user.role === 'admin' ? 'Admin' : user.role === 'business_owner' ? 'Business Owner' : 'Freelancer'}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  required
                  className="w-full rounded-md border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-gray-800 text-white"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number (for WhatsApp)
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full rounded-md border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-gray-800 text-white"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This will be used for WhatsApp contact button
                </p>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  className="w-full rounded-md border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-gray-800 text-white"
                  placeholder="e.g., Mumbai, Maharashtra"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {user.role === 'freelancer' && (
                <div>
                  <label htmlFor="instagram_id" className="block text-sm font-medium text-gray-300 mb-2">
                    Instagram ID *
                  </label>
                  <input
                    type="text"
                    id="instagram_id"
                    required
                    className="w-full rounded-md border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-gray-800 text-white"
                    placeholder="your_instagram_handle"
                    value={formData.instagram_id}
                    onChange={(e) => setFormData({ ...formData, instagram_id: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your Instagram username (without @)
                  </p>
                </div>
              )}

              {user.role === 'freelancer' && (
                <ReelUpload 
                  reels={sampleReels} 
                  onChange={setSampleReels}
                  maxReels={3}
                />
              )}

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  className="w-full rounded-md border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-gray-800 text-white"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={saving}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}

