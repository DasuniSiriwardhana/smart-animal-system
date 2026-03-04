// app/pets/new/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, PawPrint } from "lucide-react"

export default function NewPetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Save to database
    setTimeout(() => {
      router.push("/pets")
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pets" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Pets
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PawPrint className="h-6 w-6 text-primary" />
              <CardTitle>Add New Pet</CardTitle>
            </div>
            <CardDescription>Enter your pet&apos;s information to start tracking</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pet Name</Label>
                <Input id="name" placeholder="e.g., Max" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="species">Species</Label>
                  <Input id="species" placeholder="Dog, Cat, etc." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Input id="breed" placeholder="e.g., Golden Retriever" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age (years)</Label>
                  <Input id="age" type="number" min="0" step="1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input id="weight" type="number" min="0" step="0.1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Photo URL (optional)</Label>
                <Input id="photo" placeholder="https://example.com/photo.jpg" />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Pet"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/pets">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}