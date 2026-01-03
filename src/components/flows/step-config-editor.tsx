'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { StepType, StepConfig, FormFieldConfig } from '@/lib/database.types'

interface Step {
  id: string
  type: StepType
  title: string
  description: string
  config: StepConfig
  step_order: number
}

interface StepConfigEditorProps {
  step: Step
  onSave: (step: Step) => void
  onCancel: () => void
}

export function StepConfigEditor({ step, onSave, onCancel }: StepConfigEditorProps) {
  const [editedStep, setEditedStep] = useState<Step>({ ...step })

  const updateConfig = (updates: Partial<StepConfig>) => {
    setEditedStep({
      ...editedStep,
      config: { ...editedStep.config, ...updates },
    })
  }

  const handleSave = () => {
    onSave(editedStep)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Edit Step</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Common Fields */}
        <div className="space-y-2">
          <Label htmlFor="step-title">Title</Label>
          <Input
            id="step-title"
            value={editedStep.title}
            onChange={(e) =>
              setEditedStep({ ...editedStep, title: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="step-description">Description</Label>
          <Textarea
            id="step-description"
            value={editedStep.description}
            onChange={(e) =>
              setEditedStep({ ...editedStep, description: e.target.value })
            }
            rows={3}
          />
        </div>

        {/* Type-specific config */}
        {editedStep.type === 'FORM' && (
          <FormFieldsEditor
            fields={editedStep.config.fields || []}
            onChange={(fields) => updateConfig({ fields })}
          />
        )}

        {editedStep.type === 'FILE_UPLOAD' && (
          <FileUploadConfig
            config={editedStep.config}
            onChange={updateConfig}
          />
        )}

        {editedStep.type === 'CONTRACT' && (
          <ContractConfig config={editedStep.config} onChange={updateConfig} />
        )}

        {editedStep.type === 'SCHEDULE' && (
          <ScheduleConfig config={editedStep.config} onChange={updateConfig} />
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FormFieldsEditor({
  fields,
  onChange,
}: {
  fields: FormFieldConfig[]
  onChange: (fields: FormFieldConfig[]) => void
}) {
  const addField = () => {
    onChange([
      ...fields,
      {
        id: crypto.randomUUID(),
        type: 'text',
        label: 'New Field',
        required: false,
      },
    ])
  }

  const updateField = (id: string, updates: Partial<FormFieldConfig>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Form Fields</Label>
        <Button size="sm" variant="outline" onClick={addField}>
          <Plus className="h-3 w-3 mr-1" />
          Add Field
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Field {index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto"
                onClick={() => removeField(field.id)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
            <div className="grid gap-3">
              <Input
                placeholder="Field label"
                value={field.label}
                onChange={(e) =>
                  updateField(field.id, { label: e.target.value })
                }
              />
              <Select
                value={field.type}
                onValueChange={(value) =>
                  updateField(field.id, {
                    type: value as FormFieldConfig['type'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                </SelectContent>
              </Select>
              {field.type === 'select' && (
                <Textarea
                  placeholder="Options (one per line)"
                  value={field.options?.map((o) => o.label).join('\n') || ''}
                  onChange={(e) => {
                    const options = e.target.value
                      .split('\n')
                      .filter(Boolean)
                      .map((label) => ({
                        label,
                        value: label.toLowerCase().replace(/\s+/g, '_'),
                      }))
                    updateField(field.id, { options })
                  }}
                  rows={3}
                />
              )}
              <Input
                placeholder="Placeholder text (optional)"
                value={field.placeholder || ''}
                onChange={(e) =>
                  updateField(field.id, { placeholder: e.target.value })
                }
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`required-${field.id}`}
                  checked={field.required}
                  onCheckedChange={(checked) =>
                    updateField(field.id, { required: !!checked })
                  }
                />
                <Label htmlFor={`required-${field.id}`} className="text-sm">
                  Required
                </Label>
              </div>
            </div>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No fields added yet. Click "Add Field" to start.
          </p>
        )}
      </div>
    </div>
  )
}

function FileUploadConfig({
  config,
  onChange,
}: {
  config: StepConfig
  onChange: (updates: Partial<StepConfig>) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Maximum Files</Label>
        <Input
          type="number"
          min="1"
          max="20"
          value={config.maxFiles || 5}
          onChange={(e) => onChange({ maxFiles: parseInt(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label>Max File Size (MB)</Label>
        <Input
          type="number"
          min="1"
          max="100"
          value={config.maxFileSize || 10}
          onChange={(e) => onChange({ maxFileSize: parseInt(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label>Allowed File Types</Label>
        <Input
          placeholder="pdf, doc, jpg, png"
          value={config.allowedFileTypes?.join(', ') || ''}
          onChange={(e) =>
            onChange({
              allowedFileTypes: e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated list of file extensions
        </p>
      </div>
    </div>
  )
}

function ContractConfig({
  config,
  onChange,
}: {
  config: StepConfig
  onChange: (updates: Partial<StepConfig>) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Contract/Terms Text</Label>
        <Textarea
          placeholder="Enter the terms and conditions..."
          value={config.contractText || ''}
          onChange={(e) => onChange({ contractText: e.target.value })}
          rows={5}
        />
      </div>
      <div className="space-y-2">
        <Label>Accept Button Text</Label>
        <Input
          placeholder="I agree to the terms"
          value={config.acceptButtonText || ''}
          onChange={(e) => onChange({ acceptButtonText: e.target.value })}
        />
      </div>
    </div>
  )
}

function ScheduleConfig({
  config,
  onChange,
}: {
  config: StepConfig
  onChange: (updates: Partial<StepConfig>) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Scheduling URL</Label>
      <Input
        placeholder="https://calendly.com/yourname"
        value={config.schedulingUrl || ''}
        onChange={(e) => onChange({ schedulingUrl: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Enter a Calendly, Cal.com, or similar booking link
      </p>
    </div>
  )
}
