"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, FileText } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import { useState } from "react"
import { useParams } from "next/navigation"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  // Only show mobile menu if we have a workspace context
  if (!workspaceId) {
    return (
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="ml-auto flex items-center space-x-4">
            {/* Other header items can go here */}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar workspaceId={workspaceId} />
          </SheetContent>
        </Sheet>
        <div className="ml-auto flex items-center space-x-4">
          {/* Other header items can go here */}
        </div>
      </div>
    </div>
  )
}

