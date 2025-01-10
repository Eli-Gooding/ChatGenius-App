import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    cookies: {
      get(name: string) {
        const cookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`))
        return cookie ? cookie.split('=')[1] : undefined
      },
      set(name: string, value: string, options: { maxAge?: number; domain?: string; path?: string; sameSite?: 'lax' | 'strict' | 'none'; secure?: boolean }) {
        document.cookie = `${name}=${value}; max-age=${options.maxAge ?? 60 * 60 * 24 * 7}; path=${options.path ?? '/'}`
      },
      remove(name: string, options?: { path?: string; domain?: string }) {
        document.cookie = `${name}=; max-age=0; path=${options?.path ?? '/'}`
      },
    }
  }
) 