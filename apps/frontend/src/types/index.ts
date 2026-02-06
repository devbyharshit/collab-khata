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
