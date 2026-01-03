'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  MessageSquare,
  FileText,
  Upload,
  FileCheck,
  Calendar,
  ChevronRight,
  PartyPopper,
} from 'lucide-react'
import { calculateProgress } from '@/lib/utils'
import type { StepType, StepConfig, StepProgressStatus } from '@/lib/database.types'
import { WelcomeStep } from './steps/welcome-step'
import { FormStep } from './steps/form-step'
import { FileUploadStep } from './steps/file-upload-step'
import { ContractStep } from './steps/contract-step'
import { ScheduleStep } from './steps/schedule-step'

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

const stepTypeIcons: Record<StepType, React.ReactNode> = {
  WELCOME: <MessageSquare className="h-4 w-4" />,
  FORM: <FileText className="h-4 w-4" />,
  FILE_UPLOAD: <Upload className="h-4 w-4" />,
  CONTRACT: <FileCheck className="h-4 w-4" />,
  SCHEDULE: <Calendar className="h-4 w-4" />,
}

export function ClientPortal({
  onboarding: initialOnboarding,
  token,
}: {
  onboarding: OnboardingData
  token: string
}) {
  const [onboarding, setOnboarding] = useState(initialOnboarding)
  const [activeStepIndex, setActiveStepIndex] = useState(() => {
    // Find the first incomplete step
    const firstIncomplete = onboarding.step_progress.findIndex(
      (sp) => sp.status !== 'COMPLETED'
    )
    return firstIncomplete === -1 ? onboarding.step_progress.length - 1 : firstIncomplete
  })

  const progress = calculateProgress(onboarding.step_progress)
  const isCompleted = onboarding.status === 'COMPLETED'
  const activeStep = onboarding.step_progress[activeStepIndex]

  const handleStepComplete = (stepProgressId: string, data?: Record<string, any>) => {
    // Update local state
    setOnboarding((prev) => ({
      ...prev,
      step_progress: prev.step_progress.map((sp) =>
        sp.id === stepProgressId
          ? { ...sp, status: 'COMPLETED' as StepProgressStatus, data: data || sp.data }
          : sp
      ),
      status: prev.step_progress.every(
        (sp) => sp.id === stepProgressId || sp.status === 'COMPLETED'
      )
        ? 'COMPLETED'
        : 'IN_PROGRESS',
    }))

    // Move to next step
    if (activeStepIndex < onboarding.step_progress.length - 1) {
      setActiveStepIndex(activeStepIndex + 1)
    }
  }

  const renderStepContent = () => {
    if (!activeStep) return null

    const commonProps = {
      stepProgress: activeStep,
      token,
      onComplete: handleStepComplete,
    }

    switch (activeStep.step.type) {
      case 'WELCOME':
        return <WelcomeStep {...commonProps} />
      case 'FORM':
        return <FormStep {...commonProps} />
      case 'FILE_UPLOAD':
        return <FileUploadStep {...commonProps} />
      case 'CONTRACT':
        return <ContractStep {...commonProps} />
      case 'SCHEDULE':
        return <ScheduleStep {...commonProps} />
      default:
        return null
    }
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ '--brand-color': onboarding.workspace.brand_color } as React.CSSProperties}
    >
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onboarding.workspace.logo_url ? (
              <Image
                src={onboarding.workspace.logo_url}
                alt={onboarding.workspace.name}
                width={40}
                height={40}
                className="rounded"
              />
            ) : (
              <div
                className="w-10 h-10 rounded flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: onboarding.workspace.brand_color }}
              >
                {onboarding.workspace.name[0]}
              </div>
            )}
            <span className="font-semibold">{onboarding.workspace.name}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {onboarding.client.name}!
          </h1>
          <p className="text-muted-foreground">
            {onboarding.flow.description || 'Complete the steps below to finish your onboarding.'}
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Your Progress</span>
              <span className="text-sm font-medium">{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {isCompleted ? (
          /* Completion Message */
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <PartyPopper className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">You&apos;re All Set!</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Thank you for completing your onboarding. {onboarding.workspace.name} will be in touch with you soon.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Steps List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {onboarding.step_progress.map((sp, index) => (
                    <button
                      key={sp.id}
                      onClick={() => setActiveStepIndex(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        activeStepIndex === index
                          ? 'bg-primary text-primary-foreground'
                          : sp.status === 'COMPLETED'
                          ? 'bg-green-50 text-green-900'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          sp.status === 'COMPLETED'
                            ? 'bg-green-600 text-white'
                            : activeStepIndex === index
                            ? 'bg-primary-foreground text-primary'
                            : 'bg-muted'
                        }`}
                      >
                        {sp.status === 'COMPLETED' ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">
                          {sp.step.title}
                        </div>
                      </div>
                      {sp.status === 'COMPLETED' && (
                        <Badge variant="success" className="text-xs">Done</Badge>
                      )}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Active Step Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    {stepTypeIcons[activeStep.step.type]}
                    <span className="text-sm">
                      Step {activeStepIndex + 1} of {onboarding.step_progress.length}
                    </span>
                  </div>
                  <CardTitle>{activeStep.step.title}</CardTitle>
                  {activeStep.step.description && (
                    <CardDescription>{activeStep.step.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>{renderStepContent()}</CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          Powered by Client Onboarding OS
        </div>
      </footer>
    </div>
  )
}
