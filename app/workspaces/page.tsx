"use client"

import Link from 'next/link'
import { Button } from "@/components/ui/button"

const workspaces = [
  { id: 1, name: "Acme Corp" },
  { id: 2, name: "Startup Inc" },
  { id: 3, name: "Tech Innovators" },
]

export default function WorkspacesPage() {
  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-purple-900 mb-6 text-center">Select a Workspace</h1>
        <div className="space-y-4">
          {workspaces.map((workspace) => (
            <Link key={workspace.id} href={`/workspace/${workspace.id}`} className="block w-full">
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal hover:bg-purple-100 hover:text-purple-900 hover:border-purple-300"
              >
                <span className="truncate">{workspace.name}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

