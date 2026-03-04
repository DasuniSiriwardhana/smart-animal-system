// types/index.ts

export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  plan: 'basic' | 'standard' | 'premium'  
  planExpiry?: string
  avatar?: string
}

// ... rest of your types
export interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  age?: number
  weight?: number
  photo?: string
  userId: string
}

export interface DailyLog {
  id: string
  petId: string
  date: string
  mood?: 'happy' | 'calm' | 'anxious' | 'tired' | 'playful'
  activityType?: string
  activityDuration?: number
  activityIntensity?: 'low' | 'medium' | 'high'
  mealPortions?: number
  treats?: number
  waterIntake?: number
  sleepDuration?: number
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent'
  environmentNotes?: string
}

export interface VetDocument {
  id: string
  petId: string
  name: string
  category: 'vaccination' | 'medical' | 'prescription' | 'lab' | 'other'
  date: string
  expirationDate?: string
  fileData?: string
  fileType?: string
  notes?: string
}

export interface HealthPrediction {
  score: number
  trend: 'improving' | 'stable' | 'declining'
  confidence: number
  recommendations: string[]
  risks: string[]
}

export interface ActivityPrediction {
  expectedActivity: number
  comparison: 'above' | 'normal' | 'below'
  pattern: string[]
}

export interface Anomaly {
  date: string
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
}