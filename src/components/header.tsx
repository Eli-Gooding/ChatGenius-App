'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, HelpCircle, FileText } from 'lucide-react'
import { FilesSidebar } from "./files-sidebar"

interface HeaderProps {
  channelName?: string
  userName?: string
}

export function Header({ channelName, userName }: HeaderProps) {
  const [isFilesSidebarOpen, setIsFilesSidebarOpen] = useState(false)
  const title = channelName ? `#${channelName}` : userName

  return (
    <>
      <header className="h-12 border-b flex items-center justify-between px-4 bg-white">
        <div className="flex items-center flex-1">
          <h1 className="font-semibold text-lg mr-4">{title}</h1>
          <div className="flex-1 max-w-xl flex items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
              <Input
                placeholder="Search..."
                className="pl-8 bg-gray-50 border-gray-200 focus:border-purple-500"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 text-purple-700"
              onClick={() => setIsFilesSidebarOpen(!isFilesSidebarOpen)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Files
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-purple-700">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </header>
      <FilesSidebar isOpen={isFilesSidebarOpen} onClose={() => setIsFilesSidebarOpen(false)} />
    </>
  )
}

