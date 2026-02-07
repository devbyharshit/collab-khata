// User types
export interface User {
  id: number
  email: string
  created_at: string
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

// API Error types
export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

// Brand types
export interface Brand {
  id: number
  user_id: number
  name: string
  contact_name?: string
  contact_email?: string
  contact_channel?: string
  notes?: string
  created_at: string
}

export interface BrandCreateRequest {
  name: string
  contact_name?: string
  contact_email?: string
  contact_channel?: string
  notes?: string
}

export interface BrandUpdateRequest {
  name?: string
  contact_name?: string
  contact_email?: string
  contact_channel?: string
  notes?: string
}

// Collaboration types
export enum CollaborationStatus {
  Lead = 'Lead',
  Negotiating = 'Negotiating',
  Confirmed = 'Confirmed',
  InProduction = 'InProduction',
  Posted = 'Posted',
  PaymentPending = 'PaymentPending',
  Overdue = 'Overdue',
  Paid = 'Paid',
  Closed = 'Closed',
}

export interface Collaboration {
  id: number
  user_id: number
  brand_id: number
  brand?: Brand
  title: string
  platform: string
  deliverables_text?: string
  agreed_amount?: number
  currency: string
  deadline_date?: string
  posting_date?: string
  status: CollaborationStatus
  created_at: string
  updated_at: string
}

export interface CollaborationCreateRequest {
  brand_id: number
  title: string
  platform: string
  deliverables_text?: string
  agreed_amount?: number
  currency?: string
  deadline_date?: string
  status?: CollaborationStatus
}

export interface CollaborationUpdateRequest {
  brand_id?: number
  title?: string
  platform?: string
  deliverables_text?: string
  agreed_amount?: number
  currency?: string
  deadline_date?: string
  posting_date?: string
  status?: CollaborationStatus
}

export interface CollaborationStatusUpdateRequest {
  status: CollaborationStatus
  posting_date?: string
}

// Payment types
export enum PaymentStatus {
  Pending = 'Pending',
  Partial = 'Partial',
  Completed = 'Completed',
  Overdue = 'Overdue',
}

export interface PaymentExpectation {
  id: number
  collaboration_id: number
  expected_amount: number
  promised_date?: string
  payment_method?: string
  notes?: string
  status: PaymentStatus
  created_at: string
  total_credited?: number
}

export interface PaymentCredit {
  id: number
  payment_expectation_id: number
  credited_amount: number
  credited_date: string
  reference_note?: string
  created_at: string
}

export interface PaymentExpectationCreateRequest {
  expected_amount: number
  promised_date?: string
  payment_method?: string
  notes?: string
}

export interface PaymentCreditCreateRequest {
  credited_amount: number
  credited_date: string
  reference_note?: string
}

// Conversation types
export enum CommunicationChannel {
  Email = 'Email',
  Instagram = 'Instagram',
  WhatsApp = 'WhatsApp',
  Phone = 'Phone',
  InPerson = 'InPerson',
  Other = 'Other',
}

export interface ConversationLog {
  id: number
  collaboration_id: number
  channel: CommunicationChannel
  message_text: string
  created_at: string
}

export interface ConversationLogCreateRequest {
  channel: CommunicationChannel
  message_text: string
}

// File attachment types
export interface FileAttachment {
  id: number
  collaboration_id: number
  file_path: string
  file_type: string
  original_filename: string
  created_at: string
}

// Dashboard types
export interface FinancialSummary {
  total_expected: number
  total_credited: number
  pending_amount: number
  overdue_count: number
  currency: string
}

export interface CollaborationStatusCount {
  status: string
  count: number
}

export interface DashboardResponse {
  financial_summary: FinancialSummary
  collaboration_status_counts: CollaborationStatusCount[]
  total_collaborations: number
}
