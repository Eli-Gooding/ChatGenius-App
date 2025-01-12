"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

interface Workspace {
  id: string
  workspace_name: string
}

interface WorkspaceSwitcherProps {
  workspaceId: string
}

export function WorkspaceSwitcher({ workspaceId }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data, error } = await supabase
          .from('workspaces')
          .select('id, workspace_name')
          .order('created_at', { ascending: false })

        if (error) {
          toast.error('Error loading workspaces: ' + error.message)
          return
        }

        const workspacesData = data || []
        setWorkspaces(workspacesData)
        const current = workspacesData.find((w: Workspace) => w.id === workspaceId)
        if (current) {
          setCurrentWorkspace(current)
        }
      } catch (error) {
        console.error('Fetch error:', error)
        if (error instanceof Error) {
          toast.error(error.message)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspaces()
  }, [workspaceId, supabase])

  const switchWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace)
    router.push(`/workspace/${workspace.id}`)
  }

  if (isLoading || !currentWorkspace) {
    return (
      <Button variant="ghost" className="w-full justify-between px-4 py-6 font-semibold text-lg text-purple-900">
        Loading...
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-4 py-6 font-semibold text-lg text-purple-900">
          {currentWorkspace.workspace_name}
          <ChevronDown className="h-4 w-4 text-purple-700" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="flex flex-col space-y-2">
          {workspaces.map((workspace: Workspace) => (
            <Button
              key={workspace.id}
              variant="ghost"
              className="justify-start"
              onClick={() => switchWorkspace(workspace)}
            >
              {workspace.workspace_name}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

