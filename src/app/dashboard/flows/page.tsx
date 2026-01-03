import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, GitBranch, Edit, Trash2, Copy, MoreHorizontal, Sparkles } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default async function FlowsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_workspace_id')
    .eq('id', user!.id)
    .single()

  const workspaceId = profile?.current_workspace_id

  const { data: flows } = await supabase
    .from('onboarding_flows')
    .select(`
      *,
      steps:onboarding_steps(id)
    `)
    .eq('workspace_id', workspaceId!)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onboarding Flows</h1>
          <p className="text-muted-foreground">
            Create and manage your client onboarding flows
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/flows/generate">
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Generate
            </Button>
          </Link>
          <Link href="/dashboard/flows/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Flow
            </Button>
          </Link>
        </div>
      </div>

      {flows && flows.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <Card key={flow.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{flow.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {flow.description || 'No description'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/flows/${flow.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{flow.steps?.length || 0} steps</span>
                    <span>Created {formatDate(flow.created_at)}</span>
                  </div>
                  <Badge
                    variant={flow.status === 'published' ? 'success' : 'secondary'}
                  >
                    {flow.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No flows yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Create your first onboarding flow to start guiding your clients through a structured process.
            </p>
            <div className="flex gap-3">
              <Link href="/dashboard/flows/generate">
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate with AI
                </Button>
              </Link>
              <Link href="/dashboard/flows/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Flow
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
