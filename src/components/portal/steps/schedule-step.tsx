'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, ExternalLink, Check, Calendar } from 'lucide-react'
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

interface ScheduleStepProps {
  stepProgress: StepProgress
  token: string
  onComplete: (stepProgressId: string, data: Record<string, any>) => void
}

export function ScheduleStep({ stepProgress, token, onComplete }: ScheduleStepProps) {
  const config = stepProgress.step.config
  const schedulingUrl = config.schedulingUrl

  const [loading, setLoading] = useState(false)
  const [scheduled, setScheduled] = useState(stepProgress.data?.scheduled || false)

  const handleOpenScheduler = () => {
    if (schedulingUrl) {
      window.open(schedulingUrl, '_blank')
    }
  }

  const handleMarkComplete = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/portal/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          stepProgressId: stepProgress.id,
          data: { scheduled: true, scheduledAt: new Date().toISOString() },
        }),
      })

      if (!response.ok) throw new Error('Failed to complete step')

      setScheduled(true)
      onComplete(stepProgress.id, { scheduled: true })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (stepProgress.status === 'COMPLETED') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600">
          <Check className="h-5 w-5" />
          <span className="font-medium">Call scheduled</span>
        </div>
        <p className="text-sm text-muted-foreground">
          You've confirmed that your call is scheduled.
        </p>
      </div>
    )
  }

  if (!schedulingUrl) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          No scheduling link has been configured for this step.
        </p>
        <Button onClick={handleMarkComplete} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Mark as Complete
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8 border rounded-lg bg-muted/50">
        <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="font-medium mb-2">Ready to schedule your call?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Click the button below to open the scheduling page in a new tab.
        </p>
        <Button onClick={handleOpenScheduler} className="gap-2">
          Open Scheduler
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-t pt-6">
        <p className="text-sm text-muted-foreground mb-4">
          After you've scheduled your call, click the button below to confirm and continue.
        </p>
        <Button onClick={handleMarkComplete} variant="outline" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          I've Scheduled My Call
        </Button>
      </div>
    </div>
  )
}
