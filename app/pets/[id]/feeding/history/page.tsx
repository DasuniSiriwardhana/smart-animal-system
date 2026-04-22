"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth/auth-provider"
import { 
  ArrowLeft, 
  Utensils, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar
} from "lucide-react"

type FeedingLog = {
  id: string
  feeding_time: string
  meal_type: string
  confirmed: boolean
  skipped: boolean
  food_brand: string | null
  food_type: string | null
  actual_portion: number | null
  portion_unit: string
  notes: string | null
  created_at: string
}

type Pet = {
  id: string
  name: string
  species: string
}

export default function FeedingHistoryPage() {
  const params = useParams()
  const petId = params.id as string

  const [pet, setPet] = useState<Pet | null>(null)
  const [feedings, setFeedings] = useState<FeedingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "skipped">("all")

  const fetchPet = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pets")
        .select("id, name, species")
        .eq("id", petId)
        .single()

      if (error) throw error
      setPet(data)
    } catch (error) {
      console.error("Error fetching pet:", error)
    }
  }, [petId])

  const fetchFeedings = useCallback(async () => {
    setLoading(true)
    try {
      const query = supabase
        .from("feeding_logs")
        .select("*")
        .eq("pet_id", petId)
        .order("feeding_time", { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setFeedings(data || [])
    } catch (error) {
      console.error("Error fetching feeding history:", error)
    } finally {
      setLoading(false)
    }
  }, [petId])

  useEffect(() => {
    fetchPet()
    fetchFeedings()
  }, [fetchPet, fetchFeedings])

  const getMealIcon = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'breakfast': return '🍳'
      case 'lunch': return '🥗'
      case 'dinner': return '🍲'
      case 'snack': return '🍎'
      default: return '🍽️'
    }
  }

  const getStatusBadge = (feeding: FeedingLog) => {
    if (feeding.confirmed) {
      return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Confirmed</Badge>
    }
    if (feeding.skipped) {
      return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" /> Skipped</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
  }

  const filteredFeedings = feedings.filter(feeding => {
    if (filter === "all") return true
    if (filter === "confirmed") return feeding.confirmed
    if (filter === "skipped") return feeding.skipped
    if (filter === "pending") return !feeding.confirmed && !feeding.skipped
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href={`/pets/${petId}`} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {pet?.name}
            </Link>
          </Button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Feeding History</h1>
              <p className="text-gray-500 mt-1">Complete feeding records for {pet?.name}</p>
            </div>
            <Button asChild>
              <Link href={`/pets/${petId}/feeding`}>
                <Utensils className="h-4 w-4 mr-2" />
                Add Feeding
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "all" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All ({feedings.length})
          </button>
          <button
            onClick={() => setFilter("confirmed")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "confirmed" 
                ? "text-green-600 border-b-2 border-green-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Confirmed ({feedings.filter(f => f.confirmed).length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "pending" 
                ? "text-yellow-600 border-b-2 border-yellow-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending ({feedings.filter(f => !f.confirmed && !f.skipped).length})
          </button>
          <button
            onClick={() => setFilter("skipped")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "skipped" 
                ? "text-red-600 border-b-2 border-red-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Skipped ({feedings.filter(f => f.skipped).length})
          </button>
        </div>

        <Card>
          <CardContent className="p-0">
            {filteredFeedings.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-700 mb-2">No feeding records found</h3>
                <p className="text-gray-500 text-sm">
                  {filter !== "all" 
                    ? `No ${filter} feedings in the history`
                    : "Start tracking your pet's meals"}
                </p>
                {filter !== "all" && (
                  <Button variant="outline" onClick={() => setFilter("all")} className="mt-4">
                    View All Feedings
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredFeedings.map((feeding) => (
                  <div key={feeding.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{getMealIcon(feeding.meal_type)}</div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium capitalize text-gray-900">
                              {feeding.meal_type || 'Feeding'}
                            </h4>
                            {getStatusBadge(feeding)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {feeding.food_brand && (
                              <span>{feeding.food_brand} • </span>
                            )}
                            {feeding.food_type && (
                              <span className="capitalize">{feeding.food_type} • </span>
                            )}
                            {feeding.actual_portion ? (
                              <span>{feeding.actual_portion} {feeding.portion_unit}</span>
                            ) : (
                              <span>No portion recorded</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(feeding.feeding_time).toLocaleDateString()}
                            </span>
                            <span>
                              {new Date(feeding.feeding_time).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          {feeding.notes && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                              &quot;{feeding.notes}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {feedings.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <p className="text-2xl font-semibold text-gray-900">{feedings.length}</p>
              <p className="text-xs text-gray-500">Total Feedings</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <p className="text-2xl font-semibold text-green-600">{feedings.filter(f => f.confirmed).length}</p>
              <p className="text-xs text-gray-500">Confirmed</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <p className="text-2xl font-semibold text-yellow-600">{feedings.filter(f => !f.confirmed && !f.skipped).length}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
              <p className="text-2xl font-semibold text-red-600">{feedings.filter(f => f.skipped).length}</p>
              <p className="text-xs text-gray-500">Skipped</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}