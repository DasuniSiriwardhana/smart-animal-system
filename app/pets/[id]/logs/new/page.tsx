"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Activity, Heart, Moon, Coffee, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

const moods = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "playful", label: "Playful", emoji: "🐾" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "anxious", label: "Anxious", emoji: "😰" },
]

const sleepQualities = ["poor", "fair", "good", "excellent"]

export default function NewLogPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    mood: "happy",
    activity_type: "",
    activity_duration: "",
    meal_portions: "",
    treats: "",
    water_intake: "",
    sleep_duration: "",
    sleep_quality: "good",
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error: insertError } = await supabase
        .from("daily_logs")
        .insert({
          pet_id: petId,
          log_date: new Date().toISOString().split('T')[0],
          mood: formData.mood,
          activity_type: formData.activity_type || null,
          activity_duration: formData.activity_duration ? parseInt(formData.activity_duration) : null,
          meal_portions: formData.meal_portions ? parseInt(formData.meal_portions) : null,
          treats: formData.treats ? parseInt(formData.treats) : null,
          water_intake: formData.water_intake ? parseFloat(formData.water_intake) : null,
          sleep_duration: formData.sleep_duration ? parseFloat(formData.sleep_duration) : null,
          sleep_quality: formData.sleep_quality || null,
          environment_notes: formData.notes || null,
        })

      if (insertError) throw insertError

      router.push(`/pets/${petId}`)
    } catch (err) {
      console.error("Error saving log:", err)
      setError(err instanceof Error ? err.message : "Failed to save log")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Fixed Back Button */}
        <div className="mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push(`/pets/${petId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pet
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Mood Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                How is your pet feeling?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={formData.mood} 
                onValueChange={(v) => setFormData({...formData, mood: v})}
                className="flex flex-wrap gap-4"
              >
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
                  <Input 
                    placeholder="e.g., Walk, Run, Play"
                    value={formData.activity_type}
                    onChange={(e) => setFormData({...formData, activity_type: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder="30"
                    value={formData.activity_duration}
                    onChange={(e) => setFormData({...formData, activity_duration: e.target.value})}
                  />
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
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder="2"
                    value={formData.meal_portions}
                    onChange={(e) => setFormData({...formData, meal_portions: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Treats</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder="1"
                    value={formData.treats}
                    onChange={(e) => setFormData({...formData, treats: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Water (L)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.1" 
                    placeholder="1.5"
                    value={formData.water_intake}
                    onChange={(e) => setFormData({...formData, water_intake: e.target.value})}
                  />
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
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.5" 
                    placeholder="8"
                    value={formData.sleep_duration}
                    onChange={(e) => setFormData({...formData, sleep_duration: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quality</Label>
                  <Select 
                    value={formData.sleep_quality} 
                    onValueChange={(v) => setFormData({...formData, sleep_quality: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      {sleepQualities.map((q) => (
                        <SelectItem key={q} value={q}>
                          {q.charAt(0).toUpperCase() + q.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Textarea 
                placeholder="Any additional observations..." 
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Log"
              )}
            </Button>
<Button type="button" variant="outline" onClick={() => router.push(`/pets/${petId}`)}>              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}