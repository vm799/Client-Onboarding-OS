'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'
import {
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
  HelpCircle,
  User,
  Building,
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Note {
  id: string
  content: string
  author_type: 'client' | 'provider'
  is_question: boolean
  is_resolved: boolean
  created_at: string
}

interface ClientMessagesProps {
  onboardingId: string
  clientName: string
}

export function ClientMessages({ onboardingId, clientName }: ClientMessagesProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadNotes() {
      const { data } = await (supabase
        .from('client_notes') as any)
        .select('*')
        .eq('client_onboarding_id', onboardingId)
        .order('created_at', { ascending: true })

      setNotes(data || [])
      setLoading(false)
    }
    loadNotes()
  }, [onboardingId, supabase])

  async function handleSendMessage() {
    if (!newMessage.trim()) return

    setSubmitting(true)
    try {
      const { data, error } = await (supabase
        .from('client_notes') as any)
        .insert({
          client_onboarding_id: onboardingId,
          content: newMessage,
          author_type: 'provider',
          is_question: false,
        })
        .select()
        .single()

      if (error) throw error

      setNotes([...notes, data])
      setNewMessage('')
      toast({
        title: 'Message sent',
        description: 'Your message has been sent to the client.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMarkResolved(noteId: string) {
    const { error } = await (supabase
      .from('client_notes') as any)
      .update({ is_resolved: true })
      .eq('id', noteId)

    if (!error) {
      setNotes(notes.map(n => n.id === noteId ? { ...n, is_resolved: true } : n))
      toast({
        title: 'Question resolved',
        description: 'The question has been marked as resolved.',
      })
    }
  }

  const unresolvedQuestions = notes.filter(n => n.is_question && !n.is_resolved)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </CardTitle>
          {unresolvedQuestions.length > 0 && (
            <Badge variant="destructive">
              {unresolvedQuestions.length} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Send a message to {clientName}.
          </p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {notes.map((note, index) => (
              <div key={note.id}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    note.author_type === 'client' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {note.author_type === 'client' ? (
                      <User className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Building className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {note.author_type === 'client' ? clientName : 'You'}
                      </span>
                      {note.is_question && (
                        <Badge variant="outline" className="text-xs">
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Question
                        </Badge>
                      )}
                      {note.is_resolved && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{note.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(note.created_at)}
                      </span>
                      {note.is_question && !note.is_resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => handleMarkResolved(note.id)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Mark resolved
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[60px] resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={submitting || !newMessage.trim()}
            className="px-3"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
