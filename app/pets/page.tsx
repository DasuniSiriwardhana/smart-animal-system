// app/pets/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  PawPrint, 
  Plus, 
  Search,
  Dog,
  Cat,
  Bird,
  Fish,
  MoreVertical,
  ChevronRight
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data
const mockPets = [
  { id: "1", name: "Max", type: "dog", species: "Golden Retriever", age: 3, weight: 28.5, image: Dog },
  { id: "2", name: "Luna", type: "cat", species: "Siamese", age: 2, weight: 4.2, image: Cat },
  { id: "3", name: "Rio", type: "bird", species: "Parrot", age: 5, weight: 0.3, image: Bird },
  { id: "4", name: "Charlie", type: "dog", species: "Beagle", age: 4, weight: 12.5, image: Dog },
  { id: "5", name: "Bella", type: "cat", species: "Persian", age: 3, weight: 3.8, image: Cat },
  { id: "6", name: "Nemo", type: "fish", species: "Clownfish", age: 1, weight: 0.1, image: Fish },
]

export default function PetsPage() {
  const [pets] = useState(mockPets)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPets = pets.filter(pet => 
    pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Pets</h1>
            <p className="text-muted-foreground">Manage and track all your pets</p>
          </div>
          <Button className="gap-2" asChild>
            <Link href="/pets/new">
              <Plus className="h-4 w-4" />
              Add New Pet
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pets by name or species..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Pets Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPets.map((pet) => {
            const Icon = pet.image
            return (
              <Card key={pet.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{pet.name}</h3>
                        <p className="text-sm text-muted-foreground">{pet.species}</p>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{pet.age} years</span>
                          <span>•</span>
                          <span>{pet.weight} kg</span>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/pets/${pet.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/pets/${pet.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/pets/${pet.id}/logs`}>View Logs</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/pets/${pet.id}/logs`}>Add Log</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/pets/${pet.id}`}>View</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredPets.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <PawPrint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No pets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try a different search term" : "Add your first pet to get started"}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/pets/new">Add Your First Pet</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}