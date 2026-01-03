import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, generateCompletionNotificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { token, stepProgressId, data } = await request.json()

    if (!token || !stepProgressId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify the token matches the onboarding
    const { data: onboarding, error: onboardingError } = await supabase
      .from('client_onboardings')
      .select(`
        id,
        client_id,
        flow:onboarding_flows(
          id,
          name,
          workspace:workspaces(
            id,
            name
          )
        ),
        client:clients(
          id,
          name,
          email
        )
      `)
      .eq('onboarding_link_token', token)
      .single()

    if (onboardingError || !onboarding) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify the step progress belongs to this onboarding
    const { data: stepProgress, error: stepError } = await supabase
      .from('client_step_progress')
      .select('id, client_onboarding_id')
      .eq('id', stepProgressId)
      .eq('client_onboarding_id', onboarding.id)
      .single()

    if (stepError || !stepProgress) {
      return NextResponse.json(
        { error: 'Invalid step' },
        { status: 400 }
      )
    }

    // Update the step progress
    const { error: updateError } = await supabase
      .from('client_step_progress')
      .update({
        status: 'COMPLETED',
        data: data || {},
        completed_at: new Date().toISOString(),
      })
      .eq('id', stepProgressId)

    if (updateError) {
      throw updateError
    }

    // Update onboarding last activity
    await supabase
      .from('client_onboardings')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', onboarding.id)

    // Check if all steps are completed
    const { data: allProgress } = await supabase
      .from('client_step_progress')
      .select('status')
      .eq('client_onboarding_id', onboarding.id)

    const allCompleted = allProgress?.every((p) => p.status === 'COMPLETED')

    if (allCompleted) {
      // Update onboarding status to completed
      await supabase
        .from('client_onboardings')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        })
        .eq('id', onboarding.id)

      // Send completion notification email to provider
      try {
        // Get workspace owner email
        const { data: workspaceMembers } = await supabase
          .from('workspace_members')
          .select('user_id, role')
          .eq('workspace_id', (onboarding.flow as any)?.workspace?.id)
          .eq('role', 'owner')
          .limit(1)

        if (workspaceMembers && workspaceMembers.length > 0) {
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', workspaceMembers[0].user_id)
            .single()

          if (ownerProfile?.email) {
            const client = onboarding.client as any
            const flow = onboarding.flow as any
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

            const emailContent = generateCompletionNotificationEmail({
              providerName: ownerProfile.name || 'Provider',
              clientName: client?.name || 'Client',
              clientEmail: client?.email || '',
              flowName: flow?.name || 'Onboarding',
              dashboardLink: `${appUrl}/dashboard/clients/${client?.id}`,
            })

            await sendEmail({
              to: ownerProfile.email,
              subject: emailContent.subject,
              html: emailContent.html,
            })
          }
        }
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error('Failed to send completion notification:', emailError)
      }

      // Log activity
      try {
        await supabase.from('activity_logs').insert({
          workspace_id: (onboarding.flow as any)?.workspace?.id,
          client_id: onboarding.client_id,
          action: 'onboarding_completed',
          details: {
            flow_name: (onboarding.flow as any)?.name,
            client_name: (onboarding.client as any)?.name,
          },
        })
      } catch (logError) {
        console.error('Failed to log activity:', logError)
      }
    }

    return NextResponse.json({ success: true, allCompleted })
  } catch (error) {
    console.error('Error completing step:', error)
    return NextResponse.json(
      { error: 'Failed to complete step' },
      { status: 500 }
    )
  }
}
