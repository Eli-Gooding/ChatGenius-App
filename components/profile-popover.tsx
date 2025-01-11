import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Camera, Pencil } from 'lucide-react'

export function ProfilePopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-purple-700">
          <Avatar className="w-6 h-6 mr-2">
            <AvatarImage src="/placeholder.svg" alt="Profile" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          Profile
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src="/placeholder.svg" alt="Profile" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              <Camera className="mr-2 h-4 w-4" />
              Add Picture
            </Button>
          </div>
          <Button variant="outline" className="justify-start">
            <Pencil className="mr-2 h-4 w-4" />
            Change Status
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

