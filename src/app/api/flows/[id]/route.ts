import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: flow, error } = await supabase
    .from('onboarding_flows')
    .select(`
      *,
      steps:onboarding_steps(*)
    `)
    .eq('id', params.id)
    .single()

  if (error || !flow) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
  }

  return NextResponse.json(flow)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, status, steps } = body

    // Update flow
    const { error: flowError } = await supabase
      .from('onboarding_flows')
      .update({
        name,
        description,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (flowError) throw flowError

    // If steps provided, update them
    if (steps && Array.isArray(steps)) {
      // Delete existing steps
      await supabase
        .from('onboarding_steps')
        .delete()
        .eq('flow_id', params.id)

      // Insert new steps
      if (steps.length > 0) {
        const stepsToInsert = steps.map((step: any, index: number) => ({
          flow_id: params.id,
          type: step.type,
          title: step.title,
          description: step.description || '',
          config: step.config || {},
          step_order: index,
        }))

        const { error: stepsError } = await supabase
          .from('onboarding_steps')
          .insert(stepsToInsert)

        if (stepsError) throw stepsError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating flow:', error)
    return NextResponse.json(
      { error: 'Failed to update flow' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if flow has active onboardings
    const { data: activeOnboardings } = await supabase
      .from('client_onboardings')
      .select('id')
      .eq('flow_id', params.id)
      .in('status', ['NOT_STARTED', 'IN_PROGRESS'])
      .limit(1)

    if (activeOnboardings && activeOnboardings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete flow with active onboardings. Complete or remove client onboardings first.' },
        { status: 400 }
      )
    }

    // Delete the flow (steps cascade automatically)
    const { error } = await supabase
      .from('onboarding_flows')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting flow:', error)
    return NextResponse.json(
      { error: 'Failed to delete flow' },
      { status: 500 }
    )
  }
}
