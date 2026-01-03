'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  Briefcase,
  Users,
  Sparkles,
  Check,
  Building,
  Palette,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'business', title: 'Your Business', icon: Briefcase },
  { id: 'branding', title: 'Branding', icon: Palette },
  { id: 'first-flow', title: 'First Flow', icon: Users },
  { id: 'complete', title: 'Ready!', icon: Check },
]

const SERVICE_TYPES = [
  { id: 'coaching', label: 'Coaching & Consulting', description: 'Life coaches, business coaches, consultants' },
  { id: 'agency', label: 'Agency / Creative', description: 'Marketing, design, development agencies' },
  { id: 'freelance', label: 'Freelancer', description: 'Independent professionals, contractors' },
  { id: 'professional', label: 'Professional Services', description: 'Accountants, lawyers, therapists' },
]

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Form data
  const [businessName, setBusinessName] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [brandColor, setBrandColor] = useState('#3b82f6')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [createSampleFlow, setCreateSampleFlow] = useState(true)

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_workspace_id')
        .eq('id', user!.id)
        .single()

      const workspaceId = profile!.current_workspace_id!

      // Upload logo if provided
      let logoUrl = null
      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const fileName = `${workspaceId}-logo.${ext}`
        const filePath = `logos/${fileName}`

        await supabase.storage.from('workspace-assets').upload(filePath, logoFile, { upsert: true })
        const { data: urlData } = supabase.storage.from('workspace-assets').getPublicUrl(filePath)
        logoUrl = urlData.publicUrl
      }

      // Update workspace
      await supabase
        .from('workspaces')
        .update({
          name: businessName,
          brand_color: brandColor,
          logo_url: logoUrl,
        })
        .eq('id', workspaceId)

      // Create sample flow based on service type
      if (createSampleFlow && serviceType) {
        const template = getTemplateForServiceType(serviceType)

        const { data: flow } = await supabase
          .from('onboarding_flows')
          .insert({
            workspace_id: workspaceId,
            name: template.name,
            description: template.description,
            status: 'draft',
          })
          .select()
          .single()

        if (flow) {
          const stepsToInsert = template.steps.map((step, index) => ({
            flow_id: flow.id,
            step_order: index,
            type: step.type,
            title: step.title,
            description: step.description,
            config: step.config,
          }))

          await supabase.from('onboarding_steps').insert(stepsToInsert)
        }
      }

      // Mark onboarding as complete in user profile
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user!.id)

      toast({
        title: '🎉 You\'re all set!',
        description: 'Your workspace is ready. Let\'s get your first client onboarded!',
      })

      onComplete()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to complete setup. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return businessName.trim().length > 0
      case 2: return true
      case 3: return serviceType !== ''
      default: return true
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Client Onboarding OS!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's set up your workspace in under 2 minutes. Your clients will love the experience.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5 min</div>
                <div className="text-sm text-muted-foreground">Average setup time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">90%</div>
                <div className="text-sm text-muted-foreground">Client completion rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5+ hrs</div>
                <div className="text-sm text-muted-foreground">Saved per client</div>
              </div>
            </div>
          </motion.div>
        )

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Building className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Tell us about your business</h2>
              <p className="text-muted-foreground">This helps us personalize your experience</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">Business or Brand Name *</Label>
                <Input
                  id="business-name"
                  placeholder="e.g., Acme Consulting"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="text-lg py-6"
                />
              </div>
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Palette className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Brand your client portal</h2>
              <p className="text-muted-foreground">Make it feel like your own</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo (optional)</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    {logoPreview ? (
                      <Image src={logoPreview} alt="Logo preview" width={64} height={64} className="h-16 w-auto mx-auto rounded object-contain" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="font-mono flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-4">
                    {logoPreview ? (
                      <Image src={logoPreview} alt="Logo" width={40} height={40} className="h-10 w-auto rounded object-contain" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: brandColor }}
                      >
                        {businessName[0] || 'A'}
                      </div>
                    )}
                    <span className="font-semibold">{businessName || 'Your Business'}</span>
                  </div>
                  <div
                    className="p-3 rounded text-center text-white text-sm font-medium"
                    style={{ backgroundColor: brandColor }}
                  >
                    Continue
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Briefcase className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-bold">What type of service do you offer?</h2>
              <p className="text-muted-foreground">We&apos;ll create a starter template for you</p>
            </div>
            <div className="grid gap-3">
              {SERVICE_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setServiceType(type.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    serviceType === type.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-muted-foreground">{type.description}</div>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={createSampleFlow}
                onChange={(e) => setCreateSampleFlow(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-muted-foreground">
                Create a starter flow template for me (recommended)
              </span>
            </label>
          </motion.div>
        )

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your workspace is ready. {createSampleFlow && 'We\'ve created a starter flow for you.'}
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-left max-w-sm mx-auto">
              <h4 className="font-medium mb-2">Quick Start Guide:</h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Review your starter flow in Flows</li>
                <li>2. Customize steps to fit your process</li>
                <li>3. Add your first client</li>
                <li>4. Send them the onboarding link</li>
              </ol>
            </div>
          </motion.div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </CardContent>
        <div className="px-6 pb-6 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function getTemplateForServiceType(serviceType: string) {
  const templates: Record<string, any> = {
    coaching: {
      name: 'New Coaching Client',
      description: 'Onboard new coaching clients with intake forms, agreements, and scheduling',
      steps: [
        {
          type: 'WELCOME',
          title: 'Welcome to Your Transformation Journey',
          description: 'We\'re excited to partner with you on your growth! This onboarding process will help us understand you better and set you up for success.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Client Intake Form',
          description: 'Help us understand your background and goals',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'What brings you to coaching today?', required: true },
              { id: '2', type: 'textarea', label: 'What are your top 3 goals for our work together?', required: true },
              { id: '3', type: 'text', label: 'What does success look like for you in 90 days?', required: true },
              { id: '4', type: 'textarea', label: 'What obstacles have you faced in the past?', required: false },
              { id: '5', type: 'select', label: 'How did you hear about us?', required: false, options: [
                { label: 'Referral', value: 'referral' },
                { label: 'Social Media', value: 'social' },
                { label: 'Google Search', value: 'search' },
                { label: 'Podcast', value: 'podcast' },
                { label: 'Other', value: 'other' },
              ]},
            ],
          },
        },
        {
          type: 'CONTRACT',
          title: 'Coaching Agreement',
          description: 'Please review and accept our coaching terms',
          config: {
            contractText: `COACHING AGREEMENT

This agreement outlines the terms of our coaching relationship:

1. COMMITMENT: Coaching is a partnership. Your active participation and commitment are essential for achieving results.

2. CONFIDENTIALITY: All information shared during sessions is confidential unless there's risk of harm.

3. SESSIONS: Please provide 24-hour notice for any cancellations or rescheduling.

4. COMMUNICATION: Between sessions, you may reach out via email. I'll respond within 48 business hours.

5. INVESTMENT: Your coaching investment is due as agreed. Refunds are available within 14 days of starting.

6. RESPONSIBILITY: You are responsible for your own decisions and actions. Coaching provides guidance, not guarantees.

By accepting, you acknowledge that you understand and agree to these terms.`,
            acceptButtonText: 'I agree to the coaching terms',
          },
        },
        {
          type: 'SCHEDULE',
          title: 'Book Your First Session',
          description: 'Let\'s get your first coaching session on the calendar!',
          config: {
            schedulingUrl: '',
          },
        },
      ],
    },
    agency: {
      name: 'New Agency Client',
      description: 'Collect project requirements, brand assets, and agreements from new clients',
      steps: [
        {
          type: 'WELCOME',
          title: 'Welcome to the Team!',
          description: 'We\'re thrilled to work with you. This onboarding process will help us gather everything we need to kick off your project successfully.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Project Brief',
          description: 'Tell us about your project and goals',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Project Name', required: true },
              { id: '2', type: 'textarea', label: 'Describe your project goals', required: true },
              { id: '3', type: 'text', label: 'Target audience', required: true },
              { id: '4', type: 'textarea', label: 'Key competitors or inspirations (with links)', required: false },
              { id: '5', type: 'text', label: 'Ideal project completion date', required: true },
              { id: '6', type: 'textarea', label: 'Any specific requirements or constraints?', required: false },
            ],
          },
        },
        {
          type: 'FILE_UPLOAD',
          title: 'Brand Assets',
          description: 'Please upload your existing brand materials (logos, guidelines, fonts, etc.)',
          config: {
            maxFiles: 20,
            maxFileSize: 50,
            allowedFileTypes: ['pdf', 'png', 'jpg', 'jpeg', 'svg', 'ai', 'psd', 'eps', 'zip'],
          },
        },
        {
          type: 'FORM',
          title: 'Access & Credentials',
          description: 'Provide access to relevant accounts and platforms',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Website URL (if applicable)', required: false },
              { id: '2', type: 'textarea', label: 'Social media accounts and handles', required: false },
              { id: '3', type: 'textarea', label: 'Any other accounts we need access to?', required: false },
            ],
          },
        },
        {
          type: 'CONTRACT',
          title: 'Service Agreement',
          description: 'Review and accept our terms of service',
          config: {
            contractText: `SERVICE AGREEMENT

1. SCOPE: Services will be delivered as outlined in your proposal.

2. REVISIONS: Your package includes [X] rounds of revisions. Additional revisions may incur extra charges.

3. TIMELINE: We'll deliver within the agreed timeline, contingent on timely feedback and approvals from your team.

4. PAYMENT: Payment terms as per your invoice. Work pauses on overdue accounts.

5. OWNERSHIP: You own final deliverables upon full payment. We retain rights to work-in-progress.

6. CONFIDENTIALITY: We keep your business information confidential.

By accepting, you agree to these terms and are authorized to do so on behalf of your organization.`,
            acceptButtonText: 'I agree to the service terms',
          },
        },
        {
          type: 'SCHEDULE',
          title: 'Kickoff Call',
          description: 'Book your project kickoff meeting',
          config: {
            schedulingUrl: '',
          },
        },
      ],
    },
    freelance: {
      name: 'New Client Onboarding',
      description: 'Simple onboarding flow for freelance clients',
      steps: [
        {
          type: 'WELCOME',
          title: 'Welcome!',
          description: 'Thanks for choosing to work with me. Let\'s get you set up quickly so we can start creating great work together.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Project Details',
          description: 'Tell me about your project',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Project name or description', required: true },
              { id: '2', type: 'textarea', label: 'What are your main goals for this project?', required: true },
              { id: '3', type: 'text', label: 'Ideal deadline or timeline', required: true },
              { id: '4', type: 'text', label: 'Budget range', required: false },
            ],
          },
        },
        {
          type: 'FILE_UPLOAD',
          title: 'Reference Materials',
          description: 'Upload any files, examples, or references that will help with the project',
          config: {
            maxFiles: 10,
            maxFileSize: 25,
            allowedFileTypes: ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'zip'],
          },
        },
        {
          type: 'CONTRACT',
          title: 'Working Agreement',
          description: 'Let\'s align on how we\'ll work together',
          config: {
            contractText: `WORKING AGREEMENT

By proceeding, you agree to:

- Provide timely feedback (within 48 hours when possible)
- Respect the agreed project scope and timeline
- Pay invoices within the agreed terms
- Communicate openly about any concerns or changes

I agree to:
- Deliver quality work within the agreed timeline
- Keep you updated on progress
- Be responsive to questions and feedback
- Maintain confidentiality of your project details

Let's create something great together!`,
            acceptButtonText: 'I agree - let\'s do this!',
          },
        },
        {
          type: 'SCHEDULE',
          title: 'Let\'s Talk',
          description: 'Book a quick call to discuss your project',
          config: {
            schedulingUrl: '',
          },
        },
      ],
    },
    professional: {
      name: 'New Client Intake',
      description: 'Professional services intake with detailed information collection',
      steps: [
        {
          type: 'WELCOME',
          title: 'Welcome to Our Practice',
          description: 'Thank you for choosing us. Please complete the following steps to help us serve you better.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Client Information',
          description: 'Please provide your contact and background information',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Full Legal Name', required: true },
              { id: '2', type: 'email', label: 'Email Address', required: true },
              { id: '3', type: 'phone', label: 'Phone Number', required: true },
              { id: '4', type: 'text', label: 'Address', required: true },
              { id: '5', type: 'text', label: 'Company/Organization (if applicable)', required: false },
              { id: '6', type: 'textarea', label: 'How can we help you today?', required: true },
            ],
          },
        },
        {
          type: 'FILE_UPLOAD',
          title: 'Supporting Documents',
          description: 'Upload any relevant documents for your case/matter',
          config: {
            maxFiles: 15,
            maxFileSize: 25,
            allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'],
          },
        },
        {
          type: 'CONTRACT',
          title: 'Engagement Agreement',
          description: 'Please review and accept our terms of engagement',
          config: {
            contractText: `ENGAGEMENT AGREEMENT

This agreement governs our professional relationship:

1. SCOPE: Services will be provided as discussed and agreed upon.

2. FEES: Fees and billing arrangements are as outlined in your engagement letter.

3. CONFIDENTIALITY: All client information is kept strictly confidential in accordance with professional standards.

4. COMMUNICATION: We will keep you informed of progress and any significant developments.

5. COOPERATION: Your cooperation in providing requested information is essential.

6. TERMINATION: Either party may terminate this engagement with written notice.

By accepting, you confirm you understand and agree to these terms.`,
            acceptButtonText: 'I accept the engagement terms',
          },
        },
        {
          type: 'SCHEDULE',
          title: 'Initial Consultation',
          description: 'Book your initial consultation appointment',
          config: {
            schedulingUrl: '',
          },
        },
      ],
    },
  }

  return templates[serviceType] || templates.freelance
}
