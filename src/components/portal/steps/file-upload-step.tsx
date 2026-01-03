'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, X, File, Check } from 'lucide-react'
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

interface FileUploadStepProps {
  stepProgress: StepProgress
  token: string
  onComplete: (stepProgressId: string, data: Record<string, any>) => void
}

interface UploadedFile {
  name: string
  url: string
  size: number
}

export function FileUploadStep({ stepProgress, token, onComplete }: FileUploadStepProps) {
  const config = stepProgress.step.config
  const maxFiles = config.maxFiles || 5
  const maxFileSize = (config.maxFileSize || 10) * 1024 * 1024 // Convert MB to bytes
  const allowedTypes = config.allowedFileTypes || ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg']

  const [files, setFiles] = useState<UploadedFile[]>(stepProgress.data?.files || [])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files`)
      return
    }

    setError('')
    setUploading(true)

    try {
      for (const file of selectedFiles) {
        // Check file size
        if (file.size > maxFileSize) {
          setError(`File "${file.name}" exceeds the maximum size of ${config.maxFileSize}MB`)
          continue
        }

        // Check file type
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (ext && !allowedTypes.includes(ext)) {
          setError(`File type "${ext}" is not allowed`)
          continue
        }

        // Upload file
        const formData = new FormData()
        formData.append('file', file)
        formData.append('token', token)
        formData.append('stepProgressId', stepProgress.id)

        const response = await fetch('/api/portal/upload-file', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Upload failed')

        const data = await response.json()
        setFiles((prev) => [
          ...prev,
          { name: file.name, url: data.url, size: file.size },
        ])
      }
    } catch (err) {
      setError('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/portal/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          stepProgressId: stepProgress.id,
          data: { files },
        }),
      })

      if (!response.ok) throw new Error('Failed to complete step')

      onComplete(stepProgress.id, { files })
    } catch (err) {
      setError('Failed to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (stepProgress.status === 'COMPLETED') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600 mb-4">
          <Check className="h-5 w-5" />
          <span className="font-medium">Files uploaded</span>
        </div>
        <div className="space-y-2">
          {(stepProgress.data?.files || files).map((file: UploadedFile, index: number) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <File className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 truncate">{file.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <p>Accepted file types: {allowedTypes.join(', ')}</p>
        <p>Maximum file size: {config.maxFileSize || 10}MB</p>
        <p>Maximum files: {maxFiles}</p>
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept={allowedTypes.map((t) => `.${t}`).join(',')}
        />
        <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="font-medium">Click to upload files</p>
        <p className="text-sm text-muted-foreground">or drag and drop</p>
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded files ({files.length}/{maxFiles})</p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg"
            >
              <File className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 truncate">{file.name}</span>
              <span className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        {uploading && (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={submitting || files.length === 0}
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save & Continue
        </Button>
      </div>
    </div>
  )
}
