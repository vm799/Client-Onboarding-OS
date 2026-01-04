'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getTokenUsage } from '@/lib/tokens'

interface TokenMeterProps {
  workspaceId: string
  className?: string
}

export function TokenMeter({ workspaceId, className }: TokenMeterProps) {
  const [usage, setUsage] = useState({ used: 0, limit: 10000 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false)
      return
    }

    getTokenUsage(workspaceId)
      .then(data => setUsage(data))
      .catch(() => setUsage({ used: 0, limit: 10000 }))
      .finally(() => setLoading(false))
  }, [workspaceId])

  const percent = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0
  const isWarning = percent > 80
  const isCritical = percent > 95

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-4 h-4" />
            AI Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-muted rounded" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-4 h-4" />
          AI Tokens
          {isCritical && <AlertTriangle className="w-4 h-4 text-destructive" />}
          {isWarning && !isCritical && <AlertTriangle className="w-4 h-4 text-orange-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">
          {usage.used.toLocaleString()} / {usage.limit.toLocaleString()}
        </div>
        <Progress
          value={Math.min(percent, 100)}
          className={`h-2 ${isCritical ? '[&>div]:bg-destructive' : isWarning ? '[&>div]:bg-orange-500' : ''}`}
        />
        <p className="text-sm text-muted-foreground mt-2">
          {percent.toFixed(0)}% used this month
          {isCritical && ' - Upgrade needed!'}
        </p>
      </CardContent>
    </Card>
  )
}
