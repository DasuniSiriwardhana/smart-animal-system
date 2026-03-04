// app/pets/[id]/logs/new/page.tsx
"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Activity, Heart, Moon, Coffee } from "lucide-react"

const moods = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "playful", label: "Playful", emoji: "🐾" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "anxious", label: "Anxious", emoji: "😰" },
]

export default function NewLogPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Save to database
    setTimeout(() => {
      router.push(`/pets/${petId}`)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/pets/${petId}`} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Pet
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                How is your pet feeling?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup name="mood" className="flex flex-wrap gap-4">
                {moods.map((mood) => (
                  <div key={mood.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={mood.value} id={mood.value} />
                    <Label htmlFor={mood.value} className="text-lg">
                      {mood.emoji} {mood.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Activity Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Activity Type</Label>
                  <Input placeholder="e.g., Walk, Run, Play" />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input type="number" min="0" placeholder="30" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Food Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-orange-500" />
                Food & Water
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Meals</Label>
                  <Input type="number" min="0" placeholder="2" />
                </div>
                <div className="space-y-2">
                  <Label>Treats</Label>
                  <Input type="number" min="0" placeholder="1" />
                </div>
                <div className="space-y-2">
                  <Label>Water (L)</Label>
                  <Input type="number" min="0" step="0.1" placeholder="1.5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sleep Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-blue-500" />
                Sleep
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hours slept</Label>
                  <Input type="number" min="0" step="0.5" placeholder="8" />
                </div>
                <div className="space-y-2">
                  <Label>Quality</Label>
                  <RadioGroup name="sleepQuality" className="flex gap-4">
                    {["poor", "fair", "good", "excellent"].map((q) => (
                      <div key={q} className="flex items-center space-x-1">
                        <RadioGroupItem value={q} id={`sleep-${q}`} />
                        <Label htmlFor={`sleep-${q}`} className="capitalize">{q}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Any additional observations..." rows={4} />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Log"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/pets/${petId}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}