import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, GitBranch, Users, ArrowRight } from 'lucide-react'
import { formatDate, calculateProgress } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get user's workspace
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_workspace_id')
    .eq('id', user!.id)
    .single()

  const workspaceId = profile?.current_workspace_id

  // Get flows count
  const { count: flowsCount } = await supabase
    .from('onboarding_flows')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId!)

  // Get clients count
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId!)

  // Get recent clients with onboarding progress
  const { data: recentClients } = await supabase
    .from('clients')
    .select(`
      *,
      client_onboardings (
        id,
        status,
        last_activity_at,
        flow:onboarding_flows (
          id,
          name
        ),
        step_progress:client_step_progress (
          status
        )
      )
    `)
    .eq('workspace_id', workspaceId!)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get active onboardings count
  const { count: activeOnboardingsCount } = await supabase
    .from('client_onboardings')
    .select('*, clients!inner(*)', { count: 'exact', head: true })
    .eq('clients.workspace_id', workspaceId!)
    .eq('status', 'IN_PROGRESS')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your onboarding activity.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/flows/new">
            <Button variant="outline" className="gap-2">
              <GitBranch className="h-4 w-4" />
              New Flow
            </Button>
          </Link>
          <Link href="/dashboard/clients/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Client
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flowsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active onboarding templates
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Clients in your workspace
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Onboardings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOnboardingsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Clients</CardTitle>
              <CardDescription>
                Recent clients and their onboarding progress
              </CardDescription>
            </div>
            <Link href="/dashboard/clients">
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentClients && recentClients.length > 0 ? (
            <div className="space-y-4">
              {recentClients.map((client) => {
                const onboarding = client.client_onboardings?.[0]
                const progress = onboarding?.step_progress
                  ? calculateProgress(onboarding.step_progress)
                  : 0

                return (
                  <Link
                    key={client.id}
                    href={`/dashboard/clients/${client.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {client.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {onboarding ? (
                          <>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {onboarding.flow?.name || 'No flow'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Last activity: {onboarding.last_activity_at
                                  ? formatDate(onboarding.last_activity_at)
                                  : 'Never'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={progress} className="h-2" />
                              <span className="text-sm font-medium w-10">
                                {progress}%
                              </span>
                            </div>
                            <Badge
                              variant={
                                onboarding.status === 'COMPLETED'
                                  ? 'success'
                                  : onboarding.status === 'IN_PROGRESS'
                                  ? 'warning'
                                  : 'secondary'
                              }
                            >
                              {onboarding.status.replace('_', ' ')}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline">No onboarding</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No clients yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first client to get started
              </p>
              <Link href="/dashboard/clients/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
