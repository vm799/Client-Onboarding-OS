'use client'

import { useEffect, useState } from 'react'
import { getTokenUsage } from '@/lib/tokens'
import { useToast } from '@/components/ui/use-toast'

interface TokenStatus {
  allowed: boolean
  used: number
  limit: number
  percent: number
  message?: string
}

export function useTokenGuard(workspaceId: string, tokensNeeded: number = 1000) {
  const [canProceed, setCanProceed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!workspaceId) {
      setChecking(false)
      setCanProceed(false)
      return
    }

    getTokenUsage(workspaceId)
      .then(usage => {
        const remaining = usage.limit - usage.used
        const percent = (usage.used / usage.limit) * 100
        const allowed = remaining >= tokensNeeded

        const status: TokenStatus = {
          allowed,
          used: usage.used,
          limit: usage.limit,
          percent,
          message: allowed
            ? undefined
            : `Token limit reached (${usage.used.toLocaleString()}/${usage.limit.toLocaleString()}). Upgrade required.`
        }

        setTokenStatus(status)
        setCanProceed(allowed)

        if (!allowed) {
          toast({
            title: 'Token Limit Reached',
            description: status.message,
            variant: 'destructive',
          })
        }
      })
      .catch(() => {
        setCanProceed(false)
        toast({
          title: 'Error',
          description: 'Failed to check token balance',
          variant: 'destructive',
        })
      })
      .finally(() => setChecking(false))
  }, [workspaceId, tokensNeeded, toast])

  const refresh = () => {
    setChecking(true)
    getTokenUsage(workspaceId)
      .then(usage => {
        const remaining = usage.limit - usage.used
        const percent = (usage.used / usage.limit) * 100
        const allowed = remaining >= tokensNeeded

        setTokenStatus({
          allowed,
          used: usage.used,
          limit: usage.limit,
          percent,
        })
        setCanProceed(allowed)
      })
      .finally(() => setChecking(false))
  }

  return { canProceed, checking, tokenStatus, refresh }
}
