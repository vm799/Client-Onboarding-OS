import { NextRequest, NextResponse } from 'next/server'
import type { StepType, StepConfig } from '@/lib/database.types'

interface GenerateFlowRequest {
  serviceDescription: string
  clientType?: string
  tone?: 'friendly' | 'formal' | 'bold'
}

interface GeneratedStep {
  type: StepType
  title: string
  description: string
  config: StepConfig
}

interface GeneratedFlow {
  name: string
  description: string
  steps: GeneratedStep[]
}

// Smart template generator - analyzes service description and generates appropriate flow
// Uses intelligent keyword matching to select and customize industry-specific templates
async function generateFlowFromTemplate(
  serviceDescription: string,
  clientType?: string,
  tone: 'friendly' | 'formal' | 'bold' = 'friendly'
): Promise<GeneratedFlow> {
  // Smart template generation based on service type detection
  // Analyzes keywords in description to select appropriate industry template

  const toneText = {
    friendly: {
      welcome: "We're so excited to work with you!",
      form: "Help us get to know you better",
      files: "Share your materials with us",
      contract: "Let's make it official",
      schedule: "Book a time to connect",
    },
    formal: {
      welcome: "Welcome to our professional services.",
      form: "Please provide the required information",
      files: "Submit necessary documentation",
      contract: "Review and accept the agreement",
      schedule: "Schedule your consultation",
    },
    bold: {
      welcome: "Let's create something amazing together!",
      form: "Tell us everything",
      files: "Show us what you've got",
      contract: "Seal the deal",
      schedule: "Let's talk",
    },
  }

  const t = toneText[tone]

  // Detect service type from description
  const isCoaching = /coach|mentor|personal development|life coach/i.test(serviceDescription)
  const isConsulting = /consult|strategy|advise|business/i.test(serviceDescription)
  const isAgency = /agency|marketing|design|creative|brand/i.test(serviceDescription)
  const isFreelance = /freelance|independent|contractor|developer|writer/i.test(serviceDescription)

  let serviceName = 'Service'
  let steps: GeneratedStep[] = []

  if (isCoaching) {
    serviceName = 'Coaching'
    steps = [
      {
        type: 'WELCOME',
        title: `Welcome to Your ${serviceName} Journey`,
        description: `${t.welcome} This onboarding will help us prepare for our work together.`,
        config: {},
      },
      {
        type: 'FORM',
        title: 'Tell Us About Yourself',
        description: t.form,
        config: {
          fields: [
            { id: '1', type: 'text', label: 'What brings you to coaching?', required: true },
            { id: '2', type: 'textarea', label: 'What are your top 3 goals for our sessions?', required: true },
            { id: '3', type: 'select', label: 'How did you hear about us?', required: false, options: [
              { label: 'Referral', value: 'referral' },
              { label: 'Social Media', value: 'social' },
              { label: 'Google Search', value: 'google' },
              { label: 'Other', value: 'other' },
            ]},
          ],
        },
      },
      {
        type: 'CONTRACT',
        title: 'Coaching Agreement',
        description: t.contract,
        config: {
          contractText: 'I understand that coaching is a partnership between myself and my coach. I commit to being open, honest, and engaged in our sessions. I understand the cancellation policy and agree to provide 24-hour notice for any schedule changes.',
          acceptButtonText: 'I agree to the coaching terms',
        },
      },
      {
        type: 'SCHEDULE',
        title: 'Book Your First Session',
        description: t.schedule,
        config: {
          schedulingUrl: '',
        },
      },
    ]
  } else if (isAgency) {
    serviceName = 'Agency'
    steps = [
      {
        type: 'WELCOME',
        title: 'Welcome to Our Creative Partnership',
        description: `${t.welcome} Let's gather everything we need to bring your vision to life.`,
        config: {},
      },
      {
        type: 'FORM',
        title: 'Project Brief',
        description: t.form,
        config: {
          fields: [
            { id: '1', type: 'text', label: 'Project Name', required: true },
            { id: '2', type: 'textarea', label: 'Describe your project goals', required: true },
            { id: '3', type: 'text', label: 'Target audience', required: true },
            { id: '4', type: 'text', label: 'Key competitors or inspirations', required: false },
            { id: '5', type: 'text', label: 'Project timeline expectations', required: false },
          ],
        },
      },
      {
        type: 'FILE_UPLOAD',
        title: 'Brand Assets & Materials',
        description: `${t.files} - Please upload any existing brand guidelines, logos, or reference materials.`,
        config: {
          maxFiles: 10,
          maxFileSize: 25,
          allowedFileTypes: ['pdf', 'png', 'jpg', 'jpeg', 'svg', 'ai', 'psd', 'doc', 'docx'],
        },
      },
      {
        type: 'CONTRACT',
        title: 'Service Agreement',
        description: t.contract,
        config: {
          contractText: 'By proceeding, you agree to our standard service terms including project scope, revision policy, intellectual property transfer upon final payment, and confidentiality provisions.',
          acceptButtonText: 'I accept the service agreement',
        },
      },
      {
        type: 'SCHEDULE',
        title: 'Kickoff Meeting',
        description: `${t.schedule} - Let's discuss your project in detail.`,
        config: {
          schedulingUrl: '',
        },
      },
    ]
  } else if (isConsulting) {
    serviceName = 'Consulting'
    steps = [
      {
        type: 'WELCOME',
        title: 'Welcome to Our Consulting Engagement',
        description: `${t.welcome} This process will help us understand your needs and prepare for our work together.`,
        config: {},
      },
      {
        type: 'FORM',
        title: 'Business Assessment',
        description: t.form,
        config: {
          fields: [
            { id: '1', type: 'text', label: 'Company Name', required: true },
            { id: '2', type: 'text', label: 'Your Role/Title', required: true },
            { id: '3', type: 'textarea', label: 'What challenges are you facing?', required: true },
            { id: '4', type: 'textarea', label: 'What outcomes are you hoping to achieve?', required: true },
            { id: '5', type: 'text', label: 'Current annual revenue range', required: false },
          ],
        },
      },
      {
        type: 'FILE_UPLOAD',
        title: 'Supporting Documents',
        description: `${t.files} - Share any relevant reports, data, or materials that will help us understand your situation.`,
        config: {
          maxFiles: 10,
          maxFileSize: 20,
          allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'],
        },
      },
      {
        type: 'CONTRACT',
        title: 'Consulting Agreement & NDA',
        description: t.contract,
        config: {
          contractText: 'This engagement is subject to our standard consulting terms. All information shared will be treated as confidential. You agree to our scope of work, fee structure, and intellectual property provisions as discussed.',
          acceptButtonText: 'I agree to the consulting terms',
        },
      },
      {
        type: 'SCHEDULE',
        title: 'Discovery Call',
        description: t.schedule,
        config: {
          schedulingUrl: '',
        },
      },
    ]
  } else {
    // Generic freelance/service flow
    serviceName = 'Service'
    steps = [
      {
        type: 'WELCOME',
        title: 'Welcome!',
        description: `${t.welcome} Let's get started with your onboarding.`,
        config: {},
      },
      {
        type: 'FORM',
        title: 'Get to Know You',
        description: t.form,
        config: {
          fields: [
            { id: '1', type: 'text', label: 'Your Name', required: true },
            { id: '2', type: 'email', label: 'Email Address', required: true },
            { id: '3', type: 'phone', label: 'Phone Number', required: false },
            { id: '4', type: 'textarea', label: 'Tell us about your project or needs', required: true },
          ],
        },
      },
      {
        type: 'FILE_UPLOAD',
        title: 'Share Relevant Files',
        description: t.files,
        config: {
          maxFiles: 5,
          maxFileSize: 10,
          allowedFileTypes: ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'],
        },
      },
      {
        type: 'CONTRACT',
        title: 'Agreement',
        description: t.contract,
        config: {
          contractText: 'By accepting, you agree to work together in good faith, maintain open communication, and adhere to the project timeline and deliverables we agree upon.',
          acceptButtonText: 'I agree',
        },
      },
      {
        type: 'SCHEDULE',
        title: 'Schedule a Call',
        description: t.schedule,
        config: {
          schedulingUrl: '',
        },
      },
    ]
  }

  // Extract a name from the description
  const nameMatch = serviceDescription.match(/(?:I'm a|I am a|We are a|We're a)\s+([^,.]+)/i)
  const extractedName = nameMatch ? nameMatch[1].trim() : serviceName

  return {
    name: `New ${extractedName.charAt(0).toUpperCase() + extractedName.slice(1)} Client`,
    description: `Onboarding flow for new clients - ${clientType || 'all clients'}`,
    steps,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateFlowRequest = await request.json()

    if (!body.serviceDescription?.trim()) {
      return NextResponse.json(
        { error: 'Service description is required' },
        { status: 400 }
      )
    }

    const flow = await generateFlowFromTemplate(
      body.serviceDescription,
      body.clientType,
      body.tone
    )

    return NextResponse.json(flow)
  } catch (error) {
    console.error('Error generating flow:', error)
    return NextResponse.json(
      { error: 'Failed to generate flow' },
      { status: 500 }
    )
  }
}
