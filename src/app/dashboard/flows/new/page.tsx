'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FlowEditor } from '@/components/flows/flow-editor'
import { useToast } from '@/components/ui/use-toast'
import type { OnboardingStep, StepType, StepConfig } from '@/lib/database.types'

interface NewStep {
  id: string
  type: StepType
  title: string
  description: string
  config: StepConfig
  step_order: number
}

export default function NewFlowPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [flowName, setFlowName] = useState('')
  const [flowDescription, setFlowDescription] = useState('')
  const [steps, setSteps] = useState<NewStep[]>([])
  const [saving, setSaving] = useState(false)

  const handleSave = async (status: 'draft' | 'published') => {
    if (!flowName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a flow name',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('current_workspace_id')
        .eq('id', user!.id)
        .single()

      // Create the flow
      const { data: flow, error: flowError } = await (supabase
        .from('onboarding_flows') as any)
        .insert({
          workspace_id: profile!.current_workspace_id!,
          name: flowName,
          description: flowDescription,
          status,
        })
        .select()
        .single()

      if (flowError) throw flowError

      // Create steps
      if (steps.length > 0) {
        const stepsToInsert = steps.map((step, index) => ({
          flow_id: flow.id,
          step_order: index,
          type: step.type,
          title: step.title,
          description: step.description,
          config: step.config,
        }))

        const { error: stepsError } = await (supabase
          .from('onboarding_steps') as any)
          .insert(stepsToInsert)

        if (stepsError) throw stepsError
      }

      toast({
        title: 'Success',
        description: `Flow ${status === 'published' ? 'published' : 'saved as draft'}`,
      })

      router.push('/dashboard/flows')
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to create flow',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <FlowEditor
      flowName={flowName}
      flowDescription={flowDescription}
      steps={steps}
      onFlowNameChange={setFlowName}
      onFlowDescriptionChange={setFlowDescription}
      onStepsChange={setSteps}
      onSave={handleSave}
      saving={saving}
      isNew
    />
  )
}
