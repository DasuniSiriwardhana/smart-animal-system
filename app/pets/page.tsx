"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth/auth-provider"
import { 
  PawPrint, 
  Plus, 
  Dog, 
  Cat, 
  Bird, 
  Fish,
  Loader2,
  Heart,
  Activity,
  Thermometer,
  Wifi,
  WifiOff,
  Crown
} from "lucide-react"
import { canAddMorePets } from "@/lib/plan-config"

type Pet = {
  id: string
  name: string
  species: string
  breed: string
  age: number
  weight: number
  photo_url: string | null
  created_at: string
}

type SensorData = {
  heart_rate: number
  temperature: number
  activity_level: string
  sensor_time: string
}

// Map species to icons
const getPetIcon = (species: string) => {
  const lowerSpecies = species.toLowerCase()
  if (lowerSpecies.includes("dog")) return Dog
  if (lowerSpecies.includes("cat")) return Cat
  if (lowerSpecies.includes("bird")) return Bird
  if (lowerSpecies.includes("fish")) return Fish
  return PawPrint
}

// Pet Card Component
function PetCard({ pet, isPremium }: { pet: Pet; isPremium: boolean }) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const fetchSensorData = async () => {
      const { data } = await supabase
        .from("sensor_data")
        .select("heart_rate, temperature, activity_level, sensor_time")
        .eq("pet_id", pet.id)
        .order("sensor_time", { ascending: false })
        .limit(1)
      
      if (data && data.length > 0) {
        setSensorData(data[0])
        setIsConnected(true)
      }
    }
    fetchSensorData()

    const channel = supabase
      .channel(`sensor_updates_${pet.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
          filter: `pet_id=eq.${pet.id}`
        },
        (payload) => {
          setSensorData({
            heart_rate: payload.new.heart_rate,
            temperature: payload.new.temperature,
            activity_level: payload.new.activity_level,
            sensor_time: payload.new.sensor_time
          })
          setIsLive(true)
          setIsConnected(true)
          setTimeout(() => setIsLive(false), 2000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pet.id])

  return (
    <Card className="overflow-hidden border border-gray-100 transition-all hover:shadow-lg">
      <CardContent className="p-4">
        <Link href={`/pets/${pet.id}`}>
          <div className="flex items-start gap-3 cursor-pointer">
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
               {pet.photo_url ? (
  <img src={pet.photo_url} alt={pet.name} className="h-full w-full object-cover" />
) : (
  (() => {
    const Icon = getPetIcon(pet.species)
    return <Icon className="h-7 w-7 text-primary" />
  })()
)}               
              </div>
              {isConnected && (
                <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="truncate text-base font-semibold hover:text-primary transition-colors">
                {pet.name}
              </h3>
              <p className="truncate text-xs text-gray-500">{pet.breed || pet.species}</p>
              <p className="text-xs text-gray-500">{pet.age} yrs • {pet.weight} kg</p>
            </div>
          </div>
        </Link>

        {/* Sensor Data - Only for Premium */}
        {isPremium && sensorData && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                {isConnected ? <Wifi className="h-2.5 w-2.5 text-green-500" /> : <WifiOff className="h-2.5 w-2.5 text-red-500" />}
                Live Data
              </p>
              {isLive && <Badge className="bg-green-500 px-1 py-0 text-[8px] text-white">LIVE</Badge>}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-lg bg-blue-50 p-1.5 text-center">
                <Heart className="mx-auto h-3 w-3 text-red-500" />
                <p className="mt-0.5 text-xs font-bold">{sensorData.heart_rate}</p>
                <p className="text-[8px] text-gray-500">BPM</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-1.5 text-center">
                <Thermometer className="mx-auto h-3 w-3 text-orange-500" />
                <p className="mt-0.5 text-xs font-bold">{sensorData.temperature}°</p>
                <p className="text-[8px] text-gray-500">Temp</p>
              </div>
              <div className="rounded-lg bg-green-50 p-1.5 text-center">
                <Activity className="mx-auto h-3 w-3 text-green-500" />
                <p className="mt-0.5 text-xs font-bold capitalize">{sensorData.activity_level?.slice(0, 3)}</p>
                <p className="text-[8px] text-gray-500">Activity</p>
              </div>
            </div>
          </div>
        )}

        {isPremium && !sensorData && (
          <div className="mt-3 border-t border-gray-100 pt-3 text-center">
            <p className="text-[10px] text-gray-500">Waiting for sensor data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function PetsPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)

  const userPlan = user?.plan || "basic"
  const canAddMore = canAddMorePets(userPlan, pets.length)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    checkPremiumStatus()
    fetchPets()
  }, [user, router])

  const checkPremiumStatus = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("plan_type")
      .eq("user_id", user?.id)
      .eq("status", "active")
      .maybeSingle()
    
    setIsPremium(data?.plan_type === "premium" || data?.plan_type === "standard")
  }

  const fetchPets = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPets(data || [])
    } catch (error) {
      console.error("Error fetching pets:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Pets
            </h1>
            <p className="text-sm text-gray-500">Manage and monitor your pets&apos; health</p>
          </div>
          {canAddMore ? (
            <Link href="/pets/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Pet
              </Button>
            </Link>
          ) : (
            <Button className="gap-2" disabled>
              <Plus className="h-4 w-4" />
              Pet Limit Reached
            </Button>
          )}
        </div>

        {/* Premium Upgrade Prompt for Non-Premium Users */}
        {!isPremium && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800">Upgrade to Premium</p>
                  <p className="text-sm text-amber-700">Get real-time sensor data and AI health analysis</p>
                </div>
              </div>
              <Link href="/pricing">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Pets Grid */}
        {pets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <PawPrint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No pets yet</h3>
              <p className="text-muted-foreground mb-4">Add your first pet to start tracking their health</p>
              {canAddMore && (
                <Link href="/pets/new">
                  <Button>Add Your First Pet</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} isPremium={isPremium} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}