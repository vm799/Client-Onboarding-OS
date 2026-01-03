import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { ClientPortal } from '@/components/portal/client-portal'
import type { StepType, StepConfig, StepProgressStatus } from '@/lib/database.types'

interface StepProgress {
  id: string
  status: StepProgressStatus
  data: Record<string, any>
  completed_at: string | null
  step: {
    id: string
    step_order: number
    type: StepType
    title: string
    description: string | null
    config: StepConfig
  }
}

interface OnboardingData {
  id: string
  status: string
  client: {
    id: string
    name: string
    email: string
  }
  flow: {
    id: string
    name: string
    description: string | null
  }
  workspace: {
    id: string
    name: string
    logo_url: string | null
    brand_color: string
  }
  step_progress: StepProgress[]
}

export default async function ClientOnboardingPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createAdminClient()

  // Fetch the onboarding data using the token
  const { data: onboarding, error } = await supabase
    .from('client_onboardings')
    .select(`
      id,
      status,
      client:clients (
        id,
        name,
        email,
        workspace:workspaces (
          id,
          name,
          logo_url,
          brand_color
        )
      ),
      flow:onboarding_flows (
        id,
        name,
        description
      ),
      step_progress:client_step_progress (
        id,
        status,
        data,
        completed_at,
        step:onboarding_steps (
          id,
          step_order,
          type,
          title,
          description,
          config
        )
      )
    `)
    .eq('onboarding_link_token', params.token)
    .single()

  if (error || !onboarding) {
    notFound()
  }

  // Sort step progress by step order
  const sortedStepProgress = (onboarding.step_progress as StepProgress[])
    ?.sort((a, b) => a.step.step_order - b.step.step_order)

  const onboardingData: OnboardingData = {
    id: onboarding.id,
    status: onboarding.status,
    client: {
      id: (onboarding.client as any).id,
      name: (onboarding.client as any).name,
      email: (onboarding.client as any).email,
    },
    flow: {
      id: (onboarding.flow as any).id,
      name: (onboarding.flow as any).name,
      description: (onboarding.flow as any).description,
    },
    workspace: {
      id: (onboarding.client as any).workspace.id,
      name: (onboarding.client as any).workspace.name,
      logo_url: (onboarding.client as any).workspace.logo_url,
      brand_color: (onboarding.client as any).workspace.brand_color,
    },
    step_progress: sortedStepProgress,
  }

  return <ClientPortal onboarding={onboardingData} token={params.token} />
}
