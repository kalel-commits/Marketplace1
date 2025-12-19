import Link from 'next/link'

interface LogoProps {
  className?: string
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ className = '', showTagline = false, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <Link href="/" className={`flex items-center space-x-3 group ${className}`}>
      {/* Logo Icon */}
      <div className={`flex items-center ${sizeClasses[size]} font-bold text-white`}>
        <span className="text-primary-400">&lt;</span>
        <span className="text-white">▶</span>
        <span className="text-primary-400">&gt;&gt;</span>
      </div>
      
      {/* Brand Name */}
      <div className="flex flex-col">
        <span className={`${sizeClasses[size]} font-bold text-white group-hover:text-primary-400 transition-colors`}>
          Prolance
        </span>
        {showTagline && (
          <span className="text-xs text-gray-400 font-normal">
            Connecting Talent & Projects
          </span>
        )}
      </div>
    </Link>
  )
}

