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
