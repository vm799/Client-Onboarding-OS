'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { MessageCircle, Send, Loader2, CheckCircle2, HelpCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Note {
  id: string
  content: string
  author_type: 'client' | 'provider'
  is_question: boolean
  is_resolved: boolean
  created_at: string
}

interface ClientQuestionsProps {
  onboardingId: string
  brandColor?: string
}

export function ClientQuestions({ onboardingId, brandColor = '#000000' }: ClientQuestionsProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [newQuestion, setNewQuestion] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)

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

  async function handleSubmitQuestion() {
    if (!newQuestion.trim()) return

    setSubmitting(true)
    try {
      const { data, error } = await (supabase
        .from('client_notes') as any)
        .insert({
          client_onboarding_id: onboardingId,
          content: newQuestion,
          author_type: 'client',
          is_question: true,
        })
        .select()
        .single()

      if (error) throw error

      setNotes([...notes, data])
      setNewQuestion('')
      toast({
        title: 'Question submitted',
        description: 'Your question has been sent to your provider.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit question',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const unresolvedCount = notes.filter(n => n.is_question && !n.is_resolved).length

  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setExpanded(true)}
          className="rounded-full h-14 w-14 shadow-lg"
          style={{ backgroundColor: brandColor }}
        >
          <MessageCircle className="h-6 w-6" />
          {unresolvedCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unresolvedCount}
            </span>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4" style={{ backgroundColor: brandColor }}>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Questions & Help
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
            onClick={() => setExpanded(false)}
          >
            ×
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-64 overflow-y-auto p-3 space-y-3">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No messages yet. Ask a question below!
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`flex ${note.author_type === 'client' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      note.author_type === 'client'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                    style={note.author_type === 'client' ? { backgroundColor: brandColor } : {}}
                  >
                    <p>{note.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs opacity-70">
                        {formatDateTime(note.created_at)}
                      </span>
                      {note.is_question && note.is_resolved && (
                        <Badge variant="outline" className="text-xs h-4 px-1">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask a question..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
              />
              <Button
                onClick={handleSubmitQuestion}
                disabled={submitting || !newQuestion.trim()}
                className="px-3"
                style={{ backgroundColor: brandColor }}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
