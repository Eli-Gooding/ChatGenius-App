import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { X, FileText, Image, FileArchive } from 'lucide-react'

interface FilesSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface File {
  id: string
  name: string
  type: 'document' | 'image' | 'archive'
  uploadedBy: string
  uploadedAt: string
}

const mockFiles: File[] = [
  { id: '1', name: 'Project_Plan.docx', type: 'document', uploadedBy: 'User 1', uploadedAt: '2023-06-15 10:30 AM' },
  { id: '2', name: 'Logo_Design.png', type: 'image', uploadedBy: 'User 2', uploadedAt: '2023-06-14 2:45 PM' },
  { id: '3', name: 'Source_Code.zip', type: 'archive', uploadedBy: 'User 3', uploadedAt: '2023-06-13 9:15 AM' },
  { id: '4', name: 'Meeting_Notes.pdf', type: 'document', uploadedBy: 'User 1', uploadedAt: '2023-06-12 4:00 PM' },
  { id: '5', name: 'Presentation.pptx', type: 'document', uploadedBy: 'User 2', uploadedAt: '2023-06-11 11:20 AM' },
]

export function FilesSidebar({ isOpen, onClose }: FilesSidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Files</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {mockFiles.map((file) => (
            <div key={file.id} className="flex items-start space-x-3">
              {file.type === 'document' && <FileText className="h-5 w-5 text-blue-500" />}
              {file.type === 'image' && <Image className="h-5 w-5 text-green-500" />}
              {file.type === 'archive' && <FileArchive className="h-5 w-5 text-yellow-500" />}
              <div className="flex-1">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">
                  Uploaded by {file.uploadedBy} on {file.uploadedAt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

