import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth as firebaseAuth, db, User, UserRole } from './firebase'

// Re-export User and UserRole for convenience
export type { User, UserRole }

export const authUtils = {
  async signUp(email: string, password: string, fullName: string, role: UserRole, instagramId?: string, sampleReels?: string[]) {
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
        ...(role === 'freelancer' && sampleReels && sampleReels.filter(r => r).length > 0 && { sample_reels: sampleReels.filter(r => r) }),
        created_at: serverTimestamp(),
      })

      return userCredential
    } catch (error: any) {
      // Log the full error for debugging
      console.error('Firebase Auth Error:', error)
      console.error('Error Code:', error.code)
      console.error('Error Message:', error.message)
      
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
      } else if (error.code === 'auth/api-key-not-valid') {
        throw new Error('API key is not valid. Please check your .env.local file and ensure the Identity Toolkit API is enabled in Google Cloud Console.')
      }
      // Re-throw with original message for other errors
      throw new Error(error.message || `Authentication failed: ${error.code || 'Unknown error'}`)
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

  async resetPassword(email: string) {
    if (!firebaseAuth) throw new Error('Firebase not initialized')
    await sendPasswordResetEmail(firebaseAuth, email)
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