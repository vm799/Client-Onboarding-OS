import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Vote, Zap, Globe, Webhook } from 'lucide-react'

const roadmapItems = [
  {
    quarter: 'Q1 2026',
    status: 'in-progress',
    title: 'QuickBooks Integration',
    description: 'Sync client payment status directly with QuickBooks',
    icon: Zap,
  },
  {
    quarter: 'Q2 2026',
    status: 'planned',
    title: 'White-label Client Portals',
    description: 'Custom domains and full branding for agency portals',
    icon: Globe,
  },
  {
    quarter: 'Q2 2026',
    status: 'planned',
    title: 'Zapier Integration',
    description: 'Connect to 5000+ apps via Zapier webhooks',
    icon: Webhook,
  },
  {
    quarter: 'Voting',
    status: 'voting',
    title: 'Notion Integration',
    description: 'Sync onboarding data to Notion databases',
    icon: Vote,
  },
]

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-3xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Public Roadmap</h1>
          <p className="text-muted-foreground text-lg">
            See what we&apos;re building next. Vote on features you want.
          </p>
        </div>

        <div className="space-y-4">
          {roadmapItems.map((item, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.status === 'in-progress'
                        ? 'default'
                        : item.status === 'planned'
                        ? 'secondary'
                        : 'outline'
                    }
                    className={
                      item.status === 'in-progress'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : item.status === 'planned'
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                    }
                  >
                    {item.quarter}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Have a feature request? Email us at{' '}
            <a href="mailto:hello@clientonboardingos.com" className="text-primary hover:underline">
              hello@clientonboardingos.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
