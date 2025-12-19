import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Firebase configuration - replace with your actual config from Firebase Console
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'marketplace-a0872',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

// Validate Firebase config
if (typeof window !== 'undefined' && (!firebaseConfig.apiKey || firebaseConfig.apiKey === '')) {
  console.error(
    '❌ Firebase API Key is missing!\n\n' +
    'Please create a .env.local file in the root directory with your Firebase configuration.\n' +
    'See FIREBASE_SETUP.md for detailed instructions.\n\n' +
    'Required variables:\n' +
    '- NEXT_PUBLIC_FIREBASE_API_KEY\n' +
    '- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n' +
    '- NEXT_PUBLIC_FIREBASE_PROJECT_ID\n' +
    '- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET\n' +
    '- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID\n' +
    '- NEXT_PUBLIC_FIREBASE_APP_ID'
  )
}

// Initialize Firebase (client-side only)
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined

if (typeof window !== 'undefined') {
  // Only initialize if we have a valid API key
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== '' && firebaseConfig.apiKey.startsWith('AIza')) {
    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig)
      } else {
        app = getApps()[0]
      }
      auth = getAuth(app)
      db = getFirestore(app)
      storage = getStorage(app)
    } catch (error) {
      console.error('❌ Firebase initialization error:', error)
      console.error('Please check:')
      console.error('1. Firebase Authentication is enabled in Firebase Console')
      console.error('2. Your API key is correct and has no restrictions')
      console.error('3. Firestore Database is created')
    }
  } else {
    console.error('❌ Invalid Firebase API Key. Please check your .env.local file.')
  }
}

// Export with type assertions - these will only be used client-side
export { auth, db, storage }

// Types
export type UserRole = 'business_owner' | 'freelancer' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  location?: string
  bio?: string
  instagram_id?: string
  sample_reels?: string[] // Array of video URLs for freelancers
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  category: string
  budget: number
  location: string
  business_owner_id: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  business_owner?: User
}

export interface Application {
  id: string
  task_id: string
  freelancer_id: string
  proposal: string
  proposed_price: number
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  freelancer?: User
  task?: Task
}

