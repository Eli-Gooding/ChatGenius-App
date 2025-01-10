import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
      const supabase = createRouteHandlerClient({ cookies })
      
      // Exchange the code for a session
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      if (sessionError) throw sessionError

      // If we have a session and user, create the user record
      if (session?.user) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .single()

        // Only create user if they don't exist
        if (!existingUser) {
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: session.user.id,
                email: session.user.email,
                user_name: session.user.user_metadata.user_name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            ])
          if (insertError) throw insertError
        }
      }
    }

    // Redirect to the dashboard after successful verification and user creation
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error: any) {
    // Redirect to auth page with error message if something goes wrong
    const searchParams = new URLSearchParams()
    searchParams.set('error', error.message)
    return NextResponse.redirect(new URL(`/auth?${searchParams.toString()}`, request.url))
  }
} 