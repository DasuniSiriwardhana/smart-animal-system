"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  FileText,
  Upload,
  Trash2,
  File,
  Image,
  Loader2,
  Calendar,
  Stethoscope
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { PlanGuard } from "@/components/plan-guard"

type Document = {
  id: string
  doc_name: string
  doc_category: string
  doc_date: string
  expiration_date: string | null
  file_url: string | null
  notes: string | null
  created_at: string
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const petId = params.id as string
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [petName, setPetName] = useState("")

  const [uploadForm, setUploadForm] = useState({
    doc_name: "",
    doc_category: "vaccination",
    doc_date: new Date().toISOString().split('T')[0],
    expiration_date: "",
    notes: ""
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchPetInfo()
    fetchDocuments()
  }, [petId, user, router])

  const fetchPetInfo = async () => {
    const { data } = await supabase
      .from("pets")
      .select("name")
      .eq("id", petId)
      .single()
    
    if (data) {
      setPetName(data.name)
    }
  }

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("vet_documents")
        .select("*")
        .eq("pet_id", petId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadForm.doc_name) {
      alert("Please enter a document name")
      return
    }

    setUploadLoading(true)
    try {
      const { error } = await supabase
        .from("vet_documents")
        .insert({
          pet_id: petId,
          doc_name: uploadForm.doc_name,
          doc_category: uploadForm.doc_category,
          doc_date: uploadForm.doc_date,
          expiration_date: uploadForm.expiration_date || null,
          notes: uploadForm.notes || null,
        })

      if (error) throw error

      setUploadOpen(false)
      setUploadForm({
        doc_name: "",
        doc_category: "vaccination",
        doc_date: new Date().toISOString().split('T')[0],
        expiration_date: "",
        notes: ""
      })
      fetchDocuments()
    } catch (error) {
      console.error("Error uploading document:", error)
      alert("Failed to upload document")
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const { error } = await supabase
        .from("vet_documents")
        .delete()
        .eq("id", docId)

      if (error) throw error
      fetchDocuments()
    } catch (error) {
      console.error("Error deleting document:", error)
      alert("Failed to delete document")
    }
  }

  const getIcon = (category: string) => {
    switch(category) {
      case 'vaccination': return <FileText className="h-8 w-8 text-green-500" />
      case 'medical': return <Stethoscope className="h-8 w-8 text-blue-500" />
      case 'prescription': return <FileText className="h-8 w-8 text-orange-500" />
      case 'lab': return <Image className="h-8 w-8 text-purple-500" />
      default: return <File className="h-8 w-8 text-gray-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'vaccination': return 'bg-green-100 text-green-700'
      case 'medical': return 'bg-blue-100 text-blue-700'
      case 'prescription': return 'bg-orange-100 text-orange-700'
      case 'lab': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch(category) {
      case 'vaccination': return 'Vaccination'
      case 'medical': return 'Medical Report'
      case 'prescription': return 'Prescription'
      case 'lab': return 'Lab Results'
      default: return category
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <PlanGuard requiredFeature="document_storage">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          {/* Fixed Back Button */}
          <div className="mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push(`/pets/${petId}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {petName || "Pet"}
            </Button>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Veterinary Documents</h1>
              <p className="text-muted-foreground">Manage health records and certificates for {petName}</p>
            </div>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Document</DialogTitle>
                  <DialogDescription>
                    Add a new veterinary document for {petName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="doc-name">Document Name *</Label>
                    <Input 
                      id="doc-name" 
                      placeholder="e.g., Rabies Vaccination"
                      value={uploadForm.doc_name}
                      onChange={(e) => setUploadForm({...uploadForm, doc_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={uploadForm.doc_category} 
                      onValueChange={(v) => setUploadForm({...uploadForm, doc_category: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vaccination">Vaccination</SelectItem>
                        <SelectItem value="medical">Medical Report</SelectItem>
                        <SelectItem value="prescription">Prescription</SelectItem>
                        <SelectItem value="lab">Lab Results</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input 
                        id="date" 
                        type="date" 
                        value={uploadForm.doc_date}
                        onChange={(e) => setUploadForm({...uploadForm, doc_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date (optional)</Label>
                      <Input 
                        id="expiry" 
                        type="date"
                        value={uploadForm.expiration_date}
                        onChange={(e) => setUploadForm({...uploadForm, expiration_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input 
                      id="notes" 
                      placeholder="Additional information"
                      value={uploadForm.notes}
                      onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={uploadLoading}>
                    {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Document"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Documents Grid */}
          {documents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add vaccination records, medical reports, and prescriptions for {petName}
                </p>
                <Button onClick={() => setUploadOpen(true)} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Add First Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {getIcon(doc.doc_category)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{doc.doc_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(doc.doc_category)}>
                            {getCategoryLabel(doc.doc_category)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(doc.doc_date).toLocaleDateString()}</span>
                        </div>
                        {doc.expiration_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Expires: {new Date(doc.expiration_date).toLocaleDateString()}
                          </p>
                        )}
                        {doc.notes && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PlanGuard>
  )
}