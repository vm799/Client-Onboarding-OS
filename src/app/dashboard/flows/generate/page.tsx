'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Sparkles, Loader2, Check, ArrowRight } from 'lucide-react'
import type { StepType, StepConfig } from '@/lib/database.types'

interface GeneratedStep {
  type: StepType
  title: string
  description: string
  config: StepConfig
}

interface GeneratedFlow {
  name: string
  description: string
  steps: GeneratedStep[]
}

export default function GenerateFlowPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [serviceDescription, setServiceDescription] = useState('')
  const [clientType, setClientType] = useState('')
  const [tone, setTone] = useState<'friendly' | 'formal' | 'bold'>('friendly')
  const [generating, setGenerating] = useState(false)
  const [generatedFlow, setGeneratedFlow] = useState<GeneratedFlow | null>(null)
  const [saving, setSaving] = useState(false)

  const handleGenerate = async () => {
    if (!serviceDescription.trim()) {
      toast({
        title: 'Error',
        description: 'Please describe your service',
        variant: 'destructive',
      })
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/generate-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceDescription,
          clientType,
          tone,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate flow')

      const data = await response.json()
      setGeneratedFlow(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to generate flow',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedFlow) return

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
          name: generatedFlow.name,
          description: generatedFlow.description,
          status: 'draft',
        })
        .select()
        .single()

      if (flowError) throw flowError

      // Create steps
      const stepsToInsert = generatedFlow.steps.map((step, index) => ({
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

      toast({
        title: 'Success',
        description: 'Flow created successfully! You can now edit it.',
      })

      router.push(`/dashboard/flows/${flow.id}`)
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">AI Flow Generator</h1>
          <p className="text-muted-foreground text-sm">
            Describe your service and let AI create an onboarding flow
          </p>
        </div>
      </div>

      {!generatedFlow ? (
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your service</CardTitle>
            <CardDescription>
              The more details you provide, the better the generated flow will be
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service">Service Description *</Label>
              <Textarea
                id="service"
                placeholder="e.g., I'm a brand strategist who helps startups develop their visual identity and brand guidelines. My engagements typically last 4-6 weeks..."
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Typical Client Profile (optional)</Label>
              <Input
                id="client"
                placeholder="e.g., Early-stage startups, SaaS companies, solo entrepreneurs"
                value={clientType}
                onChange={(e) => setClientType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Communication Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly & Approachable</SelectItem>
                  <SelectItem value="formal">Professional & Formal</SelectItem>
                  <SelectItem value="bold">Bold & Energetic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={generating || !serviceDescription.trim()}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Flow
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">Flow Generated</span>
              </div>
              <CardTitle>{generatedFlow.name}</CardTitle>
              <CardDescription>{generatedFlow.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedFlow.steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{step.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {step.type} — {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setGeneratedFlow(null)}
            >
              Start Over
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save & Edit Flow
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
