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
import { ArrowLeft, Loader2, Copy, Check, Mail } from 'lucide-react'
import { generateToken } from '@/lib/utils'
import type { OnboardingFlow } from '@/lib/database.types'

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

  useEffect(() => {
    async function loadFlows() {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_workspace_id')
        .eq('id', user!.id)
        .single()

      const { data } = await supabase
        .from('onboarding_flows')
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_workspace_id')
        .eq('id', user!.id)
        .single()

      // Create client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          workspace_id: profile!.current_workspace_id!,
          name,
          email,
          notes: notes || null,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // If a flow is selected, create the onboarding
      if (flowId) {
        const token = generateToken(32)

        const { error: onboardingError } = await supabase
          .from('client_onboardings')
          .insert({
            client_id: client.id,
            flow_id: flowId,
            onboarding_link_token: token,
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
            Enter your client's information
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
