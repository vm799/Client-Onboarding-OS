'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight } from 'lucide-react'
import type { StepProgressStatus, StepConfig } from '@/lib/database.types'

interface StepProgress {
  id: string
  status: StepProgressStatus
  data: Record<string, any>
  step: {
    id: string
    title: string
    description: string | null
    config: StepConfig
  }
}

interface WelcomeStepProps {
  stepProgress: StepProgress
  token: string
  onComplete: (stepProgressId: string) => void
}

export function WelcomeStep({ stepProgress, token, onComplete }: WelcomeStepProps) {
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/portal/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          stepProgressId: stepProgress.id,
          data: {},
        }),
      })

      if (!response.ok) throw new Error('Failed to complete step')

      onComplete(stepProgress.id)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (stepProgress.status === 'COMPLETED') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You've completed this step.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="prose prose-sm max-w-none">
        <p className="text-muted-foreground">
          {stepProgress.step.description || 'Welcome! Click continue to proceed to the next step.'}
        </p>
      </div>
      <Button onClick={handleContinue} disabled={loading} className="gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Continue
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}
