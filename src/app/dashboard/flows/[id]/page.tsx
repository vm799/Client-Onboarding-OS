'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FlowEditor } from '@/components/flows/flow-editor'
import { useToast } from '@/components/ui/use-toast'
import type { StepType, StepConfig } from '@/lib/database.types'
import { Loader2 } from 'lucide-react'

interface Step {
  id: string
  type: StepType
  title: string
  description: string
  config: StepConfig
  step_order: number
}

export default function EditFlowPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [flowName, setFlowName] = useState('')
  const [flowDescription, setFlowDescription] = useState('')
  const [steps, setSteps] = useState<Step[]>([])

  useEffect(() => {
    async function loadFlow() {
      const { data: flow, error } = await supabase
        .from('onboarding_flows')
        .select(`
          *,
          steps:onboarding_steps(*)
        `)
        .eq('id', params.id)
        .single()

      if (error || !flow) {
        toast({
          title: 'Error',
          description: 'Flow not found',
          variant: 'destructive',
        })
        router.push('/dashboard/flows')
        return
      }

      setFlowName(flow.name)
      setFlowDescription(flow.description || '')
      setSteps(
        (flow.steps || [])
          .sort((a: Step, b: Step) => a.step_order - b.step_order)
          .map((s: any) => ({
            id: s.id,
            type: s.type,
            title: s.title,
            description: s.description || '',
            config: s.config || {},
            step_order: s.step_order,
          }))
      )
      setLoading(false)
    }

    loadFlow()
  }, [params.id, router, supabase, toast])

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
      // Update the flow
      const { error: flowError } = await supabase
        .from('onboarding_flows')
        .update({
          name: flowName,
          description: flowDescription,
          status,
        })
        .eq('id', params.id)

      if (flowError) throw flowError

      // Get existing steps
      const { data: existingSteps } = await supabase
        .from('onboarding_steps')
        .select('id')
        .eq('flow_id', params.id)

      const existingIds = existingSteps?.map((s) => s.id) || []
      const currentIds = steps.map((s) => s.id)

      // Delete removed steps
      const toDelete = existingIds.filter((id) => !currentIds.includes(id))
      if (toDelete.length > 0) {
        await supabase
          .from('onboarding_steps')
          .delete()
          .in('id', toDelete)
      }

      // Upsert steps
      for (const step of steps) {
        const stepData = {
          id: step.id,
          flow_id: params.id,
          step_order: step.step_order,
          type: step.type,
          title: step.title,
          description: step.description,
          config: step.config,
        }

        if (existingIds.includes(step.id)) {
          await supabase
            .from('onboarding_steps')
            .update(stepData)
            .eq('id', step.id)
        } else {
          await supabase.from('onboarding_steps').insert(stepData)
        }
      }

      toast({
        title: 'Success',
        description: `Flow ${status === 'published' ? 'published' : 'saved'}`,
      })

      router.push('/dashboard/flows')
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to save flow',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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
    />
  )
}
