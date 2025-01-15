"use client"

import { useEffect, useState } from 'react'
import { ChatArea } from '@/components/chat-area'
import { Sidebar } from '@/components/sidebar'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AIAssistantPageProps {
  params: {
    workspaceId: string
  }
}

export default function AIAssistantPage({ params }: AIAssistantPageProps) {
  const { workspaceId } = params
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Get user's name
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_name')
        .eq('id', session.user.id)
        .single()

      if (userError) {
        toast.error('Error fetching user data')
        return
      }

      setUserName(userData.user_name)
    }

    checkAuth()
  }, [])

  return (
    <div className="flex h-screen">
      <Sidebar workspaceId={workspaceId} />
      <main className="flex-1 flex flex-col">
        <ChatArea 
          channelName="AI Assistant"
          userName={userName}
          isDirectMessage={false}
          isAIAssistant={true}
        />
      </main>
    </div>
  )
}