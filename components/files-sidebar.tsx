import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { X, FileText, Image, FileArchive, Upload, Download } from 'lucide-react'
import { useCallback, useRef, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from "@/components/ui/use-toast"

interface FilesSidebarProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  workspaceId: string
}

interface File {
  id: string
  file_name: string
  file_size: number
  mime_type: string
  storage_path: string
  user_id: string
  created_at: string
}

export function FilesSidebar({ isOpen, onClose, channelId, workspaceId }: FilesSidebarProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    console.log('FilesSidebar props:', { isOpen, channelId, workspaceId })
  }, [isOpen, channelId, workspaceId])

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('files')
        .select(`
          id,
          file_name,
          file_size,
          mime_type,
          storage_path,
          user_id,
          created_at
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [channelId, supabase, toast])

  useEffect(() => {
    if (isOpen && channelId) {
      fetchFiles()
    }
  }, [isOpen, channelId, fetchFiles])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Enhanced debug logging
    console.log('File upload triggered with props:', {
      channelId,
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    })

    // Check for required channelId
    if (!channelId) {
      const error = 'Channel ID is required for file upload'
      console.error(error, { channelId })
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Auth error:', userError)
        throw userError
      }
      if (!user) throw new Error('Not authenticated')

      // Create a file path that matches the storage policy
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${channelId}/${fileName}`

      console.log('Attempting to upload file:', {
        bucket: 'channel-files',
        path: filePath,
        size: file.size,
        type: file.type,
        userId: user.id,
        channelId
      })

      // First check if we have access to the bucket
      const { data: bucketData, error: bucketError } = await supabase.storage
        .from('channel-files')
        .list(channelId)

      if (bucketError) {
        console.error('Bucket access error:', bucketError)
        throw bucketError
      }

      console.log('Bucket access successful:', bucketData)

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('channel-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', uploadData)

      // Save file metadata to the database with the channel context
      const { error: dbError, data: dbData } = await supabase
        .from('files')
        .insert({
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: filePath,
          channel_id: channelId,
          user_id: user.id
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database insert error:', dbError)
        // If database insert fails, we should clean up the uploaded file
        await supabase.storage
          .from('channel-files')
          .remove([filePath])
        throw dbError
      }

      console.log('Database insert successful:', dbData)

      // Process PDF files for vector storage
      if (file.type === 'application/pdf') {
        try {
          const response = await fetch('/api/files/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileId: dbData.id
            })
          });

          if (!response.ok) {
            console.error('PDF processing failed:', await response.json());
            // Don't throw error here - we still want to show success for upload
          } else {
            console.log('PDF processed successfully:', await response.json());
          }
        } catch (error) {
          console.error('Error processing PDF:', error);
          // Don't throw error - upload was still successful
        }
      }

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh the file list
      fetchFiles()

      toast({
        title: "Success",
        description: "File uploaded successfully.",
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [channelId, workspaceId, supabase, fetchFiles, toast])

  const handleDownload = useCallback(async (file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from('channel-files')
        .download(file.storage_path)

      if (error) throw error

      // Create a download link
      const url = window.URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading file:', error)
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      })
    }
  }, [supabase, toast])

  const getFileType = (mimeType: string): 'document' | 'image' | 'archive' => {
    if (mimeType.startsWith('image/')) return 'image'
    if (['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'].includes(mimeType)) return 'archive'
    return 'document'
  }

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Files</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b border-gray-200">
        <Button 
          onClick={handleUploadClick}
          className="w-full flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          <Upload className="h-4 w-4" />
          {isLoading ? 'Uploading...' : 'Upload File'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {files.map((file) => (
            <div key={file.id} className="flex items-start space-x-3 group">
              {getFileType(file.mime_type) === 'document' && <FileText className="h-5 w-5 text-blue-500" />}
              {getFileType(file.mime_type) === 'image' && <Image className="h-5 w-5 text-green-500" />}
              {getFileType(file.mime_type) === 'archive' && <FileArchive className="h-5 w-5 text-yellow-500" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.file_name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDownload(file)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

