import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'
import { db, Notification } from './firebase'

export const notifications = {
  async getNotificationsByUser(userId: string) {
    if (!db) throw new Error('Firebase not initialized')
    
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const notificationsList: Notification[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      notificationsList.push({
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Notification)
    })

    return notificationsList
  },

  async markAsRead(notificationId: string) {
    if (!db) throw new Error('Firebase not initialized')
    
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
    })
  },

  async markAllAsRead(userId: string) {
    if (!db) throw new Error('Firebase not initialized')
    
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      where('read', '==', false)
    )

    const querySnapshot = await getDocs(q)
    const updates = querySnapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    )

    await Promise.all(updates)
  },

  async getUnreadCount(userId: string) {
    if (!db) throw new Error('Firebase not initialized')
    
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      where('read', '==', false)
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.size
  },
}

