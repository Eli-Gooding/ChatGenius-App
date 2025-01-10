'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface User {
  user_name: string
  email: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (!session) {
          router.push('/auth')
          return
        }

        // Get the user data from our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_name, email')
          .eq('id', session.user.id)
          .single()

        if (userError) throw userError

        setUser(userData)
      } catch (error: any) {
        console.error('Error:', error.message)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to ChatGenius</h1>
        {user && (
          <div className="mb-4">
            <p className="text-xl text-gray-800">Welcome back, {user.user_name}!</p>
            <p className="text-gray-600">{user.email}</p>
          </div>
        )}
        <p className="text-gray-600">Your dashboard is coming soon!</p>
      </div>
    </div>
  )
} 