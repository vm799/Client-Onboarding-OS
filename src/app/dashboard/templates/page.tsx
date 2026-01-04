'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Briefcase,
  Users,
  Palette,
  Scale,
  Stethoscope,
  GraduationCap,
  Camera,
  Code,
  Home,
  Loader2,
  Plus,
  ArrowRight,
  Star,
} from 'lucide-react'

const TEMPLATES = [
  {
    id: 'coaching',
    name: 'Life & Business Coaching',
    description: 'Intake forms, coaching agreement, and session booking for coaches and mentors',
    icon: Users,
    category: 'Coaching',
    popular: true,
    steps: 4,
    template: {
      name: 'New Coaching Client',
      description: 'Complete coaching client onboarding with intake, agreement, and scheduling',
      steps: [
        {
          type: 'WELCOME',
          title: 'Welcome to Your Transformation Journey',
          description: 'We\'re excited to partner with you on your growth! This quick onboarding will help us understand you better.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Client Intake',
          description: 'Help us understand your goals and background',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'What brings you to coaching today?', required: true },
              { id: '2', type: 'textarea', label: 'What are your top 3 goals?', required: true },
              { id: '3', type: 'text', label: 'What does success look like in 90 days?', required: true },
              { id: '4', type: 'select', label: 'How did you hear about us?', required: false, options: [
                { label: 'Referral', value: 'referral' },
                { label: 'Social Media', value: 'social' },
                { label: 'Google', value: 'google' },
                { label: 'Podcast', value: 'podcast' },
                { label: 'Other', value: 'other' },
              ]},
            ],
          },
        },
        {
          type: 'CONTRACT',
          title: 'Coaching Agreement',
          description: 'Review and accept our coaching terms',
          config: {
            contractText: 'COACHING AGREEMENT\n\n1. COMMITMENT: Coaching is a partnership requiring your active participation.\n\n2. CONFIDENTIALITY: All session information is kept confidential.\n\n3. SESSIONS: Please provide 24-hour notice for cancellations.\n\n4. INVESTMENT: Payment is due as agreed upon.\n\nBy accepting, you agree to these terms.',
            acceptButtonText: 'I agree to the coaching terms',
          },
        },
        {
          type: 'SCHEDULE',
          title: 'Book Your First Session',
          description: 'Let\'s get your first session on the calendar',
          config: { schedulingUrl: '' },
        },
      ],
    },
  },
  {
    id: 'agency',
    name: 'Marketing & Creative Agency',
    description: 'Project briefs, brand asset collection, and kickoff meeting for agencies',
    icon: Palette,
    category: 'Agency',
    popular: true,
    steps: 5,
    template: {
      name: 'New Agency Client',
      description: 'Complete agency onboarding with project brief, assets, and kickoff',
      steps: [
        {
          type: 'WELCOME',
          title: 'Welcome to the Team!',
          description: 'We\'re thrilled to work with you. Let\'s gather everything we need to kick off your project.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Project Brief',
          description: 'Tell us about your project goals and requirements',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Project Name', required: true },
              { id: '2', type: 'textarea', label: 'Project Goals', required: true },
              { id: '3', type: 'text', label: 'Target Audience', required: true },
              { id: '4', type: 'textarea', label: 'Competitors or Inspirations', required: false },
              { id: '5', type: 'text', label: 'Ideal Deadline', required: true },
            ],
          },
        },
        {
          type: 'FILE_UPLOAD',
          title: 'Brand Assets',
          description: 'Upload logos, brand guidelines, and reference materials',
          config: { maxFiles: 20, maxFileSize: 50, allowedFileTypes: ['pdf', 'png', 'jpg', 'svg', 'ai', 'psd', 'zip'] },
        },
        {
          type: 'CONTRACT',
          title: 'Service Agreement',
          description: 'Review and accept our terms of service',
          config: {
            contractText: 'SERVICE AGREEMENT\n\n1. SCOPE: Services delivered as outlined in your proposal.\n\n2. REVISIONS: Includes agreed revision rounds.\n\n3. TIMELINE: Contingent on timely feedback.\n\n4. PAYMENT: Per invoice terms.\n\n5. OWNERSHIP: Final deliverables yours upon full payment.\n\nBy accepting, you agree to these terms.',
            acceptButtonText: 'I agree to the service terms',
          },
        },
        {
          type: 'SCHEDULE',
          title: 'Kickoff Call',
          description: 'Book your project kickoff meeting',
          config: { schedulingUrl: '' },
        },
      ],
    },
  },
  {
    id: 'consulting',
    name: 'Business Consulting',
    description: 'Business assessment, NDA, document collection for consultants',
    icon: Briefcase,
    category: 'Consulting',
    popular: true,
    steps: 5,
    template: {
      name: 'New Consulting Client',
      description: 'Strategic consulting engagement onboarding',
      steps: [
        {
          type: 'WELCOME',
          title: 'Welcome to Our Consulting Partnership',
          description: 'We look forward to helping your business thrive.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Business Assessment',
          description: 'Help us understand your business and challenges',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Company Name', required: true },
              { id: '2', type: 'text', label: 'Your Role', required: true },
              { id: '3', type: 'textarea', label: 'Current Challenges', required: true },
              { id: '4', type: 'textarea', label: 'Desired Outcomes', required: true },
              { id: '5', type: 'text', label: 'Annual Revenue Range', required: false },
            ],
          },
        },
        {
          type: 'FILE_UPLOAD',
          title: 'Supporting Documents',
          description: 'Share relevant reports, data, or materials',
          config: { maxFiles: 15, maxFileSize: 25, allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'] },
        },
        {
          type: 'CONTRACT',
          title: 'Consulting Agreement & NDA',
          description: 'Review and accept terms including confidentiality',
          config: {
            contractText: 'CONSULTING AGREEMENT\n\n1. SCOPE: As discussed and agreed.\n\n2. CONFIDENTIALITY: All shared information kept confidential.\n\n3. FEES: Per engagement letter.\n\n4. DELIVERABLES: As outlined in scope.\n\nBy accepting, you agree to these terms.',
            acceptButtonText: 'I agree to the consulting terms',
          },
        },
        {
          type: 'SCHEDULE',
          title: 'Discovery Call',
          description: 'Book your initial strategy session',
          config: { schedulingUrl: '' },
        },
      ],
    },
  },
  {
    id: 'legal',
    name: 'Legal Services',
    description: 'Client intake, conflict check, engagement letter for law firms',
    icon: Scale,
    category: 'Professional',
    steps: 4,
    template: {
      name: 'New Legal Client',
      description: 'Legal services client intake',
      steps: [
        {
          type: 'WELCOME',
          title: 'Welcome to Our Firm',
          description: 'Thank you for choosing us for your legal needs.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Client Intake',
          description: 'Please provide your information',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Full Legal Name', required: true },
              { id: '2', type: 'email', label: 'Email', required: true },
              { id: '3', type: 'phone', label: 'Phone', required: true },
              { id: '4', type: 'text', label: 'Address', required: true },
              { id: '5', type: 'textarea', label: 'Brief Description of Your Matter', required: true },
            ],
          },
        },
        {
          type: 'FILE_UPLOAD',
          title: 'Relevant Documents',
          description: 'Upload any documents related to your matter',
          config: { maxFiles: 20, maxFileSize: 25, allowedFileTypes: ['pdf', 'doc', 'docx', 'png', 'jpg'] },
        },
        {
          type: 'CONTRACT',
          title: 'Engagement Letter',
          description: 'Review and accept our engagement terms',
          config: {
            contractText: 'ENGAGEMENT LETTER\n\n1. SCOPE: Legal services as discussed.\n\n2. FEES: Billed as outlined.\n\n3. CONFIDENTIALITY: Attorney-client privilege applies.\n\n4. COMMUNICATION: We will keep you informed.\n\nBy accepting, you authorize this engagement.',
            acceptButtonText: 'I accept the engagement terms',
          },
        },
      ],
    },
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Wellness',
    description: 'Health intake, consent forms, and appointment booking',
    icon: Stethoscope,
    category: 'Healthcare',
    steps: 4,
    template: {
      name: 'New Patient Intake',
      description: 'Healthcare provider patient onboarding',
      steps: [
        {
          type: 'WELCOME',
          title: 'Welcome to Our Practice',
          description: 'We\'re committed to your health and wellness.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Patient Information',
          description: 'Please complete your intake form',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Full Name', required: true },
              { id: '2', type: 'text', label: 'Date of Birth', required: true },
              { id: '3', type: 'phone', label: 'Phone Number', required: true },
              { id: '4', type: 'email', label: 'Email', required: true },
              { id: '5', type: 'textarea', label: 'Primary Health Concerns', required: true },
              { id: '6', type: 'textarea', label: 'Current Medications', required: false },
            ],
          },
        },
        {
          type: 'CONTRACT',
          title: 'Consent & Privacy',
          description: 'Review and accept consent forms',
          config: {
            contractText: 'CONSENT FORM\n\n1. I consent to receive treatment.\n\n2. I understand my health information is protected.\n\n3. I agree to the cancellation policy.\n\n4. I authorize billing to my insurance (if applicable).',
            acceptButtonText: 'I consent to treatment',
          },
        },
        {
          type: 'SCHEDULE',
          title: 'Book Appointment',
          description: 'Schedule your first appointment',
          config: { schedulingUrl: '' },
        },
      ],
    },
  },
  {
    id: 'education',
    name: 'Online Course / Education',
    description: 'Student enrollment, learning goals, and course access',
    icon: GraduationCap,
    category: 'Education',
    steps: 3,
    template: {
      name: 'New Student Enrollment',
      description: 'Course enrollment onboarding',
      steps: [
        {
          type: 'WELCOME',
          title: 'Welcome to the Course!',
          description: 'You\'re about to embark on an exciting learning journey.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Student Profile',
          description: 'Tell us about yourself and your goals',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Your Name', required: true },
              { id: '2', type: 'email', label: 'Email', required: true },
              { id: '3', type: 'textarea', label: 'What do you hope to learn?', required: true },
              { id: '4', type: 'select', label: 'Experience Level', required: true, options: [
                { label: 'Beginner', value: 'beginner' },
                { label: 'Intermediate', value: 'intermediate' },
                { label: 'Advanced', value: 'advanced' },
              ]},
            ],
          },
        },
        {
          type: 'CONTRACT',
          title: 'Course Agreement',
          description: 'Review course policies',
          config: {
            contractText: 'COURSE AGREEMENT\n\n1. Access is for personal use only.\n\n2. No sharing of course materials.\n\n3. Refund policy as stated at purchase.\n\n4. Community guidelines apply.',
            acceptButtonText: 'I agree to the course terms',
          },
        },
      ],
    },
  },
  {
    id: 'photography',
    name: 'Photography / Videography',
    description: 'Shoot details, style preferences, and model releases',
    icon: Camera,
    category: 'Creative',
    steps: 5,
    template: {
      name: 'New Photo/Video Client',
      description: 'Photography and videography client onboarding',
      steps: [
        {
          type: 'WELCOME',
          title: 'Let\'s Create Something Beautiful',
          description: 'We\'re excited to capture your special moments.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Project Details',
          description: 'Tell us about your shoot',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Event/Project Type', required: true },
              { id: '2', type: 'text', label: 'Date & Location', required: true },
              { id: '3', type: 'textarea', label: 'Style & Vision', required: true },
              { id: '4', type: 'textarea', label: 'Must-Have Shots', required: false },
            ],
          },
        },
        {
          type: 'FILE_UPLOAD',
          title: 'Inspiration & References',
          description: 'Share mood boards, Pinterest links, or example photos',
          config: { maxFiles: 20, maxFileSize: 25, allowedFileTypes: ['png', 'jpg', 'jpeg', 'pdf'] },
        },
        {
          type: 'CONTRACT',
          title: 'Photography Agreement',
          description: 'Review and sign the contract',
          config: {
            contractText: 'PHOTOGRAPHY AGREEMENT\n\n1. Deposit secures your date.\n\n2. Photographer retains copyright; you receive usage license.\n\n3. Final images delivered within stated timeline.\n\n4. Cancellation policy applies.',
            acceptButtonText: 'I agree to the photography terms',
          },
        },
        {
          type: 'SCHEDULE',
          title: 'Consultation Call',
          description: 'Book a pre-shoot planning call',
          config: { schedulingUrl: '' },
        },
      ],
    },
  },
  {
    id: 'developer',
    name: 'Web Development / Tech',
    description: 'Project requirements, tech stack, and access credentials',
    icon: Code,
    category: 'Tech',
    steps: 5,
    template: {
      name: 'New Development Client',
      description: 'Web development project onboarding',
      steps: [
        {
          type: 'WELCOME',
          title: 'Let\'s Build Something Great',
          description: 'We\'re ready to bring your vision to life.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Project Requirements',
          description: 'Tell us about your project',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Project Name', required: true },
              { id: '2', type: 'textarea', label: 'Project Description', required: true },
              { id: '3', type: 'textarea', label: 'Key Features Needed', required: true },
              { id: '4', type: 'text', label: 'Target Launch Date', required: true },
              { id: '5', type: 'textarea', label: 'Reference Sites (URLs)', required: false },
            ],
          },
        },
        {
          type: 'FORM',
          title: 'Technical Access',
          description: 'Provide access to necessary accounts',
          config: {
            fields: [
              { id: '1', type: 'text', label: 'Domain Registrar', required: false },
              { id: '2', type: 'text', label: 'Current Hosting', required: false },
              { id: '3', type: 'textarea', label: 'Other Accounts We\'ll Need', required: false },
            ],
          },
        },
        {
          type: 'CONTRACT',
          title: 'Development Agreement',
          description: 'Review project terms',
          config: {
            contractText: 'DEVELOPMENT AGREEMENT\n\n1. Scope as defined in proposal.\n\n2. Milestone payments apply.\n\n3. Code ownership transfers upon full payment.\n\n4. 30-day bug fix warranty included.',
            acceptButtonText: 'I agree to the development terms',
          },
        },
        {
          type: 'SCHEDULE',
          title: 'Kickoff Call',
          description: 'Book your project kickoff',
          config: { schedulingUrl: '' },
        },
      ],
    },
  },
  {
    id: 'realestate',
    name: 'Real Estate',
    description: 'Buyer/seller intake, property preferences, and document collection',
    icon: Home,
    category: 'Real Estate',
    steps: 4,
    template: {
      name: 'New Real Estate Client',
      description: 'Real estate client onboarding',
      steps: [
        {
          type: 'WELCOME',
          title: 'Welcome to Your Home Journey',
          description: 'We\'re here to help you find your perfect property.',
          config: {},
        },
        {
          type: 'FORM',
          title: 'Client Profile',
          description: 'Tell us about your property needs',
          config: {
            fields: [
              { id: '1', type: 'select', label: 'Are you looking to...', required: true, options: [
                { label: 'Buy', value: 'buy' },
                { label: 'Sell', value: 'sell' },
                { label: 'Both', value: 'both' },
              ]},
              { id: '2', type: 'text', label: 'Preferred Location/Area', required: true },
              { id: '3', type: 'text', label: 'Budget Range', required: true },
              { id: '4', type: 'text', label: 'Timeline', required: true },
              { id: '5', type: 'textarea', label: 'Must-Have Features', required: false },
            ],
          },
        },
        {
          type: 'FILE_UPLOAD',
          title: 'Pre-Approval & Documents',
          description: 'Upload pre-approval letter or relevant documents',
          config: { maxFiles: 10, maxFileSize: 15, allowedFileTypes: ['pdf', 'doc', 'docx', 'png', 'jpg'] },
        },
        {
          type: 'SCHEDULE',
          title: 'Consultation',
          description: 'Book your property consultation',
          config: { schedulingUrl: '' },
        },
      ],
    },
  },
]

