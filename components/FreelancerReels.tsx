'use client'

interface FreelancerReelsProps {
  reels?: string[]
  freelancerName?: string
}

export default function FreelancerReels({ reels, freelancerName }: FreelancerReelsProps) {
  if (!reels || reels.length === 0) {
    return null
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
    // For direct video URLs, return as-is
    if (url.match(/\.(mp4|mov|webm|ogg)(\?.*)?$/i)) {
      return url
    }
    return null
  }

  const getPlatformName = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube'
    if (url.includes('vimeo.com')) return 'Vimeo'
    if (url.includes('instagram.com')) return 'Instagram'
    if (url.includes('tiktok.com')) return 'TikTok'
    return 'Video'
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        {freelancerName ? `${freelancerName}'s Sample Reels` : 'Sample Reels'}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {reels.map((reel, index) => {
          const embedURL = getEmbedURL(reel)
          return (
            <div key={index} className="relative group">
              {embedURL ? (
                <div className="w-full h-40 rounded-lg border border-gray-300 overflow-hidden bg-gray-100">
                  <iframe
                    src={embedURL}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Reel ${index + 1}`}
                  />
                </div>
              ) : (
                <div className="w-full h-40 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center">
                  <a
                    href={reel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                  >
                    Watch on {getPlatformName(reel)} →
                  </a>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Reel {index + 1}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-gray-600 mt-2">
        Watch these sample reels to see their editing style and quality
      </p>
    </div>
  )
}

