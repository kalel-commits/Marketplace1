import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'
import { db, Task, Application, User, Notification } from './firebase'

// Re-export types for convenience
export type { Task, Application, User }

export const tasks = {
  async createTask(data: {
    title: string
    description: string
    category: string
    budget: number
    location: string
    business_owner_id: string
  }) {
    if (!db) throw new Error('Firebase not initialized')
    
    const taskData = {
      ...data,
      status: 'open' as const,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, 'tasks'), taskData)
    const taskDoc = await getDoc(docRef)
    
    const newTask = {
      id: docRef.id,
      ...taskData,
      created_at: taskData.created_at.toDate().toISOString(),
      updated_at: taskData.updated_at.toDate().toISOString(),
    } as Task

    // Notify all freelancers about the new task
    try {
      const freelancersSnapshot = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'freelancer'))
      )
      
      const notifications = freelancersSnapshot.docs.map((freelancerDoc) => ({
        user_id: freelancerDoc.id,
        type: 'new_task' as const,
        title: 'New Task Available',
        message: `A new task "${data.title}" has been posted. Budget: ₹${data.budget.toLocaleString()}`,
        task_id: docRef.id,
        read: false,
        created_at: Timestamp.now(),
      }))

      // Create notifications in batch (Firestore allows up to 500 operations per batch)
      // For simplicity, we'll create them individually (can be optimized later)
      for (const notification of notifications) {
        await addDoc(collection(db, 'notifications'), notification)
      }
    } catch (error) {
      // Don't fail task creation if notification fails
      console.error('Failed to create notifications:', error)
    }
    
    return newTask
  },

  async getTasks(filters?: {
    category?: string
    location?: string
    status?: string
    business_owner_id?: string
  }) {
    if (!db) throw new Error('Firebase not initialized')
    
    // Get all tasks and filter client-side to avoid composite index requirements
    // This is fine for MVP with reasonable data volumes
    let q = query(collection(db, 'tasks'), orderBy('created_at', 'desc'))

    const querySnapshot = await getDocs(q)
    const tasksList: Task[] = []

    for (const taskDoc of querySnapshot.docs) {
      const taskData = taskDoc.data()
      
      // Apply all filters client-side to avoid composite index requirements
      if (filters?.business_owner_id && taskData.business_owner_id !== filters.business_owner_id) {
        continue
      }
      if (filters?.category && taskData.category !== filters.category) {
        continue
      }
      if (filters?.status && taskData.status !== filters.status) {
        continue
      }
      if (filters?.location && !taskData.location.toLowerCase().includes(filters.location.toLowerCase())) {
        continue
      }

      // Fetch business owner if needed
      let businessOwner: User | undefined
      if (taskData.business_owner_id) {
        try {
          const ownerDoc = await getDoc(doc(db, 'users', taskData.business_owner_id))
          if (ownerDoc.exists()) {
            businessOwner = {
              id: ownerDoc.id,
              ...ownerDoc.data(),
              created_at: ownerDoc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            } as User
          }
        } catch (error) {
          console.error('Error fetching business owner:', error)
        }
      }

      tasksList.push({
        id: taskDoc.id,
        ...taskData,
        created_at: taskData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: taskData.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        business_owner: businessOwner,
      } as Task)
    }

    return tasksList
  },

  async getTaskById(id: string) {
    if (!db) throw new Error('Firebase not initialized')
    
    const taskDoc = await getDoc(doc(db, 'tasks', id))
    if (!taskDoc.exists()) {
      throw new Error('Task not found')
    }

    const taskData = taskDoc.data()

    // Fetch business owner
    let businessOwner: User | undefined
    if (taskData.business_owner_id) {
      try {
        const ownerDoc = await getDoc(doc(db, 'users', taskData.business_owner_id))
        if (ownerDoc.exists()) {
          businessOwner = {
            id: ownerDoc.id,
            ...ownerDoc.data(),
            created_at: ownerDoc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          } as User
        }
      } catch (error) {
        console.error('Error fetching business owner:', error)
      }
    }

    return {
      id: taskDoc.id,
      ...taskData,
      created_at: taskData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      updated_at: taskData.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      business_owner: businessOwner,
    } as Task
  },

  async updateTaskStatus(id: string, status: Task['status']) {
    if (!db) throw new Error('Firebase not initialized')
    
    await updateDoc(doc(db, 'tasks', id), {
      status,
      updated_at: Timestamp.now(),
    })

    return this.getTaskById(id)
  },
}

