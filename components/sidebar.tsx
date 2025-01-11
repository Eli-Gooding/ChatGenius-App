import Link from 'next/link'
import { useState } from 'react'
import { Hash, ChevronDown, Plus, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ProfilePopover } from "./profile-popover"
import { WorkspaceSwitcher } from "./workspace-switcher"

const channels = ['general', 'random', 'development']
const allUsers = ['User 1', 'User 2', 'User 3', 'User 4', 'User 5', 'User 6', 'User 7', 'User 8']

interface SidebarProps {
  workspaceId: string
}

export function Sidebar({ workspaceId }: SidebarProps) {
  const [directMessages, setDirectMessages] = useState(['User 1', 'User 2', 'User 3'])

  const addDirectMessage = (user: string) => {
    if (!directMessages.includes(user)) {
      setDirectMessages([...directMessages, user])
    }
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
                    <Button variant="ghost" className="justify-start">
                      <Hash className="mr-2 h-4 w-4" />
                      Join Channel
                    </Button>
                    <Button variant="ghost" className="justify-start">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Channel
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <nav className="space-y-1">
              {channels.map((channel) => (
                <Button key={channel} variant="ghost" className="w-full justify-start text-purple-700" asChild>
                  <Link href={`/workspace/${workspaceId}/channel/${channel}`}>
                    <Hash className="mr-2 h-4 w-4" />
                    {channel}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between px-2 py-2">
              <h3 className="text-sm font-semibold text-purple-700">Direct Messages</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <ScrollArea className="h-72">
                    <div className="flex flex-col space-y-2">
                      {allUsers.map((user) => (
                        <Button key={user} variant="ghost" className="justify-start" onClick={() => addDirectMessage(user)}>
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                          {user}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
            <nav className="space-y-1">
              {directMessages.map((user) => (
                <Button key={user} variant="ghost" className="w-full justify-start text-purple-700" asChild>
                  <Link href={`/workspace/${workspaceId}/dm/${encodeURIComponent(user)}`}>
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
        <ProfilePopover />
      </div>
    </div>
  )
}

