'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Loader2, GitBranch, Copy, Check, Mail } from 'lucide-react'
import { generateToken, addDays } from '@/lib/utils'
import type { OnboardingFlow, Client } from '@/lib/database.types'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const DUE_DATE_PRESETS = [
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
]

export default function AssignFlowPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const supabase = createClient()
  const { toast } = useToast()

  const [client, setClient] = useState<Client | null>(null)
  const [flows, setFlows] = useState<OnboardingFlow[]>([])
  const [flowId, setFlowId] = useState('')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [assigned, setAssigned] = useState(false)
  const [onboardingLink, setOnboardingLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('current_workspace_id')
        .eq('id', user.id)
        .single()

      // Load client
      const { data: clientData } = await (supabase
        .from('clients') as any)
        .select('*')
        .eq('id', clientId)
        .single()

      setClient(clientData)

      // Load flows
      const { data: flowsData } = await (supabase
        .from('onboarding_flows') as any)
        .select('*')
        .eq('workspace_id', profile!.current_workspace_id!)
        .eq('status', 'published')
        .order('name')

      setFlows(flowsData || [])
      setLoading(false)
    }

    loadData()
  }, [clientId, supabase])

  const handleAssign = async () => {
    if (!flowId) {
      toast({
        title: 'Error',
        description: 'Please select a flow to assign',
        variant: 'destructive',
      })
      return
    }

    setAssigning(true)
    try {
      const token = generateToken(32)

      const { error } = await (supabase
        .from('client_onboardings') as any)
        .insert({
          client_id: clientId,
          flow_id: flowId,
          onboarding_link_token: token,
          priority,
          due_date: dueDate || null,
        })

      if (error) throw error

      const link = `${window.location.origin}/c/${token}`
      setOnboardingLink(link)
      setAssigned(true)

      toast({
        title: 'Success',
        description: 'Flow assigned successfully',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Failed to assign flow',
        variant: 'destructive',
      })
    } finally {
      setAssigning(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(onboardingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Copied', description: 'Link copied to clipboard' })
  }

  const sendEmail = () => {
    const subject = encodeURIComponent('Complete your onboarding')
    const body = encodeURIComponent(
      `Hi ${client?.name},\n\nPlease complete your onboarding:\n\n${onboardingLink}\n\nBest regards`
    )
    window.open(`mailto:${client?.email}?subject=${subject}&body=${body}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (assigned) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/clients/${clientId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Flow Assigned</h1>
            <p className="text-muted-foreground text-sm">
              {client?.name} has been assigned an onboarding flow
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
              Share the onboarding link with your client
            </CardDescription>
          </CardHeader>
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
                onClick={() => router.push(`/dashboard/clients/${clientId}`)}
              >
                View Client
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clients/${clientId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Assign Flow</h1>
          <p className="text-muted-foreground text-sm">
            Assign an onboarding flow to {client?.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Flow</CardTitle>
          <CardDescription>
            Choose a published onboarding flow to assign to this client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Onboarding Flow *</Label>
            <Select value={flowId} onValueChange={setFlowId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a flow" />
              </SelectTrigger>
              <SelectContent>
                {flows.length > 0 ? (
                  flows.map((flow) => (
                    <SelectItem key={flow.id} value={flow.id}>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        {flow.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No published flows available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
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

          <Button
            className="w-full"
            onClick={handleAssign}
            disabled={assigning || !flowId}
          >
            {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Flow
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
