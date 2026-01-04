import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Rocket, Sparkles, Shield, Zap } from 'lucide-react'

const changelogEntries = [
  {
    version: 'v1.0.0',
    date: 'January 2026',
    title: 'Live on AppSumo!',
    type: 'major',
    icon: Rocket,
    changes: [
      'Production launch with full token tracking system',
      'AI-powered flow generation with Claude',
      'Client portal with secure onboarding links',
      'Real-time progress tracking and notifications',
      'Enterprise-grade error handling',
    ],
  },
  {
    version: 'v0.9.0',
    date: 'December 2025',
    title: 'Beta Launch',
    type: 'beta',
    icon: Sparkles,
    changes: [
      'Complete onboarding flow builder',
      'File upload with security validation',
      'Contract signing step integration',
      'Scheduling step with calendar links',
      'Mobile-responsive client portal',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-3xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Changelog</h1>
          <p className="text-muted-foreground text-lg">
            All the latest updates and improvements to Client Onboarding OS.
          </p>
        </div>

        <div className="space-y-8">
          {changelogEntries.map((entry, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      entry.type === 'major'
                        ? 'bg-green-100'
                        : entry.type === 'beta'
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <entry.icon
                      className={`h-6 w-6 ${
                        entry.type === 'major'
                          ? 'text-green-600'
                          : entry.type === 'beta'
                          ? 'text-blue-600'
                          : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-xl">{entry.title}</CardTitle>
                      <Badge variant="outline">{entry.version}</Badge>
                    </div>
                    <CardDescription>{entry.date}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {entry.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-1">+</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-xl text-center">
          <p className="text-sm text-muted-foreground">
            Stay updated on new features by following our{' '}
            <a href="/roadmap" className="text-primary hover:underline">
              public roadmap
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
