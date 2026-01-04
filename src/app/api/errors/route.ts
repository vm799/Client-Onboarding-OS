import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { error, stack, componentStack, url, userAgent } = body

    const supabase = createAdminClient()

    // Log to Supabase
    await (supabase.from('error_logs') as any).insert({
      error_message: error,
      stack_trace: stack,
      component_stack: componentStack,
      url,
      user_agent: userAgent,
      occurred_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to log error:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
