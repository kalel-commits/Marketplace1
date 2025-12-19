'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, User } from '@/lib/auth'
import { tasks } from '@/lib/tasks'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { CATEGORIES } from '@/lib/constants'

export default function CreateTaskPage() {
  const [user, setUser] = useState<User | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [budget, setBudget] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await auth.getCurrentUser()
      if (!currentUser || currentUser.role !== 'business_owner') {
        router.push('/login')
        return
      }
      setUser(currentUser)
    }
    loadUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validation
    if (!title.trim()) {
      toast.error('Please enter a task title')
      return
    }

    if (title.trim().length < 5) {
      toast.error('Title must be at least 5 characters')
      return
    }

    if (!description.trim()) {
      toast.error('Please enter a task description')
      return
    }

    if (description.trim().length < 20) {
      toast.error('Description must be at least 20 characters')
      return
    }

    if (!category) {
      toast.error('Please select a category')
      return
    }

    const budgetValue = parseFloat(budget)
    if (isNaN(budgetValue) || budgetValue <= 0) {
      toast.error('Please enter a valid budget')
      return
    }

    if (!location.trim()) {
      toast.error('Please enter a location')
      return
    }

    setLoading(true)

    try {
      await tasks.createTask({
        title: title.trim(),
        description: description.trim(),
        category,
        budget: budgetValue,
        location: location.trim(),
        business_owner_id: user.id,
      })
      toast.success('Task created successfully!')
      router.push('/dashboard/business')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Task</h1>
          
          <Card>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Task Title *
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-gray-900"
                placeholder="e.g., Create a modern website for my restaurant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                Description *
              </label>
              <textarea
                id="description"
                required
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-gray-900"
                placeholder="Describe your task in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300">
                Category *
              </label>
              <select
                id="category"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-gray-900"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-300">
                  Budget (₹) *
                </label>
                <input
                  type="number"
                  id="budget"
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-gray-900"
                  placeholder="5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-300">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-gray-900"
                  placeholder="e.g., Mumbai, Maharashtra"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                >
                  Create Task
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}

