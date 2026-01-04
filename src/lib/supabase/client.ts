import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build/prerender, env vars may not be available
  // Return a dummy client that will be replaced at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a placeholder that won't throw during SSR
    return createBrowserClient<Database>(
      'http://localhost:54321',
      'placeholder-key-for-build'
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
