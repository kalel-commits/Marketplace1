'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { tasks, Task } from '@/lib/tasks'
import Navbar from '@/components/Navbar'
import { CATEGORIES, SORT_OPTIONS } from '@/lib/constants'
import { TaskCardSkeleton } from '@/components/ui/LoadingSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import StatusBadge from '@/components/ui/StatusBadge'
import Card from '@/components/ui/Card'

export default function TasksPage() {
  const [taskList, setTaskList] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    location: '',
  })
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    loadTasks()
  }, [filters])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const data = await tasks.getTasks({
        status: 'open',
        ...(filters.category && { category: filters.category }),
        ...(filters.location && { location: filters.location }),
      })
      setTaskList(data)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...taskList]

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.category.toLowerCase().includes(query) ||
          task.location.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'budget_high':
          return b.budget - a.budget
        case 'budget_low':
          return a.budget - b.budget
        default:
          return 0
      }
    })

    return filtered
  }, [taskList, searchQuery, sortBy])

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Browse Tasks</h1>
            <div className="text-sm text-gray-600">
              {!loading && `${filteredAndSortedTasks.length} task${filteredAndSortedTasks.length !== 1 ? 's' : ''} found`}
            </div>
          </div>

          <Card className="p-6 mb-6">
            <div className="space-y-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Tasks
                </label>
                <input
                  id="search"
                  type="text"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-gray-900"
                  placeholder="Search by title, description, category, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters and Sort */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-gray-900"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-gray-900"
                    placeholder="Filter by location..."
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    id="sort"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border bg-white text-gray-900"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <TaskCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <Card>
              <EmptyState
                title="No tasks found"
                description={
                  searchQuery || filters.category || filters.location
                    ? "Try adjusting your search or filters to find more tasks."
                    : "There are no open tasks available at the moment. Check back later!"
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block"
                >
                  <Card hover className="p-6 h-full">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                        {task.title}
                      </h3>
                      <StatusBadge status={task.status} type="task" />
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 text-xs font-medium bg-primary-900/50 text-primary-300 rounded border border-primary-700">
                          {task.category}
                        </span>
                        <span className="text-gray-500">📍 {task.location}</span>
                      </div>
                      <span className="font-semibold text-primary-500">₹{task.budget.toLocaleString()}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

