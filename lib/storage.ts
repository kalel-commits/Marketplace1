import { storage } from './firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

export const storageUtils = {
  async uploadReel(file: File, userId: string, reelIndex: number): Promise<string> {
    if (!storage) throw new Error('Firebase Storage not initialized')
    
    // Validate file size (max 50MB for videos)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      throw new Error('Video file must be less than 50MB. Please compress your video or choose a smaller file.')
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      throw new Error('Please upload a video file')
    }

    // Create a unique file path
    const fileName = `reels/${userId}/reel_${reelIndex}_${Date.now()}_${file.name}`
    const storageRef = ref(storage, fileName)

    // Upload the file
    await uploadBytes(storageRef, file)

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef)
    
    return downloadURL
  },

  async deleteReel(url: string): Promise<void> {
    if (!storage) throw new Error('Firebase Storage not initialized')
    
    try {
      // Extract the file path from the URL
      const urlObj = new URL(url)
      const path = decodeURIComponent(urlObj.pathname.split('/o/')[1]?.split('?')[0] || '')
      if (path) {
        const storageRef = ref(storage, path)
        await deleteObject(storageRef)
      }
    } catch (error) {
      console.error('Error deleting reel:', error)
      // Don't throw - it's okay if deletion fails
    }
  },
}

