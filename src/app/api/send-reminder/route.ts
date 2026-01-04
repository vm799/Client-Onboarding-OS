import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, generateReminderEmail } from '@/lib/email'
import { calculateProgress } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get client with onboarding details
    const { data: client, error: clientError } = await (supabase
      .from('clients') as any)
      .select(`
        id,
        name,
        email,
        workspace:workspaces (
          name
        ),
        client_onboardings (
          id,
          onboarding_link_token,
          status,
          step_progress:client_step_progress (
            status
          )
        )
      `)
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const onboarding = (client.client_onboardings as any)?.[0]
    if (!onboarding) {
      return NextResponse.json(
        { error: 'No onboarding found for this client' },
        { status: 400 }
      )
    }

    if (onboarding.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Onboarding is already completed' },
        { status: 400 }
      )
    }

    const progress = calculateProgress(onboarding.step_progress || [])
    const onboardingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/c/${onboarding.onboarding_link_token}`

    const emailContent = generateReminderEmail({
      clientName: client.name,
      providerName: (client.workspace as any)?.name || 'Your Provider',
      onboardingLink,
      progress,
    })

    await sendEmail({
      to: client.email,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    // Log the notification
    await (supabase.from('notification_logs') as any).insert({
      client_onboarding_id: onboarding.id,
      notification_type: 'reminder',
      recipient_email: client.email,
      metadata: { progress, manual: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    )
  }
}
