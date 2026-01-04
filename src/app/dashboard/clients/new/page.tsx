'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Loader2, Copy, Check, Mail, Calendar, AlertTriangle } from 'lucide-react'
import { generateToken, addDays } from '@/lib/utils'
import type { OnboardingFlow } from '@/lib/database.types'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-gray-600' },
  { value: 'normal', label: 'Normal', color: 'text-blue-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
]

const DUE_DATE_PRESETS = [
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
]

export default function NewClientPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [flowId, setFlowId] = useState('')
  const [flows, setFlows] = useState<OnboardingFlow[]>([])
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)
  const [onboardingLink, setOnboardingLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')
  const [source, setSource] = useState('')

  useEffect(() => {
    async function loadFlows() {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('current_workspace_id')
        .eq('id', user!.id)
        .single()

      const { data } = await (supabase
        .from('onboarding_flows') as any)
        .select('*')
        .eq('workspace_id', profile!.current_workspace_id!)
        .eq('status', 'published')
        .order('name')

      setFlows(data || [])
    }

    loadFlows()
  }, [supabase])

  const handleCreate = async () => {
    if (!name.trim() || !email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter client name and email',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('current_workspace_id')
        .eq('id', user!.id)
        .single()

      // Parse tags from comma-separated string
      const parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      // Create client
      const { data: client, error: clientError } = await (supabase
        .from('clients') as any)
        .insert({
          workspace_id: profile!.current_workspace_id!,
          name,
          email,
          notes: notes || null,
          tags: parsedTags.length > 0 ? parsedTags : null,
          source: source || null,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // If a flow is selected, create the onboarding
      if (flowId) {
        const token = generateToken(32)

        const { error: onboardingError } = await (supabase
          .from('client_onboardings') as any)
          .insert({
            client_id: client.id,
            flow_id: flowId,
            onboarding_link_token: token,
            priority,
            due_date: dueDate || null,
          })

        if (onboardingError) throw onboardingError

        const link = `${window.location.origin}/c/${token}`
        setOnboardingLink(link)
      }

      setCreated(true)
      toast({
        title: 'Success',
        description: 'Client created successfully',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to create client',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(onboardingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: 'Copied',
      description: 'Link copied to clipboard',
    })
  }

  const sendEmail = async () => {
    // In production, this would trigger an API call to send an email
    const subject = encodeURIComponent('Welcome! Complete your onboarding')
    const body = encodeURIComponent(
      `Hi ${name},\n\nPlease complete your onboarding by clicking the link below:\n\n${onboardingLink}\n\nBest regards`
    )
    window.open(`mailto:${email}?subject=${subject}&body=${body}`)
  }

  if (created) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Client Created</h1>
            <p className="text-muted-foreground text-sm">
              {name} has been added
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Success!
            </CardTitle>
            <CardDescription>
              Your client has been created. {onboardingLink && "Share the onboarding link below."}
            </CardDescription>
          </CardHeader>
          {onboardingLink && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Onboarding Link</Label>
                <div className="flex gap-2">
                  <Input value={onboardingLink} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={sendEmail}>
                  <Mail className="h-4 w-4" />
                  Open Email Client
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push('/dashboard/clients')}
                >
                  View All Clients
                </Button>
              </div>
            </CardContent>
          )}
          {!onboardingLink && (
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setCreated(false)
                    setName('')
                    setEmail('')
                    setNotes('')
                    setFlowId('')
                  }}
                >
                  Add Another Client
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push('/dashboard/clients')}
                >
                  View All Clients
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Client</h1>
          <p className="text-muted-foreground text-sm">
            Add a new client and assign an onboarding flow
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
          <CardDescription>
            Enter your client&apos;s information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              placeholder="John Doe or Acme Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flow">Assign Onboarding Flow</Label>
            <Select value={flowId} onValueChange={setFlowId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a flow (optional)" />
              </SelectTrigger>
              <SelectContent>
                {flows.length > 0 ? (
                  flows.map((flow) => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No published flows available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only published flows are shown. You can assign a flow later.
            </p>
          </div>

          {flowId && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className={opt.color}>{opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {DUE_DATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.days}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const date = addDays(new Date(), preset.days)
                      setDueDate(date.toISOString().split('T')[0])
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source (optional)</Label>
              <Input
                id="source"
                placeholder="e.g., Website, Referral"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                placeholder="VIP, Enterprise, etc."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple tags with commas
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this client..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={loading || !name.trim() || !email.trim()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Client
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
