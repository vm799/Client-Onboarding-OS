import { createClient } from '@/lib/supabase/client'

export const TIERS = {
  starter: 10000,
  agency: 50000,
  power: Infinity
} as const

export type Tier = keyof typeof TIERS

export interface TokenCheckResult {
  allowed: boolean
  message?: string
  usage: {
    used: number
    limit: number
  }
}

export async function checkTokens(
  workspaceId: string,
  tokensNeeded: number = 1000
): Promise<TokenCheckResult> {
  const supabase = createClient()

  const { data: workspace, error } = await (supabase
    .from('workspaces') as any)
    .select('tier, tokens_used, tokens_limit')
    .eq('id', workspaceId)
    .single()

  if (error || !workspace) {
    return {
      allowed: false,
      message: 'Workspace not found',
      usage: { used: 0, limit: 10000 }
    }
  }

  const tier = (workspace.tier as Tier) || 'starter'
  const limit = TIERS[tier] || 10000
  const currentUsage = workspace.tokens_used || 0

  if (currentUsage + tokensNeeded > limit && tier !== 'power') {
    return {
      allowed: false,
      message: `Token limit reached (${currentUsage.toLocaleString()}/${limit.toLocaleString()}). Upgrade required.`,
      usage: { used: currentUsage, limit }
    }
  }

  // Update tokens used
  await (supabase
    .from('workspaces') as any)
    .update({ tokens_used: currentUsage + tokensNeeded })
    .eq('id', workspaceId)

  return {
    allowed: true,
    usage: { used: currentUsage + tokensNeeded, limit }
  }
}

export async function getTokenUsage(workspaceId: string): Promise<{ used: number; limit: number }> {
  const supabase = createClient()

  const { data: workspace } = await (supabase
    .from('workspaces') as any)
    .select('tier, tokens_used, tokens_limit')
    .eq('id', workspaceId)
    .single()

  if (!workspace) {
    return { used: 0, limit: 10000 }
  }

  const tier = (workspace.tier as Tier) || 'starter'
  const limit = TIERS[tier] || 10000

  return {
    used: workspace.tokens_used || 0,
    limit: limit === Infinity ? 999999 : limit
  }
}
