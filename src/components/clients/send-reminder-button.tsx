'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function SendReminderButton({
  clientId,
  email,
}: {
  clientId: string
  email: string
}) {
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const handleSend = async () => {
    setSending(true)
    try {
      const response = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })

      if (!response.ok) throw new Error('Failed to send reminder')

      toast({
        title: 'Reminder Sent',
        description: `Email sent to ${email}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reminder email',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Button variant="outline" className="gap-2" onClick={handleSend} disabled={sending}>
      {sending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mail className="h-4 w-4" />
      )}
      Send Reminder
    </Button>
  )
}
