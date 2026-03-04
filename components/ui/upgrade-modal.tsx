// components/ui/upgrade-modal.tsx
"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, X, Check, Crown } from "lucide-react"
import Link from "next/link"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  requiredPlan: string
  feature: string
}

export function UpgradeModal({ isOpen, onClose, requiredPlan, feature }: UpgradeModalProps) {
  const plans = [
    {
      name: "Standard",
      price: "LKR 1,500",
      features: ["AI Insights & predictions", "Unlimited pets", "Document storage", "Vet chat consultations"],
      popular: true
    },
    {
      name: "Premium",
      price: "LKR 3,500",
      features: ["Everything in Standard", "24/7 phone support", "Video vet consultations", "Multiple users"],
      popular: false
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl p-4"
          >
            <Card className="relative overflow-hidden border-2 border-primary/20">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 hover:bg-accent rounded-full z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <CardContent className="p-8 relative">
                <div className="text-center mb-8">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-2">Upgrade to Access {feature}</h2>
                  <p className="text-muted-foreground">
                    This feature requires a {requiredPlan} plan or higher. Choose the perfect plan for you and your pets.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {plans.map((plan, index) => (
                    <motion.div
                      key={plan.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, rotateY: 5 }}
                      className="relative"
                    >
                      <Card className={`h-full ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                              Most Popular
                            </span>
                          </div>
                        )}
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                          <div className="mb-4">
                            <span className="text-3xl font-bold">{plan.price}</span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                          <ul className="space-y-2 mb-6">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button 
                            className="w-full bg-gradient-to-r from-primary to-accent text-white"
                            asChild
                          >
                            <Link href="/signup" onClick={onClose}>
                              Choose {plan.name}
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>All plans come with a 14-day free trial. No credit card required.</p>
                  <p className="mt-2">
                    <Link href="/pricing" className="text-primary hover:underline" onClick={onClose}>
                      View all pricing details
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}