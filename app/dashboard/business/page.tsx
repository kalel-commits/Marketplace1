'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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

export default function BusinessDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const currentUser = await auth.getCurrentUser()
      if (!currentUser || currentUser.role !== 'business_owner') {
        router.push('/login')
        return
      }
      setUser(currentUser)

      const tasksData = await tasks.getTasks({ business_owner_id: currentUser.id })
      setMyTasks(tasksData)

      // Get applications for all tasks
      const allApplications: Application[] = []
      for (const task of tasksData) {
        const apps = await applications.getApplicationsByTask(task.id)
        allApplications.push(...apps)
      }
      setRecentApplications(allApplications.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stats = useMemo(() => {
    return {
      openTasks: myTasks.filter(t => t.status === 'open').length,
      inProgressTasks: myTasks.filter(t => t.status === 'in_progress').length,
      completedTasks: myTasks.filter(t => t.status === 'completed').length,
      pendingApplications: recentApplications.filter(a => a.status === 'pending').length,
    }
  }, [myTasks, recentApplications])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-black py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
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
            <h1 className="text-3xl font-bold text-white">Business Dashboard</h1>
            <Link href="/tasks/create">
              <Button>+ Create New Task</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-400">Open Tasks</div>
              <div className="mt-2 text-3xl font-bold text-primary-400">{stats.openTasks}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-400">In Progress</div>
              <div className="mt-2 text-3xl font-bold text-blue-400">{stats.inProgressTasks}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-400">Completed</div>
              <div className="mt-2 text-3xl font-bold text-green-400">{stats.completedTasks}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-400">Pending Applications</div>
              <div className="mt-2 text-3xl font-bold text-yellow-400">{stats.pendingApplications}</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">My Tasks</h2>
                <Link
                  href="/tasks/create"
                  className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
                >
                  + New Task
                </Link>
              </div>
              {myTasks.length === 0 ? (
                <EmptyState
                  title="No tasks yet"
                  description="Get started by creating your first task to connect with freelancers."
                  action={{
                    label: 'Create Your First Task',
                    href: '/tasks/create',
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {myTasks.slice(0, 5).map((task) => (
                    <Link
                      key={task.id}
                      href={`/tasks/${task.id}`}
                      className="block border border-gray-800 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{task.title}</h3>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{task.category}</span>
                            <span>📍 {task.location}</span>
                            <span className="font-semibold text-primary-400">₹{task.budget.toLocaleString()}</span>
                          </div>
                        </div>
                        <StatusBadge status={task.status} type="task" />
                      </div>
                    </Link>
                  ))}
                  {myTasks.length > 5 && (
                    <Link
                      href="/tasks"
                      className="block text-center text-primary-400 hover:text-primary-300 text-sm transition-colors"
                    >
                      View all tasks →
                    </Link>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Applications</h2>
              {recentApplications.length === 0 ? (
                <EmptyState
                  title="No applications yet"
                  description="Applications from freelancers will appear here when they apply to your tasks."
                />
              ) : (
                <div className="space-y-4">
                  {recentApplications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/tasks/${app.task_id}`}
                      className="block border border-gray-800 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">
                            {app.freelancer?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{app.proposal}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Applied to: {app.task?.title || 'Task'}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-primary-400">₹{app.proposed_price.toLocaleString()}</p>
                          <StatusBadge status={app.status} type="application" />
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
