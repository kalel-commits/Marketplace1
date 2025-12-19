'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { User, Task, Application } from '@/lib/firebase'
import { tasks } from '@/lib/tasks'
import { applications } from '@/lib/tasks'
import Navbar from '@/components/Navbar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import { DashboardCardSkeleton, TaskCardSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'

export default function FreelancerDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const currentUser = await auth.getCurrentUser()
      if (!currentUser || currentUser.role !== 'freelancer') {
        router.push('/login')
        return
      }
      setUser(currentUser)

      const applicationsData = await applications.getApplicationsByFreelancer(currentUser.id)
      setMyApplications(applicationsData)

      const tasksData = await tasks.getTasks({ status: 'open' })
      setAvailableTasks(tasksData.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Calculate application counts
  const pendingApps = myApplications.filter((a) => a.status === 'pending').length
  const acceptedApps = myApplications.filter((a) => a.status === 'accepted').length
  const rejectedApps = myApplications.filter((a) => a.status === 'rejected').length

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <DashboardCardSkeleton key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <TaskCardSkeleton />
              </Card>
              <Card className="p-6">
                <TaskCardSkeleton />
              </Card>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Freelancer Dashboard</h1>
            <Link href="/tasks">
              <Button>Browse All Tasks</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-600">Pending Applications</div>
              <div className="mt-2 text-3xl font-bold text-yellow-400">{pendingApps}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-600">Accepted</div>
              <div className="mt-2 text-3xl font-bold text-green-400">{acceptedApps}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-600">Rejected</div>
              <div className="mt-2 text-3xl font-bold text-red-400">{rejectedApps}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">My Applications</h2>
              </div>
              {myApplications.length === 0 ? (
                <EmptyState
                  title="No applications yet"
                  description="Start applying to tasks to connect with businesses in your area."
                  action={{
                    label: 'Browse Tasks',
                    href: '/tasks',
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {myApplications.slice(0, 5).map((app) => (
                    <Link
                      key={app.id}
                      href={`/tasks/${app.task_id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{app.task?.title || 'Task'}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{app.proposal}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            {app.task?.category && <span>{app.task.category}</span>}
                            {app.task?.location && <span>📍 {app.task.location}</span>}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-primary-400">₹{app.proposed_price.toLocaleString()}</p>
                          <StatusBadge status={app.status} type="application" />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {myApplications.length > 5 && (
                    <Link
                      href="/tasks"
                      className="block text-center text-primary-400 hover:text-primary-300 text-sm transition-colors"
                    >
                      View all applications →
                    </Link>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Available Tasks</h2>
                <Link
                  href="/tasks"
                  className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
                >
                  View All →
                </Link>
              </div>
              {availableTasks.length === 0 ? (
                <EmptyState
                  title="No available tasks"
                  description="Check back later for new opportunities."
                />
              ) : (
                <div className="space-y-4">
                  {availableTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{task.category}</span>
                            <span>📍 {task.location}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-primary-400">₹{task.budget.toLocaleString()}</p>
                          <StatusBadge status={task.status} type="task" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
