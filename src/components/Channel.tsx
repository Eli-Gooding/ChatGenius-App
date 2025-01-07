import React from 'react'

interface ChannelProps {
  name: string
  isActive?: boolean
  onClick?: () => void
}

export function Channel({ name, isActive = false, onClick }: ChannelProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
        isActive
          ? 'bg-gray-200 text-gray-900'
          : 'hover:bg-gray-200/50 text-gray-700'
      }`}
    >
      <span className="text-sm"># {name}</span>
    </button>
  )
} 