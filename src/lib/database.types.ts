export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type FlowStatus = 'draft' | 'published' | 'archived'
export type StepType = 'WELCOME' | 'FORM' | 'FILE_UPLOAD' | 'CONTRACT' | 'SCHEDULE'
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
export type StepProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
export type NotificationType = 'onboarding_complete' | 'reminder' | 'welcome'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          current_workspace_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          current_workspace_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          current_workspace_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          brand_color: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          brand_color?: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          brand_color?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      onboarding_flows: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          status: FlowStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          status?: FlowStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          status?: FlowStatus
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_steps: {
        Row: {
          id: string
          flow_id: string
          step_order: number
          type: StepType
          title: string
          description: string | null
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          flow_id: string
          step_order: number
          type: StepType
          title: string
          description?: string | null
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          flow_id?: string
          step_order?: number
          type?: StepType
          title?: string
          description?: string | null
          config?: Json
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          workspace_id: string
          name: string
          email: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          email: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          email?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      client_onboardings: {
        Row: {
          id: string
          client_id: string
          flow_id: string
          status: OnboardingStatus
          onboarding_link_token: string
          last_activity_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          flow_id: string
          status?: OnboardingStatus
          onboarding_link_token: string
          last_activity_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          flow_id?: string
          status?: OnboardingStatus
          onboarding_link_token?: string
          last_activity_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      client_step_progress: {
        Row: {
          id: string
          client_onboarding_id: string
          step_id: string
          status: StepProgressStatus
          data: Json
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_onboarding_id: string
          step_id: string
          status?: StepProgressStatus
          data?: Json
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_onboarding_id?: string
          step_id?: string
          status?: StepProgressStatus
          data?: Json
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notification_logs: {
        Row: {
          id: string
          client_onboarding_id: string | null
          notification_type: NotificationType
          recipient_email: string
          sent_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          client_onboarding_id?: string | null
          notification_type: NotificationType
          recipient_email: string
          sent_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          client_onboarding_id?: string | null
          notification_type?: NotificationType
          recipient_email?: string
          sent_at?: string
          metadata?: Json
        }
      }
    }
    Enums: {
      flow_status: FlowStatus
      step_type: StepType
      onboarding_status: OnboardingStatus
      step_progress_status: StepProgressStatus
      notification_type: NotificationType
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']
export type OnboardingFlow = Database['public']['Tables']['onboarding_flows']['Row']
export type OnboardingStep = Database['public']['Tables']['onboarding_steps']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientOnboarding = Database['public']['Tables']['client_onboardings']['Row']
export type ClientStepProgress = Database['public']['Tables']['client_step_progress']['Row']
export type NotificationLog = Database['public']['Tables']['notification_logs']['Row']

// Form field configuration types
export interface FormFieldConfig {
  id: string
  type: 'text' | 'textarea' | 'select' | 'email' | 'phone' | 'url'
  label: string
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[] // For select fields
}

export interface StepConfig {
  fields?: FormFieldConfig[] // For FORM type
  acceptButtonText?: string // For CONTRACT type
  contractText?: string // For CONTRACT type
  schedulingUrl?: string // For SCHEDULE type
  allowedFileTypes?: string[] // For FILE_UPLOAD type
  maxFiles?: number // For FILE_UPLOAD type
  maxFileSize?: number // For FILE_UPLOAD type (in MB)
}

// Extended types with relations
export interface OnboardingFlowWithSteps extends OnboardingFlow {
  steps: OnboardingStep[]
}

export interface ClientWithOnboardings extends Client {
  onboardings: ClientOnboardingWithProgress[]
}

export interface ClientOnboardingWithProgress extends ClientOnboarding {
  flow: OnboardingFlow
  client: Client
  step_progress: ClientStepProgressWithStep[]
}

export interface ClientStepProgressWithStep extends ClientStepProgress {
  step: OnboardingStep
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
}
