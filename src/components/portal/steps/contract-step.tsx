'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, Check } from 'lucide-react'
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

interface ContractStepProps {
  stepProgress: StepProgress
  token: string
  onComplete: (stepProgressId: string, data: Record<string, any>) => void
}

export function ContractStep({ stepProgress, token, onComplete }: ContractStepProps) {
  const config = stepProgress.step.config
  const contractText = config.contractText || 'I agree to the terms and conditions.'
  const acceptButtonText = config.acceptButtonText || 'I agree'

  const [agreed, setAgreed] = useState(stepProgress.data?.agreed || false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!agreed) return

    setLoading(true)
    try {
      const response = await fetch('/api/portal/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          stepProgressId: stepProgress.id,
          data: { agreed: true, agreedAt: new Date().toISOString() },
        }),
      })

      if (!response.ok) throw new Error('Failed to submit')

      onComplete(stepProgress.id, { agreed: true })
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
          <span className="font-medium">Agreement accepted</span>
        </div>
        <p className="text-sm text-muted-foreground">
          You agreed to the terms on{' '}
          {stepProgress.data?.agreedAt
            ? new Date(stepProgress.data.agreedAt).toLocaleDateString()
            : 'this date'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Contract Text */}
      <div className="p-4 bg-muted rounded-lg max-h-64 overflow-y-auto">
        <p className="text-sm whitespace-pre-wrap">{contractText}</p>
      </div>

      {/* Agreement Checkbox */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="agreement"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(!!checked)}
        />
        <Label htmlFor="agreement" className="text-sm leading-relaxed cursor-pointer">
          {acceptButtonText}
        </Label>
      </div>

      <Button onClick={handleSubmit} disabled={!agreed || loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Accept & Continue
      </Button>
    </div>
  )
}
