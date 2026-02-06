'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types'
import apiClient, { setToken, clearToken, getToken } from '@/lib/api-client'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  registerUser: (data: RegisterRequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = getToken()
      if (token) {
        try {
          const response = await apiClient.get<User>('/api/auth/me')
          setUser(response.data)
        } catch (error) {
          // Token is invalid, clear it
          clearToken()
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  const login = async (credentials: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials)
    setToken(response.data.access_token)
    
    // Fetch user profile
    const userResponse = await apiClient.get<User>('/api/auth/me')
    setUser(userResponse.data)
  }

  const register = async (data: RegisterRequest) => {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data)
    setToken(response.data.access_token)
    
    // Fetch user profile
    const userResponse = await apiClient.get<User>('/api/auth/me')
    setUser(userResponse.data)
  }

  const registerUser = async (data: RegisterRequest) => {
    await apiClient.post<AuthResponse>('/api/auth/register', data)
    // Don't set token or fetch user - just create the account
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    registerUser,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
