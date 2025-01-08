import React from 'react'

interface MessageProps {
  content: string
  sender: string
  timestamp: Date
  avatar?: string
}

function formatMessage(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

export function Message({ content, sender, timestamp, avatar }: MessageProps) {
  const formattedContent = formatMessage(content)

  return (
    <div className="flex gap-3 py-2">
      <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
        {avatar ? (
          <img
            src={avatar}
            alt={`${sender}'s avatar`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg font-medium">
            {sender[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-gray-100">{sender}</span>
          <span className="text-xs text-gray-400">
            {timestamp.toLocaleTimeString()}
          </span>
        </div>
        <p 
          className="text-gray-300 mt-1"
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
      </div>
    </div>
  )
} 