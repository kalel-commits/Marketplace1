import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${hover ? 'hover:shadow-md hover:border-primary-300 transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
