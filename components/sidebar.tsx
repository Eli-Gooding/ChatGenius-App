"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Hash, ChevronDown, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ProfilePopover } from "./profile-popover"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { ChannelDialog } from "./channel-dialog"
import { DMUserList } from "./dm-user-list"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

interface Channel {
  id: string
  channel_name: string
}

interface DirectMessage {
  channel_id: string
  other_user_id: string
  other_user_name: string
  other_user_avatar_url: string | null
  is_self_dm: boolean
}

interface SidebarProps {
  workspaceId: string
}

export function Sidebar({ workspaceId }: SidebarProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [channelDialogOpen, setChannelDialogOpen] = useState(false)
  const [channelDialogMode, setChannelDialogMode] = useState<'join' | 'create'>('join')
  const [dmPopoverOpen, setDmPopoverOpen] = useState(false)
  const supabase = createClientComponentClient()

  const fetchUserChannels = async () => {
    try {
      setIsLoading(true)
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please sign in to view channels')
        return
      }

      // First get the user's channel memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('channel_id')
        .eq('user_id', session.user.id)

      if (membershipError) {
        toast.error('Error loading memberships: ' + membershipError.message)
        return
      }

      const channelIds = memberships?.map(m => m.channel_id) || []

      // Then get the channels
      const { data, error } = await supabase
        .from('channels')
        .select('id, channel_name')
        .eq('workspace_id', workspaceId)
        .in('id', channelIds)
        .eq('is_private', false)
        .order('channel_name')

      if (error) {
        toast.error('Error loading channels: ' + error.message)
        return
      }

      setChannels(data || [])
    } catch (error) {
      console.error('Fetch error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDirectMessages = async () => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please sign in to view direct messages')
        return
      }

      const { data, error } = await supabase
        .rpc('get_user_dms', {
          current_user_id: session.user.id,
          workspace_id: workspaceId
        })

      if (error) {
        toast.error('Error loading direct messages: ' + error.message)
        return
      }

      setDirectMessages(data || [])
    } catch (error) {
      console.error('DM fetch error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }
  }

  useEffect(() => {
    fetchUserChannels()
    fetchDirectMessages()
  }, [workspaceId])

  const handleChannelAction = (channelId: string) => {
    fetchUserChannels()
  }

  return (
    <div className="w-64 bg-purple-100 flex flex-col border-r">
      <WorkspaceSwitcher workspaceId={workspaceId} />
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="mt-4">
            <div className="flex items-center justify-between px-2 py-2">
              <h3 className="text-sm font-semibold text-purple-700">Channels</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={() => {
                        setChannelDialogMode('join')
                        setChannelDialogOpen(true)
                      }}
                    >
                      <Hash className="mr-2 h-4 w-4" />
                      Join Channel
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start"
                      onClick={() => {
                        setChannelDialogMode('create')
                        setChannelDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Channel
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <nav className="space-y-1">
              {isLoading ? (
                <div className="text-center text-sm text-purple-700 py-2">Loading channels...</div>
              ) : channels.length === 0 ? (
                <div className="text-center text-sm text-purple-700 py-2">No channels yet</div>
              ) : (
                channels.map((channel) => (
                  <Button key={channel.id} variant="ghost" className="w-full justify-start text-purple-700" asChild>
                    <Link href={`/workspace/${workspaceId}/channel/${channel.id}`}>
                      <Hash className="mr-2 h-4 w-4" />
                      {channel.channel_name}
                    </Link>
                  </Button>
                ))
              )}
            </nav>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between px-2 py-2">
              <h3 className="text-sm font-semibold text-purple-700">Direct Messages</h3>
              <Popover open={dmPopoverOpen} onOpenChange={setDmPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0">
                  <DMUserList workspaceId={workspaceId} onClose={() => setDmPopoverOpen(false)} />
                </PopoverContent>
              </Popover>
            </div>
            <nav className="space-y-1">
              {directMessages.map((dm) => (
                <Button key={dm.channel_id} variant="ghost" className="w-full justify-start text-purple-700" asChild>
                  <Link href={`/workspace/${workspaceId}/channel/${dm.channel_id}`}>
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-2" />
                    {dm.is_self_dm ? `${dm.other_user_name} (You)` : dm.other_user_name}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <ProfilePopover />
      </div>

      <ChannelDialog
        isOpen={channelDialogOpen}
        onClose={() => setChannelDialogOpen(false)}
        workspaceId={workspaceId}
        mode={channelDialogMode}
        onChannelAction={handleChannelAction}
      />
    </div>
  )
}

