-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- WORKSPACES TABLE
-- ============================================
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    brand_color VARCHAR(7) DEFAULT '#000000',
    owner_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    current_workspace_id UUID REFERENCES workspaces(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for workspace owner after profiles table is created
ALTER TABLE workspaces
ADD CONSTRAINT fk_workspace_owner
FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================
-- WORKSPACE MEMBERS (for future multi-user workspaces)
-- ============================================
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- ============================================
-- ONBOARDING FLOWS TABLE
-- ============================================
CREATE TYPE flow_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE onboarding_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status flow_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ONBOARDING STEPS TABLE
-- ============================================
CREATE TYPE step_type AS ENUM ('WELCOME', 'FORM', 'FILE_UPLOAD', 'CONTRACT', 'SCHEDULE');

CREATE TABLE onboarding_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID NOT NULL REFERENCES onboarding_flows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    type step_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX idx_steps_flow_order ON onboarding_steps(flow_id, step_order);

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for workspace lookups
CREATE INDEX idx_clients_workspace ON clients(workspace_id);

-- ============================================
-- CLIENT ONBOARDINGS TABLE
-- ============================================
CREATE TYPE onboarding_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE client_onboardings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    flow_id UUID NOT NULL REFERENCES onboarding_flows(id) ON DELETE CASCADE,
    status onboarding_status DEFAULT 'NOT_STARTED',
    onboarding_link_token VARCHAR(64) UNIQUE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for token lookups (used in public portal)
CREATE INDEX idx_onboarding_token ON client_onboardings(onboarding_link_token);
CREATE INDEX idx_onboarding_client ON client_onboardings(client_id);

-- ============================================
-- CLIENT STEP PROGRESS TABLE
-- ============================================
CREATE TYPE step_progress_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

CREATE TABLE client_step_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_onboarding_id UUID NOT NULL REFERENCES client_onboardings(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES onboarding_steps(id) ON DELETE CASCADE,
    status step_progress_status DEFAULT 'NOT_STARTED',
    data JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_onboarding_id, step_id)
);

-- Create index for progress lookups
CREATE INDEX idx_progress_onboarding ON client_step_progress(client_onboarding_id);

-- ============================================
-- EMAIL NOTIFICATIONS LOG
-- ============================================
CREATE TYPE notification_type AS ENUM ('onboarding_complete', 'reminder', 'welcome');

CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_onboarding_id UUID REFERENCES client_onboardings(id) ON DELETE SET NULL,
    notification_type notification_type NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_onboardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_step_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Workspaces: Users can access workspaces they own or are members of
CREATE POLICY "Users can view own workspaces" ON workspaces
    FOR SELECT USING (
        owner_id = auth.uid() OR
        id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create workspaces" ON workspaces
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update workspaces" ON workspaces
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete workspaces" ON workspaces
    FOR DELETE USING (owner_id = auth.uid());

-- Workspace members: Access based on membership
CREATE POLICY "Members can view workspace members" ON workspace_members
    FOR SELECT USING (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid()) OR
        user_id = auth.uid()
    );

CREATE POLICY "Owners can manage workspace members" ON workspace_members
    FOR ALL USING (
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    );

-- Flows: Access based on workspace membership
CREATE POLICY "Users can view flows in their workspaces" ON onboarding_flows
    FOR SELECT USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create flows in their workspaces" ON onboarding_flows
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update flows in their workspaces" ON onboarding_flows
    FOR UPDATE USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete flows in their workspaces" ON onboarding_flows
    FOR DELETE USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

-- Steps: Access based on flow ownership
CREATE POLICY "Users can view steps in their flows" ON onboarding_steps
    FOR SELECT USING (
        flow_id IN (
            SELECT id FROM onboarding_flows WHERE workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
                UNION
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage steps in their flows" ON onboarding_steps
    FOR ALL USING (
        flow_id IN (
            SELECT id FROM onboarding_flows WHERE workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
                UNION
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            )
        )
    );

-- Clients: Access based on workspace membership
CREATE POLICY "Users can view clients in their workspaces" ON clients
    FOR SELECT USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage clients in their workspaces" ON clients
    FOR ALL USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
            UNION
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
    );

