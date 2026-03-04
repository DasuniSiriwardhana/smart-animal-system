// app/pets/[id]/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  PawPrint, 
  ArrowLeft,
  Activity,
  Heart,
  Moon,
  Calendar,
  FileText,
  Edit,
  Trash2,
  Plus
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Mock data
const mockPet = {
  id: "1",
  name: "Max",
  species: "Dog",
  breed: "Golden Retriever",
  age: 3,
  weight: 28.5,
  photo: null
}

const mockLogs = [
  { id: "1", date: "2026-03-04", activity: "Walk", duration: 45, mood: "happy", sleep: 8 },
  { id: "2", date: "2026-03-03", activity: "Play", duration: 30, mood: "playful", sleep: 7.5 },
  { id: "3", date: "2026-03-02", activity: "Walk", duration: 60, mood: "happy", sleep: 9 },
]

export default function PetDetailPage() {
  const params = useParams()
  const petId = params.id
  const [pet] = useState(mockPet)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pets" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Pets
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <PawPrint className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{pet.name}</h1>
              <p className="text-muted-foreground">{pet.breed} • {pet.age} years • {pet.weight} kg</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/pets/${petId}/edit`}>
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <p className="text-2xl font-bold text-primary">85</p>
                </div>
                <Heart className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Activity</p>
                  <p className="text-2xl font-bold">45 min</p>
                </div>
                <Activity className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Sleep</p>
                  <p className="text-2xl font-bold">8.2 hrs</p>
                </div>
                <Moon className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Check</p>
                  <p className="text-2xl font-bold">2d ago</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Daily Logs</TabsTrigger>
            <TabsTrigger value="health">Health Records</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <Button size="sm" className="gap-2" asChild>
                <Link href={`/pets/${petId}/logs/new`}>
                  <Plus className="h-4 w-4" />
                  Add Log
                </Link>
              </Button>
            </div>

            {mockLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{new Date(log.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {log.activity} • {log.duration} min
                      </p>
                    </div>
                    <Badge variant="secondary">{log.mood}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="health">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Health records coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Documents coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}