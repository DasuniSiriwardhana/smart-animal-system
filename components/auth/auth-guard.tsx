// components/auth/auth-guard.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UpgradeModal } from "@/components/ui/upgrade-modal"
import { Sparkles, Lock } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredPlan?: 'basic' | 'standard' | 'premium'
  requiredRole?: 'user' | 'admin'
  featureName?: string
}

const planHierarchy = {
  basic: 1,
  standard: 2,
  premium: 3
} as const

export function AuthGuard({ children, requiredPlan, requiredRole, featureName }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check role authorization
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto p-8 text-center">
          <Lock className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don&apos;t have permission to access this page.
          </p>
          <Button asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </Card>
      </div>
    )
  }

  // Check plan authorization
  if (requiredPlan) {
    const userPlanLevel = planHierarchy[user.plan]
    const requiredPlanLevel = planHierarchy[requiredPlan]

    if (userPlanLevel < requiredPlanLevel) {
      return (
        <>
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-md mx-auto p-8 text-center border-2 border-yellow-500/20">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <Sparkles className="h-12 w-12 text-yellow-500 mx-auto" />
                </motion.div>
                <Sparkles className="h-12 w-12 text-yellow-500 mx-auto mb-4 relative z-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Upgrade Required</h2>
              <p className="text-muted-foreground mb-4">
                This feature requires a {requiredPlan} plan or higher.
              </p>
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-primary to-accent text-white"
              >
                View Upgrade Options
              </Button>
            </Card>
          </div>
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            requiredPlan={requiredPlan}
            feature={featureName || "this feature"}
          />
        </>
      )
    }
  }

  return <>{children}</>
}