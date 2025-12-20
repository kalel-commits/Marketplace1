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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Freelancer Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your applications and discover new opportunities</p>
            </div>
            <Link href="/tasks">
              <Button>Browse All Tasks</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-yellow-700">Pending Applications</div>
                  <div className="mt-2 text-3xl font-bold text-yellow-600">{pendingApps}</div>
                  <div className="text-xs text-yellow-600 mt-2">
                    Awaiting response
                  </div>
                </div>
                <div className="text-4xl opacity-20">⏳</div>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-700">Accepted</div>
                  <div className="mt-2 text-3xl font-bold text-green-600">{acceptedApps}</div>
                  <div className="text-xs text-green-600 mt-2">
                    Active projects
                  </div>
                </div>
                <div className="text-4xl opacity-20">✓</div>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-red-700">Rejected</div>
                  <div className="mt-2 text-3xl font-bold text-red-600">{rejectedApps}</div>
                  <div className="text-xs text-red-600 mt-2">
                    Not selected
                  </div>
                </div>
                <div className="text-4xl opacity-20">✗</div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Applications</h2>
                {myApplications.length > 0 && (
                  <span className="text-sm text-gray-500">{myApplications.length} total</span>
                )}
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
                <div className="space-y-3">
                  {myApplications.slice(0, 5).map((app) => (
                    <Link
                      key={app.id}
                      href={`/tasks/${app.task_id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{app.task?.title || 'Task'}</h3>
                            <StatusBadge status={app.status} type="application" />
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{app.proposal}</p>
                          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                            {app.task?.category && (
                              <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">{app.task.category}</span>
                            )}
                            {app.task?.location && (
                              <span className="flex items-center gap-1">
                                <span>📍</span>
                                {app.task.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-primary-600 text-lg">₹{app.proposed_price.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">Proposed</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {myApplications.length > 5 && (
                    <Link
                      href="/tasks"
                      className="block text-center text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors py-2"
                    >
                      View all {myApplications.length} applications →
                    </Link>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Available Tasks</h2>
                <Link
                  href="/tasks"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
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
                <div className="space-y-3">
                  {availableTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{task.title}</h3>
                            <StatusBadge status={task.status} type="task" />
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">{task.category}</span>
                            <span className="flex items-center gap-1">
                              <span>📍</span>
                              {task.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-primary-600 text-lg">₹{task.budget.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">Budget</p>
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
