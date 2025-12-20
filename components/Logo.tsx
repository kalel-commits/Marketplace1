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
      <div className={`flex items-center ${sizeClasses[size]} font-bold`}>
        <span className="text-primary-500">&lt;</span>
        <span className="text-gray-900">▶</span>
        <span className="text-primary-500">&gt;&gt;</span>
      </div>
      
      {/* Brand Name */}
      <div className="flex flex-col">
        <span className={`${sizeClasses[size]} font-bold text-gray-900 group-hover:text-primary-500 transition-colors`}>
          Skilvo
        </span>
        {showTagline && (
          <span className="text-xs text-gray-600 font-normal">
            Connecting Talent & Projects
          </span>
        )}
      </div>
    </Link>
  )
}

