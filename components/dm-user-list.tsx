"use client"

import { useState, useEffect } from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  user_name: string
  avatar_url: string | null
}

interface DMUserListProps {
  workspaceId: string
  onClose: () => void
}

export function DMUserList({ workspaceId, onClose }: DMUserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchWorkspaceUsers()
  }, [workspaceId])

  const fetchWorkspaceUsers = async () => {
    try {
      setIsLoading(true)
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please sign in to view users')
        return
      }

      // Get all users in the workspace
      const { data, error } = await supabase
        .from('users')
        .select('id, user_name, avatar_url')
        .neq('id', session.user.id) // Exclude current user
        .order('user_name')

      if (error) {
        toast.error('Error loading users: ' + error.message)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Fetch error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = async (userId: string) => {
    try {
      setIsLoading(true)
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please sign in to create DMs')
        return
      }

      // Call the function to get or create DM channel
      const { data, error } = await supabase
        .rpc('get_or_create_dm_channel', {
          user1_id: session.user.id,
          user2_id: userId,
          workspace_id: workspaceId
        })

      if (error) {
        toast.error('Error creating DM: ' + error.message)
        return
      }

      // Navigate to the DM channel
      router.push(`/workspace/${workspaceId}/channel/${data}`)
      onClose()
    } catch (error) {
      console.error('DM creation error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollArea className="h-72">
      <div className="flex flex-col space-y-2">
        {isLoading ? (
          <div className="text-center text-sm text-purple-700 py-2">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center text-sm text-purple-700 py-2">No users found</div>
        ) : (
          users.map((user) => (
            <Button
              key={user.id}
              variant="ghost"
              className="justify-start"
              onClick={() => handleUserSelect(user.id)}
              disabled={isLoading}
            >
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>{user.user_name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              {user.user_name}
            </Button>
          ))
        )}
      </div>
    </ScrollArea>
  )
} 