"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Hash, ChevronDown, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreateChannelDialog } from './create-channel-dialog'
import { supabase } from '@/lib/supabase'

interface Channel {
  id: string
  channel_name: string
}

const directMessages = ['User 1', 'User 2', 'User 3', 'User 4', 'User 5']

export function Sidebar() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)

  useEffect(() => {
    fetchChannels()
    
    // Subscribe to channel changes
    const channel = supabase
      .channel('public:channels')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'channels' 
        }, 
        () => {
          fetchChannels()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id, channel_name')
        .order('channel_name')

      if (error) throw error
      setChannels(data || [])
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  return (
    <div className="w-64 bg-purple-100 flex flex-col border-r">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg text-purple-900">Workspace</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-700">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          <nav className="space-y-2">
          </nav>
          <div className="mt-4">
            <div className="flex items-center justify-between px-2 py-2">
              <h3 className="text-sm font-semibold text-purple-700">Channels</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-purple-700"
                onClick={() => setIsCreateChannelOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <nav className="space-y-1">
              {channels.map((channel) => (
                <Button key={channel.id} variant="ghost" className="w-full justify-start text-purple-700" asChild>
                  <Link href={`/channel/${channel.channel_name}`}>
                    <Hash className="mr-2 h-4 w-4" />
                    {channel.channel_name}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between px-2 py-2">
              <h3 className="text-sm font-semibold text-purple-700">Direct Messages</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <nav className="space-y-1">
              {directMessages.map((user) => (
                <Button key={user} variant="ghost" className="w-full justify-start text-purple-700" asChild>
                  <Link href={`/dm/${encodeURIComponent(user)}`}>
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-2" />
                    {user}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start text-purple-700">
          <Avatar className="w-6 h-6 mr-2">
            <AvatarImage src="/placeholder.svg" alt="Profile" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          Profile
        </Button>
      </div>

      <CreateChannelDialog 
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        onChannelCreated={fetchChannels}
      />
    </div>
  )
}

