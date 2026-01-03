'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Save,
  Loader2,
  MessageSquare,
  FileText,
  Upload,
  FileCheck,
  Calendar,
} from 'lucide-react'
import type { StepType, StepConfig, FormFieldConfig } from '@/lib/database.types'
import { StepConfigEditor } from './step-config-editor'

interface Step {
  id: string
  type: StepType
  title: string
  description: string
  config: StepConfig
  step_order: number
}

interface FlowEditorProps {
  flowName: string
  flowDescription: string
  steps: Step[]
  onFlowNameChange: (name: string) => void
  onFlowDescriptionChange: (description: string) => void
  onStepsChange: (steps: Step[]) => void
  onSave: (status: 'draft' | 'published') => void
  saving: boolean
  isNew?: boolean
}

const stepTypeIcons: Record<StepType, React.ReactNode> = {
  WELCOME: <MessageSquare className="h-4 w-4" />,
  FORM: <FileText className="h-4 w-4" />,
  FILE_UPLOAD: <Upload className="h-4 w-4" />,
  CONTRACT: <FileCheck className="h-4 w-4" />,
  SCHEDULE: <Calendar className="h-4 w-4" />,
}

const stepTypeLabels: Record<StepType, string> = {
  WELCOME: 'Welcome',
  FORM: 'Form',
  FILE_UPLOAD: 'File Upload',
  CONTRACT: 'Contract',
  SCHEDULE: 'Schedule',
}

const stepTypeDescriptions: Record<StepType, string> = {
  WELCOME: 'Welcome message for your client',
  FORM: 'Collect information with custom fields',
  FILE_UPLOAD: 'Request files from your client',
  CONTRACT: 'Get agreement on terms',
  SCHEDULE: 'Let clients book a call',
}

export function FlowEditor({
  flowName,
  flowDescription,
  steps,
  onFlowNameChange,
  onFlowDescriptionChange,
  onStepsChange,
  onSave,
  saving,
  isNew,
}: FlowEditorProps) {
  const router = useRouter()
  const [addStepOpen, setAddStepOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<Step | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const addStep = (type: StepType) => {
    const newStep: Step = {
      id: crypto.randomUUID(),
      type,
      title: `New ${stepTypeLabels[type]} Step`,
      description: '',
      config: getDefaultConfig(type),
      step_order: steps.length,
    }
    onStepsChange([...steps, newStep])
    setAddStepOpen(false)
    setEditingStep(newStep)
  }

  const updateStep = (updatedStep: Step) => {
    onStepsChange(
      steps.map((s) => (s.id === updatedStep.id ? updatedStep : s))
    )
    setEditingStep(null)
  }

  const deleteStep = (stepId: string) => {
    onStepsChange(steps.filter((s) => s.id !== stepId))
    if (editingStep?.id === stepId) {
      setEditingStep(null)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newSteps = [...steps]
    const draggedStep = newSteps[draggedIndex]
    newSteps.splice(draggedIndex, 1)
    newSteps.splice(index, 0, draggedStep)

    // Update step_order
    newSteps.forEach((step, i) => {
      step.step_order = i
    })

    onStepsChange(newSteps)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? 'Create New Flow' : 'Edit Flow'}
            </h1>
            <p className="text-muted-foreground text-sm">
              Build your client onboarding experience
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onSave('draft')}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Draft
          </Button>
          <Button onClick={() => onSave('published')} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Flow Details & Steps List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Flow Details */}
          <Card>
            <CardHeader>
              <CardTitle>Flow Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="flow-name">Flow Name</Label>
                <Input
                  id="flow-name"
                  placeholder="e.g., New Client Onboarding"
                  value={flowName}
                  onChange={(e) => onFlowNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flow-description">Description</Label>
                <Textarea
                  id="flow-description"
                  placeholder="Describe what this flow is for..."
                  value={flowDescription}
                  onChange={(e) => onFlowDescriptionChange(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Steps List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Steps</CardTitle>
              <Dialog open={addStepOpen} onOpenChange={setAddStepOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add Step
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Step</DialogTitle>
                    <DialogDescription>
                      Choose a step type to add to your flow
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-4">
                    {(Object.keys(stepTypeLabels) as StepType[]).map((type) => (
                      <Button
                        key={type}
                        variant="outline"
                        className="justify-start h-auto p-4"
                        onClick={() => addStep(type)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">{stepTypeIcons[type]}</div>
                          <div className="text-left">
                            <div className="font-medium">
                              {stepTypeLabels[type]}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {stepTypeDescriptions[type]}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No steps added yet.</p>
                  <p className="text-sm">
                    Click &quot;Add Step&quot; to start building your flow.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-move hover:bg-muted/50 transition-colors ${
                        editingStep?.id === step.id ? 'ring-2 ring-primary' : ''
                      } ${draggedIndex === index ? 'opacity-50' : ''}`}
                      onClick={() => setEditingStep(step)}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        {stepTypeIcons[step.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{step.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {stepTypeLabels[step.type]}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteStep(step.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step Editor Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {editingStep ? (
              <StepConfigEditor
                step={editingStep}
                onSave={updateStep}
                onCancel={() => setEditingStep(null)}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>Select a step to edit its configuration</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getDefaultConfig(type: StepType): StepConfig {
  switch (type) {
    case 'WELCOME':
      return {}
    case 'FORM':
      return {
        fields: [
          {
            id: crypto.randomUUID(),
            type: 'text',
            label: 'Your Name',
            required: true,
          },
        ],
      }
    case 'FILE_UPLOAD':
      return {
        maxFiles: 5,
        maxFileSize: 10,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'],
      }
    case 'CONTRACT':
      return {
        acceptButtonText: 'I agree to the terms',
      }
    case 'SCHEDULE':
      return {
        schedulingUrl: '',
      }
    default:
      return {}
  }
}
