"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ChatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('No session found in chat page, redirecting to auth')
        router.push('/auth')
      } else {
        setLoading(false)
      }
    }
    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <main className="flex-1 flex flex-col relative">
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold">Welcome to Chat!</h1>
          <p className="text-gray-600">Your chat interface will be here.</p>
        </div>
      </main>
    </div>
  )
} 