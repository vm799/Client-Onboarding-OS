import { Resend } from 'resend'

// Lazy initialization to avoid build-time errors when API key is not set
let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const resend = getResendClient()

  // If Resend API key is not configured, log the email instead
  if (!resend) {
    console.log('Email would be sent:')
    console.log({ to, subject, html })
    return { success: true, mock: true }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send email:', error)
      throw error
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
}

export function generateWelcomeEmail(params: {
  clientName: string
  providerName: string
  onboardingLink: string
}) {
  return {
    subject: `Welcome! Let's get you onboarded with ${params.providerName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #111;">Hi ${params.clientName}!</h1>
            <p>Welcome! You've been invited to complete your onboarding with <strong>${params.providerName}</strong>.</p>
            <p>Click the button below to get started:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${params.onboardingLink}" style="display: inline-block; background-color: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Start Onboarding
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${params.onboardingLink}" style="color: #111;">${params.onboardingLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              This email was sent by Client Onboarding OS on behalf of ${params.providerName}.
            </p>
          </div>
        </body>
      </html>
    `,
  }
}

export function generateReminderEmail(params: {
  clientName: string
  providerName: string
  onboardingLink: string
  progress: number
}) {
  return {
    subject: `Reminder: Complete your onboarding with ${params.providerName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #111;">Hi ${params.clientName}!</h1>
            <p>This is a friendly reminder to complete your onboarding with <strong>${params.providerName}</strong>.</p>
            <p>You're currently <strong>${params.progress}%</strong> of the way there!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${params.onboardingLink}" style="display: inline-block; background-color: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Continue Onboarding
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${params.onboardingLink}" style="color: #111;">${params.onboardingLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              This email was sent by Client Onboarding OS on behalf of ${params.providerName}.
            </p>
          </div>
        </body>
      </html>
    `,
  }
}

export function generateCompletionNotificationEmail(params: {
  providerName: string
  clientName: string
  clientEmail: string
  flowName: string
  dashboardLink: string
}) {
  return {
    subject: `🎉 ${params.clientName} completed their onboarding!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #111;">Great news!</h1>
            <p><strong>${params.clientName}</strong> (${params.clientEmail}) has completed their onboarding for "${params.flowName}".</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${params.dashboardLink}" style="display: inline-block; background-color: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                View in Dashboard
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              This notification was sent by Client Onboarding OS.
            </p>
          </div>
        </body>
      </html>
    `,
  }
}
