"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type User = {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("whatsapp_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    setIsLoading(true)

    try {
      // In a real app, this would be an API call to your auth endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, accept any email with a password length >= 6
      if (password.length >= 6) {
        const newUser = {
          id: Math.random().toString(36).substring(2, 9),
          name: email.split("@")[0],
          email,
          avatar: `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(email.charAt(0).toUpperCase())}`,
        }

        setUser(newUser)
        localStorage.setItem("whatsapp_user", JSON.stringify(newUser))
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Register function
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // Simulate API call
    setIsLoading(true)

    try {
      // In a real app, this would be an API call to your auth endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For demo purposes, accept any registration with valid fields
      if (name && email && password.length >= 6) {
        const newUser = {
          id: Math.random().toString(36).substring(2, 9),
          name,
          email,
          avatar: `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(name.charAt(0).toUpperCase())}`,
        }

        setUser(newUser)
        localStorage.setItem("whatsapp_user", JSON.stringify(newUser))
        return true
      }
      return false
    } catch (error) {
      console.error("Registration error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem("whatsapp_user")
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

