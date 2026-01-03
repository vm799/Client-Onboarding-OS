import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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
      .select('id')
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

      // TODO: Send completion notification email to provider
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing step:', error)
    return NextResponse.json(
      { error: 'Failed to complete step' },
      { status: 500 }
    )
  }
}
