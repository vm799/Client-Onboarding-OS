import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Mail,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  FileText,
  Upload,
  FileCheck,
  Calendar,
  AlertTriangle,
  Clock,
  Tag,
} from 'lucide-react'
import { formatDate, formatDateTime, calculateProgress, getDueDateStatus, formatRelativeDate } from '@/lib/utils'
import { CopyLinkButton } from '@/components/clients/copy-link-button'
import { SendReminderButton } from '@/components/clients/send-reminder-button'
import type { StepType } from '@/lib/database.types'

const stepTypeIcons: Record<StepType, React.ReactNode> = {
  WELCOME: <MessageSquare className="h-4 w-4" />,
  FORM: <FileText className="h-4 w-4" />,
  FILE_UPLOAD: <Upload className="h-4 w-4" />,
  CONTRACT: <FileCheck className="h-4 w-4" />,
  SCHEDULE: <Calendar className="h-4 w-4" />,
}

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      *,
      client_onboardings (
        id,
        status,
        onboarding_link_token,
        last_activity_at,
        completed_at,
        created_at,
        due_date,
        priority,
        flow:onboarding_flows (
          id,
          name,
          description
        ),
        step_progress:client_step_progress (
          id,
          status,
          completed_at,
          due_date,
          data,
          step:onboarding_steps (
            id,
            step_order,
            type,
            title,
            description
          )
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !client) {
    notFound()
  }

  const onboarding = client.client_onboardings?.[0]
  const stepProgress = onboarding?.step_progress
    ?.sort((a: any, b: any) => a.step.step_order - b.step.step_order)
  const progress = stepProgress ? calculateProgress(stepProgress) : 0
  const portalUrl = onboarding
    ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/c/${onboarding.onboarding_link_token}`
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground">{client.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onboarding && <SendReminderButton clientId={client.id} email={client.email} />}
          {portalUrl && (
            <a href={portalUrl} target="_blank" rel="noopener">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Portal
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Onboarding Status */}
          {onboarding ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Onboarding Progress</CardTitle>
                    <CardDescription>
                      {onboarding.flow?.name || 'Onboarding Flow'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {onboarding.priority && onboarding.priority !== 'normal' && (
                      <Badge
                        variant={
                          onboarding.priority === 'urgent'
                            ? 'destructive'
                            : onboarding.priority === 'high'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {onboarding.priority.toUpperCase()}
                      </Badge>
                    )}
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
                  </div>
                </div>
                {onboarding.due_date && onboarding.status !== 'COMPLETED' && (
                  <div className="mt-2">
                    {(() => {
                      const dueDateInfo = getDueDateStatus(onboarding.due_date)
                      return (
                        <div
                          className={`flex items-center gap-2 text-sm ${
                            dueDateInfo.status === 'overdue'
                              ? 'text-red-600'
                              : dueDateInfo.status === 'due-soon'
                              ? 'text-orange-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {dueDateInfo.status === 'overdue' ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                          <span>
                            Due: {formatRelativeDate(onboarding.due_date)}
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <Separator />

                {/* Steps */}
                <div className="space-y-3">
                  {stepProgress?.map((sp: any, index: number) => (
                    <div
                      key={sp.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        sp.status === 'COMPLETED'
                          ? 'bg-green-50 border-green-200'
                          : sp.status === 'IN_PROGRESS'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          sp.status === 'COMPLETED'
                            ? 'bg-green-600 text-white'
                            : sp.status === 'IN_PROGRESS'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-300'
                        }`}
                      >
                        {sp.status === 'COMPLETED' ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {stepTypeIcons[sp.step.type as StepType]}
                          <span className="font-medium">{sp.step.title}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {sp.step.type}
                          {sp.completed_at && (
                            <> • Completed {formatDateTime(sp.completed_at)}</>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          sp.status === 'COMPLETED'
                            ? 'success'
                            : sp.status === 'IN_PROGRESS'
                            ? 'warning'
                            : 'outline'
                        }
                      >
                        {sp.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  No onboarding flow assigned to this client yet.
                </p>
                <Link href={`/dashboard/clients/${client.id}/assign`}>
                  <Button>Assign Flow</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Client Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {client.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{client.email}</div>
              </div>
              {client.source && (
                <div>
                  <div className="text-sm text-muted-foreground">Source</div>
                  <div className="font-medium">{client.source}</div>
                </div>
              )}
              {client.tags && client.tags.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {client.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Added</div>
                <div className="font-medium">{formatDate(client.created_at)}</div>
              </div>
              {onboarding && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground">Last Activity</div>
                    <div className="font-medium">
                      {onboarding.last_activity_at
                        ? formatDateTime(onboarding.last_activity_at)
                        : 'Never'}
                    </div>
                  </div>
                  {onboarding.completed_at && (
                    <div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                      <div className="font-medium">
                        {formatDateTime(onboarding.completed_at)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Onboarding Link */}
          {portalUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Link</CardTitle>
                <CardDescription>
                  Share this link with your client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2 bg-muted rounded-md text-xs font-mono break-all">
                  {portalUrl}
                </div>
                <CopyLinkButton link={portalUrl} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
