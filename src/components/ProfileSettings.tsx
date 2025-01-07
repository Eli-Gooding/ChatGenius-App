'use client'

import React, { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

interface ProfileSettingsProps {
  userId: string
  currentAvatar?: string
  onClose: () => void
}

export function ProfileSettings({ userId, currentAvatar, onClose }: ProfileSettingsProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refreshUser } = useAuth()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
      setUploading(true)

      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload a JPG, PNG, or GIF file')
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024 // 2MB in bytes
      if (file.size > maxSize) {
        throw new Error('Image must be less than 2MB')
      }

      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
      })

      // Upload image to Supabase Storage
      const fileExt = file.type.split('/')[1]
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      console.log('Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      console.log('Public URL:', publicUrl)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw new Error(`Profile update failed: ${updateError.message}`)
      }

      // Delete old avatar if it exists
      if (currentAvatar) {
        const oldFileName = currentAvatar.split('/').pop()
        if (oldFileName) {
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([oldFileName])
          
          if (deleteError) {
            console.error('Failed to delete old avatar:', deleteError)
          }
        }
      }

      // Refresh user data to get the new avatar URL
      await refreshUser()

      onClose()
    } catch (err) {
      console.error('Full error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile picture')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-100 mb-4">Update Profile Picture</h2>
        
        <div className="space-y-4">
          {currentAvatar && (
            <div className="flex justify-center">
              <img
                src={currentAvatar}
                alt="Current avatar"
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-100 px-4 py-2 rounded-md transition-colors"
            >
              {uploading ? 'Uploading...' : 'Choose Image'}
            </label>
            <p className="text-gray-400 text-sm text-center">
              JPG, PNG or GIF (max. 2MB)
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 