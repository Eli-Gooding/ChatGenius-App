"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Hash } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

interface Channel {
  id: string
  channel_name: string
  channel_description: string | null
  is_private: boolean
}

interface ChannelDialogProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  mode: 'join' | 'create'
  onChannelAction: (channelId: string) => void
}

export function ChannelDialog({ isOpen, onClose, workspaceId, mode, onChannelAction }: ChannelDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelName, setChannelName] = useState('')
  const [channelDescription, setChannelDescription] = useState('')
  const supabase = createClientComponentClient()

  // Fetch available public channels when dialog opens in join mode
  useEffect(() => {
    if (mode === 'join' && isOpen) {
      fetchPublicChannels()
    }
  }, [mode, isOpen, workspaceId])

  const fetchPublicChannels = async () => {
    try {
      setIsLoading(true)
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please sign in to view channels')
        return
      }

      // Get all public channels in the workspace
      const { data, error } = await supabase
        .from('channels')
        .select('id, channel_name, channel_description, is_private')
        .eq('workspace_id', workspaceId)
        .eq('is_private', false)

      if (error) {
        toast.error('Error loading channels: ' + error.message)
        return
      }

      // Filter out channels the user is already a member of
      const { data: memberships } = await supabase
        .from('memberships')
        .select('channel_id')
        .eq('user_id', session.user.id)

      const memberChannelIds = new Set((memberships || []).map(m => m.channel_id))
      const availableChannels = data?.filter(channel => !memberChannelIds.has(channel.id)) || []

      setChannels(availableChannels)
    } catch (error) {
      console.error('Fetch error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinChannel = async (channelId: string) => {
    try {
      setIsLoading(true)
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please sign in to join channels')
        return
      }

      const { error } = await supabase
        .from('memberships')
        .insert({
          channel_id: channelId,
          user_id: session.user.id,
          user_role: 'member'
        })

      if (error) {
        toast.error('Error joining channel: ' + error.message)
        return
      }

      toast.success('Successfully joined channel')
      onChannelAction(channelId)
      onClose()
    } catch (error) {
      console.error('Join error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please sign in to create channels')
        return
      }

      // Create the channel
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .insert({
          channel_name: channelName,
          channel_description: channelDescription || null,
          workspace_id: workspaceId,
          created_by: session.user.id,
          is_private: false
        })
        .select('id')
        .single()

      if (channelError) {
        toast.error('Error creating channel: ' + channelError.message)
        return
      }

      // Add creator as member
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          channel_id: channel.id,
          user_id: session.user.id,
          user_role: 'admin'
        })

      if (membershipError) {
        toast.error('Error adding you to channel: ' + membershipError.message)
        return
      }

      toast.success('Channel created successfully')
      onChannelAction(channel.id)
      onClose()
    } catch (error) {
      console.error('Create error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'join' ? 'Join a Channel' : 'Create a Channel'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'join' ? (
          <ScrollArea className="h-72">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center text-gray-500">Loading channels...</div>
              ) : channels.length === 0 ? (
                <div className="text-center text-gray-500">No channels available to join</div>
              ) : (
                channels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleJoinChannel(channel.id)}
                    disabled={isLoading}
                  >
                    <Hash className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span>{channel.channel_name}</span>
                      {channel.channel_description && (
                        <span className="text-xs text-gray-500">{channel.channel_description}</span>
                      )}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <form onSubmit={handleCreateChannel} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Channel name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                required
              />
              <Input
                placeholder="Channel description (optional)"
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Channel'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 