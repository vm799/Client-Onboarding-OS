'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Check } from 'lucide-react'
import type { StepProgressStatus, StepConfig, FormFieldConfig } from '@/lib/database.types'

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

interface FormStepProps {
  stepProgress: StepProgress
  token: string
  onComplete: (stepProgressId: string, data: Record<string, any>) => void
}

export function FormStep({ stepProgress, token, onComplete }: FormStepProps) {
  const fields = (stepProgress.step.config.fields || []) as FormFieldConfig[]
  const [formData, setFormData] = useState<Record<string, string>>(
    stepProgress.data || {}
  )
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    fields.forEach((field) => {
      if (field.required && !formData[field.id]?.trim()) {
        newErrors[field.id] = 'This field is required'
      }
      if (field.type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData[field.id])) {
          newErrors[field.id] = 'Please enter a valid email'
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      const response = await fetch('/api/portal/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          stepProgressId: stepProgress.id,
          data: formData,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit form')

      onComplete(stepProgress.id, formData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (stepProgress.status === 'COMPLETED') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600 mb-4">
          <Check className="h-5 w-5" />
          <span className="font-medium">Form submitted</span>
        </div>
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.id} className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">{field.label}</div>
              <div className="font-medium">
                {formData[field.id] || stepProgress.data?.[field.id] || '-'}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.type === 'textarea' ? (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                rows={4}
              />
            ) : field.type === 'select' ? (
              <Select
                value={formData[field.id] || ''}
                onValueChange={(value) => handleChange(field.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || 'Select an option'} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={field.id}
                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : 'text'}
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
              />
            )}
            {errors[field.id] && (
              <p className="text-sm text-destructive">{errors[field.id]}</p>
            )}
          </div>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit
      </Button>
    </div>
  )
}
