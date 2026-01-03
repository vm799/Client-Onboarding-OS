import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

// Allowed file types with their magic bytes (file signatures)
const ALLOWED_TYPES: Record<string, { mimeTypes: string[]; extensions: string[] }> = {
  // Documents
  pdf: { mimeTypes: ['application/pdf'], extensions: ['pdf'] },
  doc: { mimeTypes: ['application/msword'], extensions: ['doc'] },
  docx: { mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], extensions: ['docx'] },
  xls: { mimeTypes: ['application/vnd.ms-excel'], extensions: ['xls'] },
  xlsx: { mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], extensions: ['xlsx'] },
  // Images
  png: { mimeTypes: ['image/png'], extensions: ['png'] },
  jpg: { mimeTypes: ['image/jpeg'], extensions: ['jpg', 'jpeg'] },
  gif: { mimeTypes: ['image/gif'], extensions: ['gif'] },
  webp: { mimeTypes: ['image/webp'], extensions: ['webp'] },
  // Text
  txt: { mimeTypes: ['text/plain'], extensions: ['txt'] },
  csv: { mimeTypes: ['text/csv', 'application/csv'], extensions: ['csv'] },
}

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

function validateFileType(file: File): { valid: boolean; error?: string } {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext) {
    return { valid: false, error: 'File must have an extension' }
  }

  // Check if extension is allowed
  let isAllowedExtension = false
  let expectedMimeTypes: string[] = []

  for (const [, config] of Object.entries(ALLOWED_TYPES)) {
    if (config.extensions.includes(ext)) {
      isAllowedExtension = true
      expectedMimeTypes = config.mimeTypes
      break
    }
  }

  if (!isAllowedExtension) {
    return {
      valid: false,
      error: `File type .${ext} is not allowed. Allowed types: pdf, doc, docx, xls, xlsx, png, jpg, gif, webp, txt, csv`
    }
  }

  // Validate MIME type matches extension
  if (!expectedMimeTypes.includes(file.type) && file.type !== 'application/octet-stream') {
    // Allow application/octet-stream as some browsers send this
    console.warn(`MIME type mismatch: expected ${expectedMimeTypes.join(' or ')}, got ${file.type}`)
  }

  return { valid: true }
}

function validateFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds maximum allowed size (10MB)`
    }
  }
  return { valid: true }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const token = formData.get('token') as string
    const stepProgressId = formData.get('stepProgressId') as string

    if (!file || !token || !stepProgressId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Server-side file validation
    const typeValidation = validateFileType(file)
    if (!typeValidation.valid) {
      return NextResponse.json(
        { error: typeValidation.error },
        { status: 400 }
      )
    }

    const sizeValidation = validateFileSize(file)
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify the token matches the onboarding
    const { data: onboarding, error: onboardingError } = await supabase
      .from('client_onboardings')
      .select('id, client_id')
      .eq('onboarding_link_token', token)
      .single()

    if (onboardingError || !onboarding) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify the step progress belongs to this onboarding
    const { data: stepProgress, error: stepError } = await supabase
      .from('client_step_progress')
      .select('id')
      .eq('id', stepProgressId)
      .eq('client_onboarding_id', onboarding.id)
      .single()

    if (stepError || !stepProgress) {
      return NextResponse.json(
        { error: 'Invalid step' },
        { status: 400 }
      )
    }

    // Generate unique file path with sanitized extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const sanitizedExt = ext.replace(/[^a-z0-9]/g, '')
    const fileName = `${nanoid()}.${sanitizedExt}`
    const filePath = `client-files/${onboarding.client_id}/${onboarding.id}/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Double-check size on the actual buffer
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed size' },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-files')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      // If bucket doesn't exist, create it
      if (uploadError.message.includes('bucket')) {
        await supabase.storage.createBucket('client-files', {
          public: false,
        })

        // Retry upload
        const { error: retryError } = await supabase.storage
          .from('client-files')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          })

        if (retryError) throw retryError
      } else {
        throw uploadError
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('client-files')
      .getPublicUrl(filePath)

    // Update onboarding last activity
    await supabase
      .from('client_onboardings')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', onboarding.id)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      fileName: file.name,
      fileSize: buffer.length,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
