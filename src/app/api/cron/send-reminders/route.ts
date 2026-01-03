import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, generateReminderEmail } from '@/lib/email'
import { calculateProgress } from '@/lib/utils'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// It sends reminder emails to clients who haven't had activity in N days

const INACTIVITY_DAYS = 3 // Send reminder after 3 days of inactivity

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // Calculate the cutoff date for inactivity
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_DAYS)

    // Get onboardings that are in progress and haven't had activity in N days
    const { data: onboardings, error } = await supabase
      .from('client_onboardings')
      .select(`
        id,
        onboarding_link_token,
        last_activity_at,
        client:clients (
          id,
          name,
          email,
          workspace:workspaces (
            name
          )
        ),
        step_progress:client_step_progress (
          status
        )
      `)
      .eq('status', 'IN_PROGRESS')
      .lt('last_activity_at', cutoffDate.toISOString())

    if (error) throw error

    if (!onboardings || onboardings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        count: 0,
      })
    }

    const results = []

    for (const onboarding of onboardings as any[]) {
      // Check if we already sent a reminder recently (within 24 hours)
      const { data: recentReminder } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('client_onboarding_id', onboarding.id)
        .eq('notification_type', 'reminder')
        .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)

      if (recentReminder && recentReminder.length > 0) {
        results.push({
          onboardingId: onboarding.id,
          skipped: true,
          reason: 'Recent reminder already sent',
        })
        continue
      }

      const client = onboarding.client as any
      const progress = calculateProgress(onboarding.step_progress || [])
      const onboardingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/c/${onboarding.onboarding_link_token}`

      const emailContent = generateReminderEmail({
        clientName: client.name,
        providerName: client.workspace?.name || 'Your Provider',
        onboardingLink,
        progress,
      })

      try {
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
          metadata: { progress, automated: true },
        })

        results.push({
          onboardingId: onboarding.id,
          email: client.email,
          sent: true,
        })
      } catch (emailError) {
        results.push({
          onboardingId: onboarding.id,
          email: client.email,
          sent: false,
          error: 'Failed to send email',
        })
      }
    }

    const sentCount = results.filter((r) => r.sent).length

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} reminder(s)`,
      count: sentCount,
      results,
    })
  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}
