'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FlowEditor } from '@/components/flows/flow-editor'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import type { StepType, StepConfig } from '@/lib/database.types'

interface Step {
  id: string
  type: StepType
  title: string
  description: string
  config: StepConfig
  step_order: number
}

export default function EditFlowPage() {
  const router = useRouter()
  const params = useParams()
  const flowId = params.id as string
  const supabase = createClient()
  const { toast } = useToast()

  const [flowName, setFlowName] = useState('')
  const [flowDescription, setFlowDescription] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadFlow() {
      const { data: flow, error } = await supabase
        .from('onboarding_flows')
        .select(`
          *,
          steps:onboarding_steps(*)
        `)
        .eq('id', flowId)
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
          .sort((a: any, b: any) => a.step_order - b.step_order)
          .map((step: any) => ({
            id: step.id,
            type: step.type,
            title: step.title,
            description: step.description || '',
            config: step.config || {},
            step_order: step.step_order,
          }))
      )
      setLoading(false)
    }

    loadFlow()
  }, [flowId, supabase, router, toast])

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
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: flowName,
          description: flowDescription,
          status,
          steps: steps.map((step, index) => ({
            type: step.type,
            title: step.title,
            description: step.description,
            config: step.config,
            step_order: index,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to save')

      toast({
        title: 'Success',
        description: status === 'published'
          ? 'Flow published successfully'
          : 'Flow saved as draft',
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
      <div className="flex items-center justify-center min-h-[60vh]">
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
      isNew={false}
    />
  )
}
