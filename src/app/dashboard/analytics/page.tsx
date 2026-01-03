import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_workspace_id')
    .eq('id', user!.id)
    .single()

  const workspaceId = profile?.current_workspace_id

  // Get all onboardings for analytics
  const { data: onboardings } = await supabase
    .from('client_onboardings')
    .select(`
      id,
      status,
      created_at,
      completed_at,
      last_activity_at,
      client:clients!inner (
        id,
        workspace_id
      ),
      step_progress:client_step_progress (
        id,
        status,
        completed_at,
        step:onboarding_steps (
          type,
          step_order
        )
      )
    `)
    .eq('clients.workspace_id', workspaceId!)

  // Calculate metrics
  const totalOnboardings = onboardings?.length || 0
  const completedOnboardings = onboardings?.filter(o => o.status === 'COMPLETED').length || 0
  const inProgressOnboardings = onboardings?.filter(o => o.status === 'IN_PROGRESS').length || 0
  const notStartedOnboardings = onboardings?.filter(o => o.status === 'NOT_STARTED').length || 0

  const completionRate = totalOnboardings > 0
    ? Math.round((completedOnboardings / totalOnboardings) * 100)
    : 0

  // Calculate average completion time (in days)
  const completedWithDates = onboardings?.filter(o => o.completed_at && o.created_at) || []
  const avgCompletionDays = completedWithDates.length > 0
    ? Math.round(
        completedWithDates.reduce((sum, o) => {
          const start = new Date(o.created_at).getTime()
          const end = new Date(o.completed_at!).getTime()
          return sum + (end - start) / (1000 * 60 * 60 * 24)
        }, 0) / completedWithDates.length
      )
    : 0

  // Calculate step drop-off rates
  const stepStats: Record<string, { total: number; completed: number }> = {}
  onboardings?.forEach(o => {
    o.step_progress?.forEach((sp: any) => {
      const stepType = sp.step?.type || 'UNKNOWN'
      if (!stepStats[stepType]) {
        stepStats[stepType] = { total: 0, completed: 0 }
      }
      stepStats[stepType].total++
      if (sp.status === 'COMPLETED') {
        stepStats[stepType].completed++
      }
    })
  })

  const stepCompletionRates = Object.entries(stepStats).map(([type, stats]) => ({
    type,
    rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    total: stats.total,
    completed: stats.completed,
  })).sort((a, b) => b.rate - a.rate)

  // Find bottlenecks (lowest completion rates)
  const bottlenecks = [...stepCompletionRates].sort((a, b) => a.rate - b.rate).slice(0, 3)

  // Calculate stalled onboardings (no activity in 7+ days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const stalledOnboardings = onboardings?.filter(o =>
    o.status === 'IN_PROGRESS' &&
    o.last_activity_at &&
    new Date(o.last_activity_at) < sevenDaysAgo
  ).length || 0

  // Time saved calculation (5 hours average per completed onboarding)
  const hoursSaved = completedOnboardings * 5

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your onboarding performance and identify opportunities to improve
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {completionRate >= 70 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">Above average</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-orange-500 mr-1" />
                  <span className="text-orange-500">Room to improve</span>
                </>
              )}
            </div>
            <Progress value={completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionDays} days</div>
            <p className="text-xs text-muted-foreground">
              {avgCompletionDays <= 3 ? 'Excellent pace' : avgCompletionDays <= 7 ? 'Good pace' : 'Consider reminders'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hoursSaved}+ hours</div>
            <p className="text-xs text-muted-foreground">
              Based on {completedOnboardings} completed onboardings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stalled Clients</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stalledOnboardings}</div>
            <p className="text-xs text-muted-foreground">
              No activity in 7+ days
            </p>
            {stalledOnboardings > 0 && (
              <Badge variant="warning" className="mt-2">Needs attention</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Status Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Status</CardTitle>
            <CardDescription>Current status of all client onboardings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{completedOnboardings}</span>
                  <span className="text-muted-foreground text-sm">
                    ({totalOnboardings > 0 ? Math.round((completedOnboardings / totalOnboardings) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <Progress value={totalOnboardings > 0 ? (completedOnboardings / totalOnboardings) * 100 : 0} className="h-2 bg-muted" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{inProgressOnboardings}</span>
                  <span className="text-muted-foreground text-sm">
                    ({totalOnboardings > 0 ? Math.round((inProgressOnboardings / totalOnboardings) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <Progress value={totalOnboardings > 0 ? (inProgressOnboardings / totalOnboardings) * 100 : 0} className="h-2 bg-muted [&>div]:bg-yellow-500" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span>Not Started</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{notStartedOnboardings}</span>
                  <span className="text-muted-foreground text-sm">
                    ({totalOnboardings > 0 ? Math.round((notStartedOnboardings / totalOnboardings) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <Progress value={totalOnboardings > 0 ? (notStartedOnboardings / totalOnboardings) * 100 : 0} className="h-2 bg-muted [&>div]:bg-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step Completion Rates</CardTitle>
            <CardDescription>How often each step type is completed</CardDescription>
          </CardHeader>
          <CardContent>
            {stepCompletionRates.length > 0 ? (
              <div className="space-y-4">
                {stepCompletionRates.map((step) => (
                  <div key={step.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{step.type.toLowerCase().replace('_', ' ')}</span>
                      <span className="font-medium">{step.rate}%</span>
                    </div>
                    <Progress value={step.rate} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No step data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottleneck Analysis */}
      {bottlenecks.length > 0 && bottlenecks[0].rate < 80 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Bottleneck Analysis
            </CardTitle>
            <CardDescription>
              These steps have the lowest completion rates and may need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {bottlenecks.map((step, index) => (
                <div key={step.type} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={index === 0 ? 'destructive' : 'secondary'}>
                      #{index + 1}
                    </Badge>
                    <span className="font-medium capitalize">
                      {step.type.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{step.rate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {step.completed} of {step.total} completed
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <h4 className="font-medium mb-2">Suggestions to improve:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Simplify complex steps or break them into smaller parts</li>
                <li>• Add clearer instructions and examples</li>
                <li>• Consider making difficult steps optional</li>
                <li>• Send targeted reminders for stuck clients</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalOnboardings === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No analytics data yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Start onboarding clients to see completion rates, bottlenecks, and time savings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
