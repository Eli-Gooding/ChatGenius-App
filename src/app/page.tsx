'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Channel } from '@/components/Channel'
import { Message } from '@/components/Message'
import { useChannels } from '@/hooks/useChannels'
import { useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileSettings } from '@/components/ProfileSettings'

// Add arrow icon component
const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z"
    />
  </svg>
)

export default function Home() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const { channels, loading: channelsLoading, createChannel } = useChannels()
  const { messages, loading: messagesLoading, sendMessage } = useMessages(selectedChannelId)
  const [messageInput, setMessageInput] = useState('')
  const [showProfileSettings, setShowProfileSettings] = useState(false)

  // Set initial channel when channels are loaded
  useEffect(() => {
    if (!channelsLoading && channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id)
    }
  }, [channelsLoading, channels, selectedChannelId])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [authLoading, user, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user || !selectedChannelId) return
    
    try {
      const result = await sendMessage(messageInput, user.id)
      console.log('Message sent:', result)
      setMessageInput('')
    } catch (error) {
      console.error('Error details:', error)
      console.error(error instanceof Error ? error.message : 'Failed to send message')
    }
  }

  const handleCreateChannel = async () => {
    const name = prompt('Enter channel name:')
    if (!name) return

    try {
      await createChannel(name)
    } catch (error) {
      console.error('Failed to create channel:', error)
    }
  }

  const selectedChannel = channels.find(c => c.id === selectedChannelId)

  if (authLoading || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r flex flex-col">
        {/* Top section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">MagicChat</h1>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
          <Button variant="primary" className="w-full" onClick={handleCreateChannel}>
            New Channel
          </Button>
        </div>

        {/* Channels section */}
        <div className="px-4 flex-1">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Channels</h2>
          <div className="space-y-1">
            {channelsLoading ? (
              <p className="text-sm text-gray-500">Loading channels...</p>
            ) : (
              channels.map((channel) => (
                <Channel
                  key={channel.id}
                  name={channel.name}
                  isActive={channel.id === selectedChannelId}
                  onClick={() => setSelectedChannelId(channel.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Bottom section with profile button */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full text-black"
            onClick={() => setShowProfileSettings(true)}
          >
            Profile Settings
          </Button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-gray-800">
        {/* Chat header */}
        <div className="h-16 border-b border-gray-700 flex items-center px-6">
          <h2 className="text-lg font-semibold text-gray-100"># {selectedChannel?.name || 'Loading...'}</h2>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {messagesLoading ? (
              <p className="text-center text-gray-300">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-gray-300">No messages yet</p>
            ) : (
              messages.map((message) => (
                <Message
                  key={message.id}
                  content={message.content}
                  sender={message.user.display_name}
                  timestamp={new Date(message.created_at)}
                  avatar={message.user.avatar_url}
                />
              ))
            )}
          </div>
        </div>

        {/* Message input */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-gray-600 bg-gray-700 p-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <Button onClick={handleSendMessage} className="px-3">
              <ArrowIcon />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Settings Modal */}
      {showProfileSettings && user && (
        <ProfileSettings
          userId={user.id}
          currentAvatar={user.user_metadata?.avatar_url}
          onClose={() => setShowProfileSettings(false)}
        />
      )}
    </div>
  )
}
