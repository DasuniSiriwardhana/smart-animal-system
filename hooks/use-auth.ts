// hooks/use-auth.ts
"use client"

import { useContext } from "react"
import { AuthContext } from "@/components/auth/auth-provider"

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  plan: 'basic' | 'standard' | 'premium'
  planExpiry?: string
  avatar?: string
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  signup: (name: string, email: string, password: string) => Promise<void>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  
  return context
}