-- Client Onboardings: Access based on client ownership
CREATE POLICY "Users can view onboardings for their clients" ON client_onboardings
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM clients WHERE workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
                UNION
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage onboardings for their clients" ON client_onboardings
    FOR ALL USING (
        client_id IN (
            SELECT id FROM clients WHERE workspace_id IN (
                SELECT id FROM workspaces WHERE owner_id = auth.uid()
                UNION
                SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
            )
        )
    );

-- Step Progress: Access based on onboarding ownership
CREATE POLICY "Users can view progress for their onboardings" ON client_step_progress
    FOR SELECT USING (
        client_onboarding_id IN (
            SELECT id FROM client_onboardings WHERE client_id IN (
                SELECT id FROM clients WHERE workspace_id IN (
                    SELECT id FROM workspaces WHERE owner_id = auth.uid()
                    UNION
                    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage progress for their onboardings" ON client_step_progress
    FOR ALL USING (
        client_onboarding_id IN (
            SELECT id FROM client_onboardings WHERE client_id IN (
                SELECT id FROM clients WHERE workspace_id IN (
                    SELECT id FROM workspaces WHERE owner_id = auth.uid()
                    UNION
                    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Notification logs: Access based on onboarding ownership
CREATE POLICY "Users can view notifications for their onboardings" ON notification_logs
    FOR SELECT USING (
        client_onboarding_id IN (
            SELECT id FROM client_onboardings WHERE client_id IN (
                SELECT id FROM clients WHERE workspace_id IN (
                    SELECT id FROM workspaces WHERE owner_id = auth.uid()
                    UNION
                    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flows_updated_at
    BEFORE UPDATE ON onboarding_flows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_steps_updated_at
    BEFORE UPDATE ON onboarding_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboardings_updated_at
    BEFORE UPDATE ON client_onboardings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at
    BEFORE UPDATE ON client_step_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create a profile and default workspace when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- Insert profile
    INSERT INTO profiles (id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

    -- Create default workspace
    INSERT INTO workspaces (name, owner_id)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || '''s Workspace', NEW.id)
    RETURNING id INTO new_workspace_id;

    -- Set as current workspace
    UPDATE profiles SET current_workspace_id = new_workspace_id WHERE id = NEW.id;

    -- Add as workspace member
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, NEW.id, 'owner');

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to initialize step progress when onboarding is created
CREATE OR REPLACE FUNCTION initialize_step_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO client_step_progress (client_onboarding_id, step_id, status)
    SELECT NEW.id, os.id, 'NOT_STARTED'
    FROM onboarding_steps os
    WHERE os.flow_id = NEW.flow_id;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_onboarding_created
    AFTER INSERT ON client_onboardings
    FOR EACH ROW EXECUTE FUNCTION initialize_step_progress();

-- Function to check if all steps are completed and update onboarding status
CREATE OR REPLACE FUNCTION check_onboarding_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_steps INTEGER;
    completed_steps INTEGER;
BEGIN
    -- Count total and completed steps
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'COMPLETED')
    INTO total_steps, completed_steps
    FROM client_step_progress
    WHERE client_onboarding_id = NEW.client_onboarding_id;

    -- Update onboarding status
    IF completed_steps = total_steps AND total_steps > 0 THEN
        UPDATE client_onboardings
        SET status = 'COMPLETED', completed_at = NOW(), last_activity_at = NOW()
        WHERE id = NEW.client_onboarding_id;
    ELSIF completed_steps > 0 THEN
        UPDATE client_onboardings
        SET status = 'IN_PROGRESS', last_activity_at = NOW()
        WHERE id = NEW.client_onboarding_id;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_step_progress_update
    AFTER UPDATE ON client_step_progress
    FOR EACH ROW EXECUTE FUNCTION check_onboarding_completion();

-- ============================================
-- STORAGE BUCKETS (for file uploads)
-- ============================================
-- Note: This needs to be run via Supabase dashboard or API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('client-files', 'client-files', false);
