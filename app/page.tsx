// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  PawPrint, 
  Brain, 
  Activity, 
  Heart, 
  Shield, 
  Sparkles,
  Menu,
  X,
  Dog,
  Cat,
  Bird,
  Fish,
  TrendingUp,
  Users,
  ShoppingBag,
  Calendar,
  ArrowRight,
  CheckCircle
} from "lucide-react"

export default function HomePage() {
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: Brain,
      title: "AI Health Predictions",
      description: "LSTM neural networks analyze your pet's behavior patterns to predict health issues before they become serious.",
      color: "text-purple-500",
      bgColor: "bg-purple-100"
    },
    {
      icon: Activity,
      title: "Activity Tracking",
      description: "Monitor daily exercise, sleep patterns, and activity levels with detailed analytics and trends.",
      color: "text-green-500",
      bgColor: "bg-green-100"
    },
    {
      icon: Heart,
      title: "Health Monitoring",
      description: "Track mood, feeding, water intake, and vital signs with personalized health scores.",
      color: "text-red-500",
      bgColor: "bg-red-100"
    },
    {
      icon: Shield,
      title: "Vet Records",
      description: "Securely store vaccination records, medical history, and veterinary documents in one place.",
      color: "text-blue-500",
      bgColor: "bg-blue-100"
    },
    {
      icon: TrendingUp,
      title: "Market Intelligence",
      description: "For businesses: track brand performance, seasonal trends, and consumer behavior.",
      color: "text-orange-500",
      bgColor: "bg-orange-100",
      admin: true
    },
    {
      icon: Sparkles,
      title: "AI Insights",
      description: "Get personalized recommendations and early warnings based on your pet's unique patterns.",
      color: "text-indigo-500",
      bgColor: "bg-indigo-100"
    }
  ]

  const stats = [
    { value: "10,000+", label: "Happy Pets", icon: PawPrint },
    { value: "500,000+", label: "Daily Logs", icon: Activity },
    { value: "98%", label: "Accuracy Rate", icon: Brain },
    { value: "24/7", label: "Monitoring", icon: Heart }
  ]

  const pets = [
    { icon: Dog, name: "Dogs", color: "text-orange-500" },
    { icon: Cat, name: "Cats", color: "text-blue-500" },
    { icon: Bird, name: "Birds", color: "text-green-500" },
    { icon: Fish, name: "Fish", color: "text-purple-500" }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/95 backdrop-blur border-b shadow-sm' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <PawPrint className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">Smart Animal System</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm hover:text-primary transition-colors">
                How It Works
              </Link>
              <Link href="#pricing" className="text-sm hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="#about" className="text-sm hover:text-primary transition-colors">
                About
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/pets">My Pets</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link 
                href="#features" 
                className="block py-2 text-sm hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#how-it-works" 
                className="block py-2 text-sm hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="#pricing" 
                className="block py-2 text-sm hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="#about" 
                className="block py-2 text-sm hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <div className="pt-3 border-t flex flex-col gap-2">
                {user ? (
                  <>
                    <Button asChild className="w-full">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/pets">My Pets</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="w-full">
                      <Link href="/signup">Get Started</Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <Badge variant="outline" className="px-4 py-1 text-sm">
              🚀 AI-Powered Pet Care Platform
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Smart Care for Your
              <span className="text-primary block mt-2">Furry Friends</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The intelligent platform that uses LSTM neural networks to predict, monitor, 
              and improve your pet&apos;s health and wellbeing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {user ? (
                <>
                  <Button size="lg" className="gap-2 text-lg px-8" asChild>
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 text-lg px-8" asChild>
                    <Link href="/pets/new">
                      Add New Pet
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" className="gap-2 text-lg px-8" asChild>
                    <Link href="/signup">
                      Start Free Trial
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 text-lg px-8" asChild>
                    <Link href="#features">
                      Learn More
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Pet Icons */}
            <div className="flex justify-center gap-8 pt-12">
              {pets.map((pet, index) => (
                <div key={index} className="text-center">
                  <div className={`h-16 w-16 rounded-full ${pet.color.replace('text', 'bg')}/10 flex items-center justify-center mx-auto`}>
                    <pet.icon className={`h-8 w-8 ${pet.color}`} />
                  </div>
                  <p className="text-sm mt-2">{pet.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Features for Modern Pet Care</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to monitor, analyze, and improve your pet&apos;s health with cutting-edge AI technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="group hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardHeader>
                    <div className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="flex items-center gap-2">
                      {feature.title}
                      {feature.admin && (
                        <Badge variant="outline" className="text-xs">Admin</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-muted/30 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start using AI-powered pet care
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Profile",
                description: "Sign up and add your pet's basic information like name, breed, age, and weight."
              },
              {
                step: "02",
                title: "Track Daily",
                description: "Log activities, meals, sleep, and mood. Our system learns your pet's patterns."
              },
              {
                step: "03",
                title: "Get Insights",
                description: "Receive AI-powered predictions, health scores, and early warnings."
              }
            ].map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-8">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Businesses Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="mb-4">For Businesses</Badge>
                  <h2 className="text-3xl font-bold mb-4">Market Intelligence Dashboard</h2>
                  <p className="text-muted-foreground mb-6">
                    Access aggregated, anonymized data to track brand performance, seasonal trends, 
                    and consumer behavior across Sri Lanka&apos;s pet industry.
                  </p>
                  <ul className="space-y-3 mb-6">
                    {[
                      "Real-time market share analytics",
                      "Geographic demand patterns",
                      "Seasonal trend forecasting",
                      "Competitor analysis"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button size="lg" asChild>
                    <Link href="/admin">Explore Admin Dashboard</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-semibold">Market Share</p>
                      <p className="text-2xl font-bold text-primary">34%</p>
                      <p className="text-xs text-muted-foreground">Royal Canin</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-semibold">Active Users</p>
                      <p className="text-2xl font-bold text-primary">12.3k</p>
                      <p className="text-xs text-muted-foreground">↑ 8.7%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <ShoppingBag className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-semibold">Avg. Spend</p>
                      <p className="text-2xl font-bold text-primary">LKR 5,250</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-semibold">Seasonal</p>
                      <p className="text-2xl font-bold text-primary">+112%</p>
                      <p className="text-xs text-muted-foreground">Festive demand</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that&apos;s right for you and your pets
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">Free</span>
                </div>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Up to 3 pets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Basic health tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">7-day history</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-primary shadow-lg relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle>Standard</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">LKR 1,500</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription>For dedicated pet parents</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Unlimited pets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">AI Insights & predictions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Document storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Vet chat consultations</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/signup">Subscribe Now</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Premium</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">LKR 3,500</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription>For multiple pets & families</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Everything in Standard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">24/7 phone support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Video vet consultations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Multiple users</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/contact">Contact Sales</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of pet parents who trust Smart Animal System
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Button size="lg" variant="secondary" className="gap-2" asChild>
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" variant="secondary" className="gap-2" asChild>
                      <Link href="/signup">
                        Start Free Trial
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                      <Link href="/pricing">
                        View Pricing
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <PawPrint className="h-6 w-6 text-primary" />
                <span className="font-semibold">Smart Animal System</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered pet health monitoring and market intelligence platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-primary">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-primary">Pricing</Link></li>
                <li><Link href="/admin" className="hover:text-primary">Admin Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#about" className="hover:text-primary">About</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-primary">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Twitter</a></li>
                <li><a href="#" className="hover:text-primary">LinkedIn</a></li>
                <li><a href="#" className="hover:text-primary">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2026 Smart Animal System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}