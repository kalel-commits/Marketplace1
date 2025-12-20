'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { User, Task, Application } from '@/lib/firebase'
import { tasks } from '@/lib/tasks'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import { DashboardCardSkeleton } from '@/components/ui/LoadingSkeleton'
import Button from '@/components/ui/Button'

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [allApplications, setAllApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tasks' | 'applications'>('overview')
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const currentUser = await auth.getCurrentUser()
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/login')
        return
      }
      setUser(currentUser)

      // Check if Firebase is initialized
      if (!db) {
        throw new Error('Firebase not initialized')
      }

      // Load all users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersList: User[] = []
      usersSnapshot.forEach((doc) => {
        const userData = doc.data()
        usersList.push({
          id: doc.id,
          ...userData,
          created_at: userData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as User)
      })
      setAllUsers(usersList)

      // Load all tasks
      const tasksData = await tasks.getTasks()
      setAllTasks(tasksData)

      // Load all applications
      const applicationsSnapshot = await getDocs(collection(db, 'applications'))
      const applicationsList: Application[] = []
      for (const appDoc of applicationsSnapshot.docs) {
        const appData = appDoc.data()
        
        // Fetch related data
        let freelancer: User | undefined
        let task: Task | undefined

        if (appData.freelancer_id) {
          const freelancerDoc = usersList.find(u => u.id === appData.freelancer_id)
          if (freelancerDoc) freelancer = freelancerDoc
        }

        if (appData.task_id) {
          const taskDoc = tasksData.find(t => t.id === appData.task_id)
          if (taskDoc) task = taskDoc
        }

        applicationsList.push({
          id: appDoc.id,
          ...appData,
          created_at: appData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          freelancer,
          task,
        } as Application)
      }
      setAllApplications(applicationsList)
    } catch (error) {
      console.error('Failed to load admin dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => ({
    totalUsers: allUsers.length,
    businessOwners: allUsers.filter(u => u.role === 'business_owner').length,
    freelancers: allUsers.filter(u => u.role === 'freelancer').length,
    totalTasks: allTasks.length,
    openTasks: allTasks.filter(t => t.status === 'open').length,
    inProgressTasks: allTasks.filter(t => t.status === 'in_progress').length,
    completedTasks: allTasks.filter(t => t.status === 'completed').length,
    totalApplications: allApplications.length,
    pendingApplications: allApplications.filter(a => a.status === 'pending').length,
    acceptedApplications: allApplications.filter(a => a.status === 'accepted').length,
    rejectedApplications: allApplications.filter(a => a.status === 'rejected').length,
  }), [allUsers, allTasks, allApplications])

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers
    const query = searchQuery.toLowerCase()
    return allUsers.filter(u => 
      u.full_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.location?.toLowerCase().includes(query) ||
      u.instagram_id?.toLowerCase().includes(query)
    )
  }, [allUsers, searchQuery])

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return allTasks
    const query = searchQuery.toLowerCase()
    return allTasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      t.location.toLowerCase().includes(query)
    )
  }, [allTasks, searchQuery])

  const filteredApplications = useMemo(() => {
    if (!searchQuery) return allApplications
    const query = searchQuery.toLowerCase()
    return allApplications.filter(a => 
      a.freelancer?.full_name.toLowerCase().includes(query) ||
      a.task?.title.toLowerCase().includes(query) ||
      a.proposal.toLowerCase().includes(query)
    )
  }, [allApplications, searchQuery])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <DashboardCardSkeleton key={i} />
              ))}
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage users, tasks, and applications</p>
            </div>
            <Button onClick={loadData} variant="secondary">
              🔄 Refresh Data
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-primary-700">Total Users</div>
                  <div className="mt-2 text-3xl font-bold text-primary-600">{stats.totalUsers}</div>
                  <div className="text-xs text-primary-600 mt-2">
                    {stats.businessOwners} Business Owners, {stats.freelancers} Freelancers
                  </div>
                </div>
                <div className="text-4xl opacity-20">👥</div>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-700">Total Tasks</div>
                  <div className="mt-2 text-3xl font-bold text-blue-600">{stats.totalTasks}</div>
                  <div className="text-xs text-blue-600 mt-2">
                    {stats.openTasks} Open, {stats.inProgressTasks} In Progress, {stats.completedTasks} Completed
                  </div>
                </div>
                <div className="text-4xl opacity-20">📋</div>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-700">Total Applications</div>
                  <div className="mt-2 text-3xl font-bold text-green-600">{stats.totalApplications}</div>
                  <div className="text-xs text-green-600 mt-2">
                    {stats.pendingApplications} Pending, {stats.acceptedApplications} Accepted, {stats.rejectedApplications} Rejected
                  </div>
                </div>
                <div className="text-4xl opacity-20">📝</div>
              </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-purple-700">System Status</div>
                  <div className="mt-2 text-lg font-semibold text-green-600">✓ Operational</div>
                  <div className="text-xs text-purple-600 mt-2">
                    All services running
                  </div>
                </div>
                <div className="text-4xl opacity-20">⚡</div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-300 bg-white rounded-t-lg shadow-sm">
              <nav className="-mb-px flex space-x-1 px-4">
                {(['overview', 'users', 'tasks', 'applications'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 border-b-2 font-medium text-sm transition-all ${
                      activeTab === tab
                        ? 'border-primary-500 text-primary-600 bg-primary-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search users, tasks, or applications..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border bg-white text-gray-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Users</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allUsers.slice(0, 5).map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.full_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={u.role === 'admin' ? 'completed' : u.role === 'business_owner' ? 'in_progress' : 'open'} type="task" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">All Users ({filteredUsers.length})</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Instagram</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-300' :
                            u.role === 'business_owner' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                            'bg-green-100 text-green-700 border border-green-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.location || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {u.role === 'freelancer' && u.instagram_id ? (
                            <a 
                              href={`https://instagram.com/${u.instagram_id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-500 hover:text-primary-600 transition-colors"
                            >
                              @{u.instagram_id}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">All Tasks ({filteredTasks.length})</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Budget</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <Link href={`/tasks/${task.id}`} className="text-primary-600 hover:text-primary-800 transition-colors">
                            {task.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹{task.budget.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{task.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={task.status} type="task" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(task.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">All Applications ({filteredApplications.length})</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Freelancer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Instagram</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Proposed Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {app.freelancer?.full_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {app.freelancer?.instagram_id ? (
                            <a 
                              href={`https://instagram.com/${app.freelancer.instagram_id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800 transition-colors"
                            >
                              @{app.freelancer.instagram_id}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <Link href={`/tasks/${app.task_id}`} className="text-primary-600 hover:text-primary-800 transition-colors">
                            {app.task?.title || 'Task'}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹{app.proposed_price.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={app.status} type="application" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
