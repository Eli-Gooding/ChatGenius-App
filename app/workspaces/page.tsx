"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { PostgrestError } from '@supabase/supabase-js'

interface Workspace {
  id: string
  workspace_name: string
}

export default function WorkspacesPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [open, setOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  // Log when the client is created
  console.log('Creating Supabase client')
  const supabase = createClientComponentClient()
  console.log('Supabase client created:', supabase)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        // Check auth state first
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        console.log('Auth session:', session)
        console.log('Auth error:', authError)

        // Then fetch workspaces
        console.log('Fetching workspaces...')
        const { data, error } = await supabase
          .from('workspaces')
          .select('id, workspace_name')
          .order('created_at', { ascending: false })

        console.log('Fetch result:', { data, error })

        if (error) {
          toast.error('Error loading workspaces: ' + error.message)
          return
        }

        setWorkspaces(data || [])
      } catch (error) {
        console.error('Fetch error:', error)
        if (error instanceof Error) {
          toast.error(error.message)
        } else {
          toast.error('An unexpected error occurred')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspaces()
  }, [supabase])

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      // Log the attempt
      console.log('Attempting to create workspace:', workspaceName)

      // Check auth state first
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      console.log('Create workspace auth session:', session)
      console.log('Create workspace auth error:', authError)

      if (!session) {
        toast.error('Please sign in to create a workspace')
        return
      }

      // Create the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({ 
          workspace_name: workspaceName,
          created_by: session.user.id
        })
        .select('id')
        .single()

      console.log('Create workspace result:', { workspace, workspaceError })

      if (workspaceError) {
        toast.error('Error creating workspace: ' + workspaceError.message)
        return
      }

      setOpen(false)
      router.push(`/workspace/${workspace.id}`)
    } catch (error: any) {
      console.error('Create error:', error)
      toast.error(error.message || 'Error creating workspace')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-purple-900 mb-6 text-center">Select a Workspace</h1>
        <div className="space-y-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal hover:bg-purple-100 hover:text-purple-900 hover:border-purple-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="truncate">Create A New Workspace</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <Input
                  placeholder="Workspace name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Workspace'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {isLoading ? (
            <div className="text-center text-gray-500">Loading workspaces...</div>
          ) : workspaces.length === 0 ? (
            <div className="text-center text-gray-500">No workspaces found</div>
          ) : (
            workspaces.map((workspace) => (
              <Link key={workspace.id} href={`/workspace/${workspace.id}`} className="block w-full">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal hover:bg-purple-100 hover:text-purple-900 hover:border-purple-300"
                >
                  <span className="truncate">{workspace.workspace_name}</span>
                </Button>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

