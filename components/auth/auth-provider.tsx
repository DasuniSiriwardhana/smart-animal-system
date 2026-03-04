// components/auth/auth-provider.tsx
"use client"

import { createContext, useState, useEffect, ReactNode } from "react"
import { User, AuthContextType } from "@/hooks/use-auth"

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for testing
const MOCK_USERS = {
  admin: {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin" as const,
    plan: "premium" as const,
    avatar: ""
  },
  user: {
    id: "2",
    email: "user@example.com",
    name: "Regular User",
    role: "user" as const,
    plan: "basic" as const,
    avatar: ""
  },
  premium: {
    id: "3",
    email: "premium@example.com",
    name: "Premium User",
    role: "user" as const,
    plan: "premium" as const,
    avatar: ""
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem("smart_animal_user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error("Failed to parse saved user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Determine user type based on email
      let loggedInUser
      if (email.includes("admin")) {
        loggedInUser = MOCK_USERS.admin
      } else if (email.includes("premium")) {
        loggedInUser = MOCK_USERS.premium
      } else {
        loggedInUser = { ...MOCK_USERS.user, email, name: email.split('@')[0] }
      }
      
      setUser(loggedInUser)
      localStorage.setItem("smart_animal_user", JSON.stringify(loggedInUser))
      console.log("Login successful:", loggedInUser)
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("smart_animal_user")
    console.log("Logged out")
  }

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newUser: User = { 
        id: Date.now().toString(),
        name, 
        email,
        role: "user",
        plan: "basic",
        avatar: ""
      }
      setUser(newUser)
      localStorage.setItem("smart_animal_user", JSON.stringify(newUser))
      console.log("Signup successful:", newUser)
    } catch (error) {
      console.error("Signup failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    signup
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}