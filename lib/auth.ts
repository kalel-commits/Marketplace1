import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth as firebaseAuth, db, User, UserRole } from './firebase'

// Re-export User and UserRole for convenience
export type { User, UserRole }

export const authUtils = {
  async signUp(email: string, password: string, fullName: string, role: UserRole, instagramId?: string) {
    if (!firebaseAuth || !db) throw new Error('Firebase not initialized')
    
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
      const user = userCredential.user

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        full_name: fullName,
        role,
        phone: '',
        location: '',
        bio: '',
        ...(instagramId && { instagram_id: instagramId }),
        created_at: serverTimestamp(),
      })

      return userCredential
    } catch (error: any) {
      // Provide more helpful error messages
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password authentication is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method')
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters')
      } else if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address')
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection')
      }
      // Re-throw with original message for other errors
      throw error
    }
  },

  async signIn(email: string, password: string) {
    if (!firebaseAuth) throw new Error('Firebase not initialized')
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password)
    return userCredential
  },

  async signOut() {
    if (!firebaseAuth) throw new Error('Firebase not initialized')
    await firebaseSignOut(firebaseAuth)
  },

  async getCurrentUser(): Promise<User | null> {
    if (!firebaseAuth || !db) return null
    
    // Store references to avoid TypeScript issues with undefined
    const authInstance = firebaseAuth
    const dbInstance = db
    
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
        unsubscribe()
        if (!firebaseUser) {
          resolve(null)
          return
        }

        try {
          const userDoc = await getDoc(doc(dbInstance, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            resolve({
              id: firebaseUser.uid,
              ...userDoc.data(),
              created_at: userDoc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            } as User)
          } else {
            resolve(null)
          }
        } catch (error) {
          console.error('Error fetching user:', error)
          resolve(null)
        }
      })
    })
  },

  async getSession() {
    if (!firebaseAuth) return null
    
    // Store reference to avoid TypeScript issues with undefined
    const authInstance = firebaseAuth
    
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        unsubscribe()
        resolve(user ? { user } : null)
      })
    })
  },
}

// Keep the old export name for compatibility
export const auth = authUtils