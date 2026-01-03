import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

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

    // Generate unique file path
    const ext = file.name.split('.').pop()
    const fileName = `${nanoid()}.${ext}`
    const filePath = `client-files/${onboarding.client_id}/${onboarding.id}/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

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
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
