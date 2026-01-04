import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Users, Mail, MoreHorizontal, ExternalLink, Trash2 } from 'lucide-react'
import { formatDate, calculateProgress } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function ClientsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await (supabase
    .from('profiles') as any)
    .select('current_workspace_id')
    .eq('id', user!.id)
    .single()

  const workspaceId = profile?.current_workspace_id

  const { data: clients } = await (supabase
    .from('clients') as any)
    .select(`
      *,
      client_onboardings (
        id,
        status,
        onboarding_link_token,
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your clients and their onboarding progress
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      {clients && clients.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Flow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client: any) => {
                const onboarding = client.client_onboardings?.[0]
                const progress = onboarding?.step_progress
                  ? calculateProgress(onboarding.step_progress)
                  : 0
                const portalUrl = onboarding
                  ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/c/${onboarding.onboarding_link_token}`
                  : null

                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="block hover:underline"
                      >
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {client.email}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {onboarding?.flow?.name || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {onboarding ? (
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
                      ) : (
                        <Badge variant="outline">No onboarding</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {onboarding ? (
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={progress} className="h-2" />
                          <span className="text-sm text-muted-foreground w-8">
                            {progress}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {onboarding?.last_activity_at ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(onboarding.last_activity_at)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/clients/${client.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {portalUrl && (
                            <DropdownMenuItem asChild>
                              <a href={portalUrl} target="_blank" rel="noopener">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open Portal
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Reminder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No clients yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Add your first client to start tracking their onboarding journey.
            </p>
            <Link href="/dashboard/clients/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
