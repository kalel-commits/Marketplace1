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
        <div className="min-h-screen bg-black py-8">
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
      <div className="min-h-screen bg-black py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <Button onClick={loadData} variant="secondary">
              Refresh Data
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-400">Total Users</div>
              <div className="mt-2 text-3xl font-bold text-primary-400">{stats.totalUsers}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.businessOwners} Business Owners, {stats.freelancers} Freelancers
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-400">Total Tasks</div>
              <div className="mt-2 text-3xl font-bold text-blue-400">{stats.totalTasks}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.openTasks} Open, {stats.inProgressTasks} In Progress, {stats.completedTasks} Completed
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-400">Total Applications</div>
              <div className="mt-2 text-3xl font-bold text-green-400">{stats.totalApplications}</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.pendingApplications} Pending, {stats.acceptedApplications} Accepted, {stats.rejectedApplications} Rejected
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-400">System Status</div>
              <div className="mt-2 text-sm text-green-400 font-semibold">All Systems Operational</div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-800">
              <nav className="-mb-px flex space-x-8">
                {(['overview', 'users', 'tasks', 'applications'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-primary-500 text-primary-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
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
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-md border-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-gray-800 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Recent Users</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-800">
                      {allUsers.slice(0, 5).map((u) => (
                        <tr key={u.id} className="hover:bg-gray-800 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{u.full_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={u.role === 'admin' ? 'completed' : u.role === 'business_owner' ? 'in_progress' : 'open'} type="task" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
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
              <h2 className="text-xl font-bold text-white mb-4">All Users ({filteredUsers.length})</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Instagram</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900 divide-y divide-gray-800">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{u.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{u.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${
                            u.role === 'admin' ? 'bg-purple-900/50 text-purple-300 border border-purple-700' :
                            u.role === 'business_owner' ? 'bg-blue-900/50 text-blue-300 border border-blue-700' :
                            'bg-green-900/50 text-green-300 border border-green-700'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{u.location || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {u.role === 'freelancer' && u.instagram_id ? (
                            <a 
                              href={`https://instagram.com/${u.instagram_id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-400 hover:text-primary-300 transition-colors"
                            >
                              @{u.instagram_id}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
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
              <h2 className="text-xl font-bold text-white mb-4">All Tasks ({filteredTasks.length})</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Budget</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900 divide-y divide-gray-800">
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          <Link href={`/tasks/${task.id}`} className="text-primary-400 hover:text-primary-300 transition-colors">
                            {task.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{task.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">₹{task.budget.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{task.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={task.status} type="task" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
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
              <h2 className="text-xl font-bold text-white mb-4">All Applications ({filteredApplications.length})</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Freelancer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Instagram</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Proposed Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900 divide-y divide-gray-800">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {app.freelancer?.full_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {app.freelancer?.instagram_id ? (
                            <a 
                              href={`https://instagram.com/${app.freelancer.instagram_id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary-400 hover:text-primary-300 transition-colors"
                            >
                              @{app.freelancer.instagram_id}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          <Link href={`/tasks/${app.task_id}`} className="text-primary-400 hover:text-primary-300 transition-colors">
                            {app.task?.title || 'Task'}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">₹{app.proposed_price.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={app.status} type="application" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
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
