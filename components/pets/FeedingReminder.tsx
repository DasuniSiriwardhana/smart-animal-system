"use client";

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Bell, Check, X, Package } from "lucide-react"

type FeedingSchedule = {
  id: string
  meal_time: string
  meal_type: string
  portion_size: number
  food_type: string
}

export function FeedingReminder({ petId, petName }: { petId: string; petName: string }) {
  const [pendingMeals, setPendingMeals] = useState<FeedingSchedule[]>([])
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [brand, setBrand] = useState("")
  const [product, setProduct] = useState("")
  const [actualPortion, setActualPortion] = useState("")

  const fetchPendingMeals = useCallback(async () => {
    try {
      const response = await fetch(`/api/feeding/today/${petId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setPendingMeals(data.schedules || [])
    } catch (error) {
      console.error("Error fetching pending meals:", error)
    }
  }, [petId])

  // Check for reminders every minute
  useEffect(() => {
    // Initial fetch
    fetchPendingMeals()

    // Check for reminders every 30 seconds
    const interval = setInterval(async () => {
      try {
        // Check for reminders that need to be sent
        const reminderResponse = await fetch('/api/feeding/check-reminders')
        
        if (!reminderResponse.ok) {
          console.error("Reminder API error:", reminderResponse.status)
          return
        }
        
        const reminderData = await reminderResponse.json()
        
        if (reminderData.remindersSent > 0) {
          console.log(`Sent ${reminderData.remindersSent} email reminders`)
          // Refresh pending meals after reminders are sent
          fetchPendingMeals()
        }
      } catch (error) {
        console.error("Error checking reminders:", error)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [fetchPendingMeals])

  const confirmFeeding = async (scheduleId: string) => {
    if (!brand || !product || !actualPortion) {
      alert("Please enter brand, product, and actual portion")
      return
    }

    setConfirmingId(scheduleId)

    try {
      const response = await fetch("/api/feeding/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: scheduleId,
          food_brand: brand,
          food_product: product,
          actual_portion: parseFloat(actualPortion)
        })
      })

      if (response.ok) {
        setBrand("")
        setProduct("")
        setActualPortion("")
        fetchPendingMeals()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to confirm feeding")
      }
    } catch (error) {
      console.error("Error confirming feeding:", error)
      alert("Failed to confirm feeding")
    } finally {
      setConfirmingId(null)
    }
  }

  const skipFeeding = async (scheduleId: string) => {
    try {
      await fetch(`/api/feeding/skip/${scheduleId}`, { method: "POST" })
      fetchPendingMeals()
    } catch (error) {
      console.error("Error skipping feeding:", error)
      alert("Failed to skip feeding")
    }
  }

  if (pendingMeals.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {pendingMeals.map((meal) => (
        <Card key={meal.id} className="w-96 shadow-lg border-primary/20 bg-white">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Time to feed {petName}!</h4>
                <p className="text-sm text-muted-foreground">
                  {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)} - {meal.portion_size}g
                </p>
                
                {confirmingId === meal.id ? (
                  <div className="mt-3 space-y-2">
                    <Input
                      placeholder="Brand (e.g., Whiskas)"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="text-sm"
                      autoFocus
                    />
                    <Input
                      placeholder="Product (e.g., Tuna)"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Actual portion eaten (grams)"
                      value={actualPortion}
                      onChange={(e) => setActualPortion(e.target.value)}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => confirmFeeding(meal.id)}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setConfirmingId(null)
                          setBrand("")
                          setProduct("")
                          setActualPortion("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      onClick={() => setConfirmingId(meal.id)}
                      className="flex-1"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Log Meal
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => skipFeeding(meal.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}