export default function TemplatesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleUseTemplate = async (template: typeof TEMPLATES[0]) => {
    setLoading(template.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('current_workspace_id')
        .eq('id', user!.id)
        .single()

      // Create the flow from template
      const { data: flow, error } = await (supabase
        .from('onboarding_flows') as any)
        .insert({
          workspace_id: profile!.current_workspace_id!,
          name: template.template.name,
          description: template.template.description,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error

      // Create steps
      const stepsToInsert = template.template.steps.map((step, index) => ({
        flow_id: flow.id,
        step_order: index,
        type: step.type,
        title: step.title,
        description: step.description,
        config: step.config,
      }))

      await (supabase.from('onboarding_steps') as any).insert(stepsToInsert)

      toast({
        title: 'Template Applied!',
        description: 'Your flow is ready to customize.',
      })

      router.push(`/dashboard/flows/${flow.id}`)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to create flow from template',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  const categories = Array.from(new Set(TEMPLATES.map(t => t.category)))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground">
          Start with a proven template and customize it for your business
        </p>
      </div>

      {/* Popular Templates */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Popular Templates
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TEMPLATES.filter(t => t.popular).map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <template.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary">{template.steps} steps</Badge>
                </div>
                <CardTitle className="mt-4">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full gap-2"
                  onClick={() => handleUseTemplate(template)}
                  disabled={loading === template.id}
                >
                  {loading === template.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Use Template
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* All Templates by Category */}
      {categories.map((category) => (
        <div key={category}>
          <h2 className="text-lg font-semibold mb-4">{category}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {TEMPLATES.filter(t => t.category === category && !t.popular).map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <template.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{template.steps} steps</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleUseTemplate(template)}
                    disabled={loading === template.id}
                  >
                    {loading === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Use Template
                        <Plus className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