export const applications = {
  async createApplication(data: {
    task_id: string
    freelancer_id: string
    proposal: string
    proposed_price: number
  }) {
    if (!db) throw new Error('Firebase not initialized')
    
    const appData = {
      ...data,
      status: 'pending' as const,
      created_at: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, 'applications'), appData)
    const appDoc = await getDoc(docRef)

    return {
      id: docRef.id,
      ...appData,
      created_at: appData.created_at.toDate().toISOString(),
    } as Application
  },

  async getApplicationsByTask(taskId: string) {
    if (!db) throw new Error('Firebase not initialized')
    
    // Get all applications and filter client-side to avoid composite index
    const q = query(collection(db, 'applications'))

    const querySnapshot = await getDocs(q)
    const applicationsList: Application[] = []

    for (const appDoc of querySnapshot.docs) {
      const appData = appDoc.data()
      
      // Filter by task_id client-side
      if (appData.task_id !== taskId) {
        continue
      }

      // Fetch freelancer
      let freelancer: User | undefined
      if (appData.freelancer_id) {
        try {
          const freelancerDoc = await getDoc(doc(db, 'users', appData.freelancer_id))
          if (freelancerDoc.exists()) {
            freelancer = {
              id: freelancerDoc.id,
              ...freelancerDoc.data(),
              created_at: freelancerDoc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            } as User
          }
        } catch (error) {
          console.error('Error fetching freelancer:', error)
        }
      }

      applicationsList.push({
        id: appDoc.id,
        ...appData,
        created_at: appData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        freelancer,
      } as Application)
    }
    
    // Sort by created_at descending
    applicationsList.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return applicationsList
  },

  async getApplicationsByFreelancer(freelancerId: string) {
    if (!db) throw new Error('Firebase not initialized')
    
    // Get all applications and filter client-side to avoid composite index
    const q = query(collection(db, 'applications'))

    const querySnapshot = await getDocs(q)
    const applicationsList: Application[] = []

    for (const appDoc of querySnapshot.docs) {
      const appData = appDoc.data()
      
      // Filter by freelancer_id client-side
      if (appData.freelancer_id !== freelancerId) {
        continue
      }

      // Fetch task
      let task: Task | undefined
      if (appData.task_id) {
        try {
          const taskDoc = await getDoc(doc(db, 'tasks', appData.task_id))
          if (taskDoc.exists()) {
            const taskData = taskDoc.data()
            task = {
              id: taskDoc.id,
              ...taskData,
              created_at: taskData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
              updated_at: taskData.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            } as Task
          }
        } catch (error) {
          console.error('Error fetching task:', error)
        }
      }

      applicationsList.push({
        id: appDoc.id,
        ...appData,
        created_at: appData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        task,
      } as Application)
    }
    
    // Sort by created_at descending
    applicationsList.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return applicationsList
  },

  async updateApplicationStatus(id: string, status: Application['status']) {
    if (!db) throw new Error('Firebase not initialized')
    
    await updateDoc(doc(db, 'applications', id), {
      status,
    })

    const appDoc = await getDoc(doc(db, 'applications', id))
    if (!appDoc.exists()) {
      throw new Error('Application not found')
    }
    
    const appData = appDoc.data()

    return {
      id: appDoc.id,
      ...appData,
      created_at: appData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as Application
  },
}
