'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { tasks } from '@/lib/tasks'
import { applications } from '@/lib/tasks'
import { auth } from '@/lib/auth'
import { User, Task, Application } from '@/lib/firebase'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FreelancerReels from '@/components/FreelancerReels'

export default function TaskDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [applicationsList, setApplicationsList] = useState<Application[]>([])
  const [userApplication, setUserApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [proposal, setProposal] = useState('')
  const [proposedPrice, setProposedPrice] = useState('')
  const [applying, setApplying] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    action: 'accept' | 'reject' | null
    applicationId: string | null
  }>({ isOpen: false, action: null, applicationId: null })

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const currentUser = await auth.getCurrentUser()
      setUser(currentUser)

      const taskData = await tasks.getTaskById(params.id as string)
      setTask(taskData)

      // Load applications if user is the business owner
      if (currentUser?.role === 'business_owner' && currentUser.id === taskData.business_owner_id) {
        try {
          const apps = await applications.getApplicationsByTask(taskData.id)
          setApplicationsList(apps)
        } catch (error) {
          console.error('Error loading applications:', error)
          toast.error('Failed to load applications')
        }
      }

      // Check if freelancer already applied
      if (currentUser?.role === 'freelancer') {
        try {
          const userApps = await applications.getApplicationsByFreelancer(currentUser.id)
          const existingApp = userApps.find((app) => app.task_id === taskData.id)
          if (existingApp) {
            setUserApplication(existingApp)
          }
        } catch (error) {
          console.error('Error checking user application:', error)
        }
      }
    } catch (error) {
      console.error('Failed to load task:', error)
      toast.error('Failed to load task')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== 'freelancer') {
      toast.error('Only freelancers can apply to tasks')
      return
    }

    // Validation
    if (!proposal.trim()) {
      toast.error('Please provide a proposal')
      return
    }

    const price = parseFloat(proposedPrice)
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    setApplying(true)
    try {
      await applications.createApplication({
        task_id: task!.id,
        freelancer_id: user.id,
        proposal: proposal.trim(),
        proposed_price: price,
      })
      toast.success('Application submitted successfully!')
      setShowApplyForm(false)
      setProposal('')
      setProposedPrice('')
      await loadData() // Reload to show the application
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit application')
    } finally {
      setApplying(false)
    }
  }

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    try {
      const status = action === 'accept' ? 'accepted' : 'rejected'
      await applications.updateApplicationStatus(applicationId, status)
      await loadData()
      toast.success(`Application ${action === 'accept' ? 'accepted' : 'rejected'} successfully`)
      
      // If accepting, update task status to in_progress
      if (action === 'accept' && task) {
        await tasks.updateTaskStatus(task.id, 'in_progress')
        await loadData()
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} application`)
    }
  }

  const handleWhatsApp = (phone?: string) => {
    if (!phone) {
      toast.error('Phone number not available')
      return
    }
    const message = encodeURIComponent(`Hi! I'm interested in discussing the task: ${task?.title}`)
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank')
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </>
    )
  }

  if (!task) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600">Task not found</p>
        </div>
      </>
    )
  }

  // Calculate derived values after early returns
  const isOwner = user?.id === task.business_owner_id
  const canApply = user?.role === 'freelancer' && !isOwner && !userApplication && task.status === 'open'
  const hasApplied = !!userApplication

  return (
    <>
      <Navbar />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.action === 'accept' ? 'Accept Application' : 'Reject Application'}
        message={
          confirmDialog.action === 'accept'
            ? 'Are you sure you want to accept this application? The task will be marked as in progress.'
            : 'Are you sure you want to reject this application? This action cannot be undone.'
        }
        confirmLabel={confirmDialog.action === 'accept' ? 'Accept' : 'Reject'}
        variant={confirmDialog.action === 'accept' ? 'primary' : 'danger'}
        onConfirm={() => {
          if (confirmDialog.applicationId && confirmDialog.action) {
            handleApplicationAction(confirmDialog.applicationId, confirmDialog.action)
          }
          setConfirmDialog({ isOpen: false, action: null, applicationId: null })
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, action: null, applicationId: null })}
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/tasks"
            className="text-primary-500 hover:text-primary-600 mb-4 inline-block transition-colors"
          >
            ← Back to tasks
          </Link>

          <Card className="p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
                  <StatusBadge status={task.status} type="task" />
                </div>
                <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600">
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-medium border border-primary-300">
                    {task.category}
                  </span>
                  <span>📍 {task.location}</span>
                  <span className="font-semibold text-primary-500">₹{task.budget.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>

            {task.business_owner && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Posted by</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{task.business_owner.full_name}</p>
                    {task.business_owner.location && (
                      <p className="text-sm text-gray-600">📍 {task.business_owner.location}</p>
                    )}
                  </div>
                  {task.business_owner.phone && (
                    <button
                      onClick={() => handleWhatsApp(task.business_owner?.phone)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 flex items-center space-x-2 transition-colors"
                    >
                      <span>💬</span>
                      <span>Contact via WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {hasApplied && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700 font-medium mb-2">You've already applied to this task</p>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Your Proposal:</strong> {userApplication?.proposal}</p>
                    <p><strong>Your Proposed Price:</strong> ₹{userApplication?.proposed_price.toLocaleString()}</p>
                    <div className="mt-2">
                      <StatusBadge status={userApplication.status} type="application" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {canApply && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {!showApplyForm ? (
                  <Button
                    onClick={() => setShowApplyForm(true)}
                    className="w-full"
                  >
                    Apply to this Task
                  </Button>
                ) : (
                  <form onSubmit={handleApply} className="space-y-4">
                    <div>
                      <label htmlFor="proposal" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Proposal *
                      </label>
                      <textarea
                        id="proposal"
                        required
                        rows={4}
                        minLength={20}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-gray-900"
                        placeholder="Explain why you're the right fit for this task (minimum 20 characters)..."
                        value={proposal}
                        onChange={(e) => setProposal(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">{proposal.length}/20 characters minimum</p>
                    </div>
                    <div>
                      <label htmlFor="proposedPrice" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Proposed Price (₹) *
                      </label>
                      <input
                        id="proposedPrice"
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-gray-900"
                        placeholder="5000"
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(e.target.value)}
                      />
                    </div>
                    <div className="flex space-x-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowApplyForm(false)
                          setProposal('')
                          setProposedPrice('')
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        isLoading={applying}
                        className="flex-1"
                      >
                        Submit Application
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </Card>

          {isOwner && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Applications ({applicationsList.length})
              </h2>
              {applicationsList.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No applications yet. Applications will appear here when freelancers apply to this task.
                </p>
              ) : (
                <div className="space-y-4">
                  {applicationsList.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {app.freelancer?.full_name || 'Unknown'}
                          </p>
                          {app.freelancer?.location && (
                            <p className="text-sm text-gray-600">📍 {app.freelancer.location}</p>
                          )}
                          {app.freelancer?.instagram_id && (
                            <p className="text-sm text-gray-600 mt-1">
                              📷{' '}
                              <a 
                                href={`https://instagram.com/${app.freelancer.instagram_id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary-500 hover:text-primary-600 transition-colors"
                              >
                                @{app.freelancer.instagram_id}
                              </a>
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary-500">₹{app.proposed_price.toLocaleString()}</p>
                          <StatusBadge status={app.status} type="application" />
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{app.proposal}</p>
                      
                      {/* Display Freelancer Reels */}
                      {app.freelancer?.sample_reels && app.freelancer.sample_reels.length > 0 && (
                        <FreelancerReels 
                          reels={app.freelancer.sample_reels} 
                          freelancerName={app.freelancer.full_name}
                        />
                      )}
                      
                      <div className="flex items-center space-x-2 mt-4">
                        {app.freelancer?.phone && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleWhatsApp(app.freelancer?.phone)}
                          >
                            💬 WhatsApp
                          </Button>
                        )}
                        {app.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => setConfirmDialog({
                                isOpen: true,
                                action: 'accept',
                                applicationId: app.id,
                              })}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setConfirmDialog({
                                isOpen: true,
                                action: 'reject',
                                applicationId: app.id,
                              })}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

