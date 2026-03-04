// app/dashboard/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  PawPrint, 
  Activity, 
  Moon, 
  Heart, 
  Plus,
  Dog,
  Cat,
  Bird,
  Fish,
  ChevronRight
} from "lucide-react"

// Mock data for demonstration
const mockPets = [
  { id: "1", name: "Max", type: "dog", species: "Golden Retriever", age: 3, image: Dog },
  { id: "2", name: "Luna", type: "cat", species: "Siamese", age: 2, image: Cat },
  { id: "3", name: "Rio", type: "bird", species: "Parrot", age: 5, image: Bird },
]

const mockStats = {
  totalPets: 3,
  activeToday: 2,
  avgSleep: "7.5 hrs",
  healthScore: 85
}

export default function DashboardPage() {
  const [pets] = useState(mockPets)
  const [stats] = useState(mockStats)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here&apos;s your pets&apos; overview</p>
          </div>
          <Button className="gap-2" asChild>
            <Link href="/pets/new">
              <Plus className="h-4 w-4" />
              Add New Pet
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pets</p>
                  <p className="text-2xl font-bold">{stats.totalPets}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <PawPrint className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold">{stats.activeToday}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Sleep</p>
                  <p className="text-2xl font-bold">{stats.avgSleep}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Moon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                  <p className="text-2xl font-bold">{stats.healthScore}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Pets Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My Pets</h2>
            <Link href="/pets" className="text-primary hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => {
              const Icon = pet.image
              return (
                <Card key={pet.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{pet.name}</h3>
                        <p className="text-sm text-muted-foreground">{pet.species}</p>
                        <p className="text-xs text-muted-foreground">{pet.age} years old</p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/pets/${pet.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your pets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Activity className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Max went for a walk</p>
                  <p className="text-xs text-muted-foreground">30 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Heart className="h-4 w-4 text-red-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Luna ate her food</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Moon className="h-4 w-4 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Rio is sleeping</p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}