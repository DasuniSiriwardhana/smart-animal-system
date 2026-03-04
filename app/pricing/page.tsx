// app/pricing/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Sparkles, PawPrint } from "lucide-react"

const plans = [
  {
    name: "Basic",
    price: "Free",
    description: "Perfect for getting started",
    features: [
      { name: "Up to 3 pets", included: true },
      { name: "Basic health tracking", included: true },
      { name: "Daily logs (activity, mood, sleep)", included: true },
      { name: "7-day history", included: true },
      { name: "Email support", included: true },
      { name: "AI Insights", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Document storage", included: false },
      { name: "Vet consultations", included: false },
      { name: "Image recognition", included: false },
    ],
    buttonText: "Get Started",
    buttonVariant: "outline" as const,
  },
  {
    name: "Standard",
    price: "LKR 1,500",
    period: "/month",
    description: "For dedicated pet parents",
    popular: true,
    features: [
      { name: "Unlimited pets", included: true },
      { name: "Advanced health tracking", included: true },
      { name: "Daily logs with AI analysis", included: true },
      { name: "Unlimited history", included: true },
      { name: "Priority support", included: true },
      { name: "AI Insights & predictions", included: true },
      { name: "Advanced analytics & charts", included: true },
      { name: "Document storage (10GB)", included: true },
      { name: "Vet chat consultations", included: true },
      { name: "Image recognition", included: true },
      { name: "Sensor data integration", included: true },
      { name: "Export reports", included: true },
    ],
    buttonText: "Subscribe Now",
    buttonVariant: "default" as const,
  },
  {
    name: "Premium",
    price: "LKR 3,500",
    period: "/month",
    description: "For multiple pets & families",
    features: [
      { name: "Everything in Standard", included: true },
      { name: "Up to 10 pets", included: true },
      { name: "5-year history", included: true },
      { name: "24/7 phone support", included: true },
      { name: "Advanced AI predictions", included: true },
      { name: "Document storage (50GB)", included: true },
      { name: "Video vet consultations", included: true },
      { name: "Multiple users per account", included: true },
      { name: "API access", included: true },
      { name: "Custom reports", included: true },
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that&apos;s right for you and your pets
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant={billingCycle === "monthly" ? "default" : "outline"}
              onClick={() => setBillingCycle("monthly")}
              className="w-32"
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === "yearly" ? "default" : "outline"}
              onClick={() => setBillingCycle("yearly")}
              className="w-32 gap-2"
            >
              Yearly
              <Badge variant="secondary" className="bg-green-100 text-green-700">Save 20%</Badge>
            </Button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? '' : 'text-muted-foreground'}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </CardContent>
              
              <CardFooter>
                <Button 
                  variant={plan.buttonVariant} 
                  className="w-full"
                  size="lg"
                  asChild
                >
                  <Link href={plan.name === "Basic" ? "/signup" : "/contact"}>
                    {plan.buttonText}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The Basic plan is always free with core features. Standard and Premium plans come with a 14-day free trial.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer student or non-profit discounts?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! We offer 50% off for students and non-profit organizations. Contact our support team for more information.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}