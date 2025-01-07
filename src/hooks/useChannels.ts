import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Channel } from '@/types/database'

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setChannels(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()

    const subscription = supabase
      .channel('channels')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'channels',
        },
        async () => {
          await fetchChannels()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const createChannel = async (name: string, description?: string) => {
    try {
      const { error } = await supabase
        .from('channels')
        .insert([{ name, description }])

      if (error) throw error
      await fetchChannels()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create channel'))
      throw err
    }
  }

  return { channels, loading, error, createChannel }
} 