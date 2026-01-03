import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Sparkles, Users, FileCheck } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-semibold text-xl">
            Client Onboarding OS
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
          <Sparkles className="h-4 w-4" />
          AI-Powered Onboarding Flows
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
          Streamline your client onboarding experience
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Create branded onboarding portals, collect documents, get signatures,
          and book calls — all in one beautiful flow.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need to onboard clients</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From welcome messages to document collection, build the perfect onboarding experience.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<FileCheck className="h-8 w-8 text-primary" />}
            title="Custom Forms"
            description="Build forms with text fields, dropdowns, file uploads, and more. All data stored securely."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Client Portal"
            description="Each client gets a unique, branded portal link to complete their onboarding at their own pace."
          />
          <FeatureCard
            icon={<Sparkles className="h-8 w-8 text-primary" />}
            title="AI Flow Generator"
            description="Describe your service and let AI suggest the perfect onboarding flow structure."
          />
        </div>
      </section>

      {/* Step Types */}
      <section className="container mx-auto px-4 py-24 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Flexible step types</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Mix and match these building blocks to create your ideal flow.
          </p>
        </div>
        <div className="grid md:grid-cols-5 gap-6 max-w-5xl mx-auto">
          <StepTypeCard type="Welcome" description="Greet clients with a personalized message" />
          <StepTypeCard type="Form" description="Collect information with custom fields" />
          <StepTypeCard type="File Upload" description="Request documents and files" />
          <StepTypeCard type="Contract" description="Get agreement on terms and conditions" />
          <StepTypeCard type="Schedule" description="Let clients book calls" />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="bg-primary rounded-2xl p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to streamline your onboarding?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Join hundreds of service providers who&apos;ve simplified their client onboarding process.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Client Onboarding OS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border shadow-sm">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

function StepTypeCard({ type, description }: { type: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border shadow-sm text-center">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-medium mb-1">{type}</h3>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  )
}
