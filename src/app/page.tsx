'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Channel } from '@/components/Channel'
import { Message } from '@/components/Message'
import { useChannels } from '@/hooks/useChannels'
import { useMessages } from '@/hooks/useMessages'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileSettings } from '@/components/ProfileSettings'
import { htmlToMarkdown, applyFormatting } from '@/lib/formatMessage'

export default function Home() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const { channels, loading: channelsLoading, createChannel } = useChannels()
  const { messages, loading: messagesLoading, sendMessage } = useMessages(selectedChannelId)
  const messageInputRef = useRef<HTMLDivElement>(null)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [formatting, setFormatting] = useState({
    bold: false,
    italic: false,
    underline: false
  })

  // Function to handle formatting changes
  const toggleFormatting = (type: 'bold' | 'italic' | 'underline') => {
    setFormatting(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  // Function to get the HTML content from the contenteditable div
  const getMessageContent = () => {
    const messageDiv = document.getElementById('message-input')
    return messageDiv?.innerHTML || ''
  }

  // Modified send handler
  const handleSendMessage = async () => {
    if (!messageInputRef.current || !user || !selectedChannelId) return
    
    const htmlContent = messageInputRef.current.innerHTML
    if (!htmlContent.trim()) return

    try {
      // Convert HTML to markdown before sending
      const markdownContent = htmlToMarkdown(htmlContent)
      const result = await sendMessage(markdownContent, user.id)
      console.log('Message sent:', result)
      messageInputRef.current.innerHTML = ''
    } catch (error) {
      console.error('Error details:', error)
      console.error(error instanceof Error ? error.message : 'Failed to send message')
    }
  }

  // Function to handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Function to handle formatting keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!messageInputRef.current) return

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          document.execCommand('bold', false)
          break
        case 'i':
          e.preventDefault()
          document.execCommand('italic', false)
          break
        case 'u':
          e.preventDefault()
          document.execCommand('underline', false)
          break
      }
    }
  }

  // Function to handle formatting button clicks
  const handleFormat = (command: string) => {
    document.execCommand(command, false)
    messageInputRef.current?.focus()
  }

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
            <h1 className="text-xl font-bold text-blue-500">MagicChat</h1>
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
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFormat('bold')}
                className="text-gray-300 hover:text-gray-100 font-bold"
              >
                B
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFormat('italic')}
                className="text-gray-300 hover:text-gray-100 italic"
              >
                I
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFormat('underline')}
                className="text-gray-300 hover:text-gray-100 underline"
              >
                U
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div
                id="message-input"
                contentEditable
                ref={messageInputRef}
                onKeyDown={handleKeyDown}
                onKeyPress={handleKeyPress}
                className="flex-1 rounded-md border border-gray-600 bg-gray-700 p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[2.5rem] max-h-32 overflow-y-auto"
                role="textbox"
                aria-multiline="true"
              />
              <Button onClick={handleSendMessage}>Send</Button>
            </div>
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
