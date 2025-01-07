import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Message } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'

export function useMessages(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchMessages = async () => {
    if (!channelId) {
      setMessages([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      setError(error instanceof Error ? error : new Error('An error occurred'))
    } finally {
      setLoading(false)
    }
  }

  // Fetch messages when channel changes or user data updates
  useEffect(() => {
    fetchMessages()
  }, [channelId, user?.user_metadata?.avatar_url])

  // Subscribe to new messages
  useEffect(() => {
    if (!channelId) return

    const subscription = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch the complete message with user data
          const { data: messageWithUser, error } = await supabase
            .from('messages')
            .select(`
              *,
              user:profiles(*)
            `)
            .eq('id', payload.new.id)
            .single()

          if (!error && messageWithUser) {
            setMessages((prev) => [...prev, messageWithUser])
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [channelId])

  const sendMessage = async (content: string, userId: string) => {
    if (!channelId) {
      throw new Error('No channel selected')
    }

    try {
      // First insert the message
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert([
          {
            content,
            channel_id: channelId,
            user_id: userId,
          }
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Supabase insert error:', insertError)
        throw insertError
      }

      // Then fetch the complete message with user data
      const { data: messageWithUser, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('id', insertedMessage.id)
        .single()

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError)
        throw fetchError
      }

      // Update the messages state immediately
      setMessages(prev => [...prev, messageWithUser])
      
      return messageWithUser
    } catch (error) {
      const errorMessage = `Failed to send message in channel ${channelId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('Full error:', error)
      setError(new Error(errorMessage))
      throw error
    }
  }

  return { messages, loading, error, sendMessage }
} 