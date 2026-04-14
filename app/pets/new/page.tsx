"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, PawPrint, Loader2, Upload, X, Camera } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function NewPetPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    ageYears: "",
    ageMonths: "",
    weight: "",
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF, or WebP)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB")
      return
    }

    setSelectedFile(file)
    setError("")
    
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) {
      console.error("No user logged in")
      setError("You must be logged in to upload photos")
      return null
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        if (uploadError.message.includes("bucket not found")) {
          setError("Storage bucket not found. Please contact support.")
        } else {
          setError(`Upload failed: ${uploadError.message}`)
        }
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err) {
      console.error("Unexpected upload error:", err)
      setError("An unexpected error occurred during upload")
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.name.trim()) {
      setError("Pet name is required")
      setLoading(false)
      return
    }

    if (!formData.species.trim()) {
      setError("Species is required")
      setLoading(false)
      return
    }

    if (!user) {
      setError("You must be logged in")
      setLoading(false)
      return
    }

    console.log("Current user:", user.id)

    let photoUrl = null
    if (selectedFile) {
      setUploadingImage(true)
      photoUrl = await uploadImage(selectedFile)
      setUploadingImage(false)
      if (!photoUrl) {
        setError("Failed to upload image. Please try again.")
        setLoading(false)
        return
      }
    }

    const years = parseFloat(formData.ageYears) || 0
    const months = parseFloat(formData.ageMonths) || 0
    let totalAge = null
    if (years > 0 || months > 0) {
      totalAge = years + (months / 12)
      totalAge = Math.round(totalAge * 100) / 100
    }

    const petData = {
      user_id: user.id,
      name: formData.name.trim(),
      species: formData.species.trim(),
      breed: formData.breed.trim() || null,
      age: totalAge,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      photo_url: photoUrl,
    }

    console.log("Submitting pet data:", petData)

    try {
      const { data, error: insertError } = await supabase
        .from("pets")
        .insert([petData])
        .select()

      if (insertError) {
        console.error("Supabase insert error:", insertError)
        setError(`Database error: ${insertError.message}`)
        setLoading(false)
        return
      }

      console.log("Pet added successfully:", data)
      router.push("/pets")
      router.refresh()
    } catch (err) {
      console.error("Error adding pet:", err)
      setError(err instanceof Error ? err.message : "Failed to add pet")
      setLoading(false)
    }
  }

  const clearImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-4">
          <Link href="/pets" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Pets
          </Link>
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
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Pet Name *</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Max" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="species">Species *</Label>
                  <Input 
                    id="species" 
                    placeholder="Dog, Cat, etc." 
                    required
                    value={formData.species}
                    onChange={(e) => setFormData({...formData, species: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Input 
                    id="breed" 
                    placeholder="e.g., Golden Retriever"
                    value={formData.breed}
                    onChange={(e) => setFormData({...formData, breed: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Age</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      max="50"
                      step="1"
                      placeholder="Years"
                      value={formData.ageYears}
                      onChange={(e) => setFormData({...formData, ageYears: e.target.value})}
                    />
                  </div>
                  <div>
                    <Input 
                      type="number" 
                      min="0" 
                      max="11"
                      step="1"
                      placeholder="Months (0-11)"
                      value={formData.ageMonths}
                      onChange={(e) => setFormData({...formData, ageMonths: e.target.value})}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Example: 2 years 6 months = Years: 2, Months: 6
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input 
                  id="weight" 
                  type="number" 
                  min="0" 
                  step="0.1"
                  placeholder="e.g., 25.5"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Pet Photo</Label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </>
                  ) : imagePreview ? (
                    <>
                      <Camera className="h-5 w-5" />
                      <span className="text-sm">Change Photo</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span className="text-sm">Click to Browse Photo from Computer</span>
                    </>
                  )}
                </button>

                {imagePreview && (
                  <div className="mt-2 p-3 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Photo Preview</span>
                      </div>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <img 
                      src={imagePreview} 
                      alt="Pet preview" 
                      className="max-h-48 rounded-lg object-contain mx-auto"
                    />
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Upload a photo from your computer (JPEG, PNG, GIF, WebP, max 5MB)
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading || uploadingImage}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Pet...
                    </>
                  ) : (
                    "Add Pet"
                  )}
                </Button>
                <Link href="/pets">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}