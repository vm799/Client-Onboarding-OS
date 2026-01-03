-- ============================================
-- MIGRATION 002: Add enhancements
-- ============================================

-- Add onboarding_completed flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add due dates to client onboardings
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Add step due dates to step progress
ALTER TABLE client_step_progress ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Add client notes/questions table for in-portal communication
CREATE TABLE IF NOT EXISTS client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_onboarding_id UUID NOT NULL REFERENCES client_onboardings(id) ON DELETE CASCADE,
    author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('client', 'provider')),
    content TEXT NOT NULL,
    is_question BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on client_notes
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

-- Policy for providers to view notes on their clients
CREATE POLICY "Providers can view notes on their clients" ON client_notes
    FOR SELECT USING (
        client_onboarding_id IN (
            SELECT co.id FROM client_onboardings co
            JOIN clients c ON co.client_id = c.id
            WHERE c.workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
                UNION
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            )
        )
    );

-- Policy for providers to manage notes
CREATE POLICY "Providers can manage notes" ON client_notes
    FOR ALL USING (
        client_onboarding_id IN (
            SELECT co.id FROM client_onboardings co
            JOIN clients c ON co.client_id = c.id
            WHERE c.workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
                UNION
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            )
        )
    );

-- Add conditional logic support to steps
-- The config JSON can now include:
-- - showIf: { stepId: string, condition: 'completed' | 'hasValue', field?: string, value?: any }
-- This allows steps to be conditionally shown based on previous step completion or form values

-- Add activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    client_onboarding_id UUID REFERENCES client_onboardings(id) ON DELETE SET NULL,
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('client', 'provider', 'system')),
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace ON activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_onboarding ON activity_logs(client_onboarding_id);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view activity logs" ON activity_logs
    FOR SELECT USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

-- Add tags to clients for organization
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add source tracking to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source VARCHAR(100);

-- Add priority to onboardings
ALTER TABLE client_onboardings ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Create storage policy for client files bucket
-- (Note: Run this in Supabase dashboard SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('client-files', 'client-files', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('workspace-assets', 'workspace-assets', true) ON CONFLICT DO NOTHING;
