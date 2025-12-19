'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface ReelUploadProps {
  reels: string[]
  onChange: (reels: string[]) => void
  maxReels?: number
}

export default function ReelUpload({ reels, onChange, maxReels = 3 }: ReelUploadProps) {
  const [uploading, setUploading] = useState<number | null>(null)
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url')

  const validateVideoURL = (url: string): boolean => {
    // Accept YouTube, Vimeo, Instagram, TikTok, or direct video URLs
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
      /^https?:\/\/(www\.)?vimeo\.com\/.+/,
      /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/.+/,
      /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+/,
      /^https?:\/\/.+\.(mp4|mov|webm|ogg)(\?.*)?$/i, // Direct video file URLs
    ]
    return patterns.some(pattern => pattern.test(url))
  }

  const handleURLChange = (index: number, url: string) => {
    const trimmedURL = url.trim()
    
    if (!trimmedURL) {
      const newReels = [...reels]
      newReels[index] = ''
      onChange(newReels)
      return
    }

    if (!validateVideoURL(trimmedURL)) {
      toast.error('Please enter a valid video URL (YouTube, Vimeo, Instagram, TikTok, or direct video link)')
      return
    }

    const newReels = [...reels]
    newReels[index] = trimmedURL
    onChange(newReels)
    toast.success(`Reel ${index + 1} added!`)
  }

  const getEmbedURL = (url: string): string | null => {
    // Convert YouTube URL to embed format
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
    // Convert Vimeo URL to embed format
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null
    }
    // For direct video URLs or other platforms, return as-is
    if (url.match(/\.(mp4|mov|webm|ogg)(\?.*)?$/i)) {
      return url
    }
    return null
  }

  const removeReel = (index: number) => {
    const newReels = reels.filter((_, i) => i !== index)
    // Ensure array has maxReels slots
    while (newReels.length < maxReels) {
      newReels.push('')
    }
    onChange(newReels)
    toast.success('Reel removed')
  }

  // Ensure reels array has maxReels slots
  const displayReels = [...reels]
  while (displayReels.length < maxReels) {
    displayReels.push('')
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Add {maxReels} Sample Reels *
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Share links to your best work! Paste YouTube, Vimeo, Instagram, TikTok, or direct video URLs.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayReels.map((reel, index) => (
          <div key={index} className="relative">
            {reel ? (
              <div className="relative group">
                {getEmbedURL(reel) ? (
                  <div className="w-full h-48 rounded-lg border-2 border-gray-700 overflow-hidden bg-gray-900">
                    <iframe
                      src={getEmbedURL(reel) || ''}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`Reel ${index + 1}`}
                    />
                  </div>
                ) : (
                  <video
                    src={reel}
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-700"
                    controls
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeReel(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Remove reel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Reel {index + 1}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-lg bg-gray-800/50 p-4">
                <svg className="w-10 h-10 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="mb-2 text-sm text-gray-400 text-center">
                  <span className="font-semibold">Reel {index + 1}</span>
                </p>
                <input
                  type="text"
                  placeholder="Paste video URL here..."
                  className="w-full px-3 py-2 text-sm border border-gray-700 rounded-md bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={reel}
                  onChange={(e) => handleURLChange(index, e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  YouTube, Vimeo, Instagram, TikTok, or direct link
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {reels.filter(r => r).length < maxReels && (
        <p className="text-xs text-amber-400">
          Please add all {maxReels} sample reel URLs to complete your profile.
        </p>
      )}
      
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
        <p className="text-xs text-blue-300">
          <strong>💡 Tip:</strong> You can share links from YouTube, Vimeo, Instagram Reels, TikTok, or any direct video URL. 
          Just paste the link in the field above!
        </p>
      </div>
    </div>
  )
}

