import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const workspaces = [
  { id: '1', name: 'Acme Corp' },
  { id: '2', name: 'Startup Inc' },
  { id: '3', name: 'Tech Innovators' },
]

interface WorkspaceSwitcherProps {
  workspaceId: string
}

export function WorkspaceSwitcher({ workspaceId }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const [currentWorkspace, setCurrentWorkspace] = useState(
    workspaces.find(w => w.id === workspaceId) || workspaces[0]
  )

  const switchWorkspace = (workspace: typeof workspaces[0]) => {
    setCurrentWorkspace(workspace)
    router.push(`/workspace/${workspace.id}`)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-4 py-6 font-semibold text-lg text-purple-900">
          {currentWorkspace.name}
          <ChevronDown className="h-4 w-4 text-purple-700" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="flex flex-col space-y-2">
          {workspaces.map((workspace) => (
            <Button
              key={workspace.id}
              variant="ghost"
              className="justify-start"
              onClick={() => switchWorkspace(workspace)}
            >
              {workspace.name}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

