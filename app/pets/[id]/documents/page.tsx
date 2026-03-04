// app/pets/[id]/documents/page.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Download,
  Trash2,
  Plus,
  File,
  Image,
  FileSpreadsheet
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Mock documents
const mockDocs = [
  { id: "1", name: "Vaccination Record.pdf", type: "pdf", category: "vaccination", date: "2026-01-15", size: "2.4 MB" },
  { id: "2", name: "Blood Test Results.jpg", type: "image", category: "lab", date: "2026-02-20", size: "1.1 MB" },
  { id: "3", name: "Prescription - Antibiotics.pdf", type: "pdf", category: "prescription", date: "2026-02-25", size: "0.8 MB" },
]

export default function DocumentsPage() {
  const params = useParams()
  const petId = params.id
  const [documents] = useState(mockDocs)
  const [uploadOpen, setUploadOpen] = useState(false)

  const getIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="h-8 w-8 text-red-500" />
      case 'image': return <Image className="h-8 w-8 text-blue-500" />
      default: return <File className="h-8 w-8 text-gray-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'vaccination': return 'bg-green-100 text-green-700'
      case 'lab': return 'bg-blue-100 text-blue-700'
      case 'prescription': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/pets/${petId}`} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Pet
            </Link>
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Veterinary Documents</h1>
            <p className="text-muted-foreground">Manage health records and certificates</p>
          </div>

          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Add a new veterinary document for your pet
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <Input id="file" type="file" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-name">Document Name</Label>
                  <Input id="doc-name" placeholder="e.g., Rabies Vaccination" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select id="category" className="w-full p-2 border rounded-md">
                    <option>Vaccination</option>
                    <option>Medical Report</option>
                    <option>Prescription</option>
                    <option>Lab Results</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date (optional)</Label>
                    <Input id="expiry" type="date" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setUploadOpen(false)}>
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Documents Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {getIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{doc.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getCategoryColor(doc.category)}>
                        {doc.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{doc.size}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Added: {new Date(doc.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {documents.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload vaccination records, medical reports, and prescriptions
              </p>
              <Button onClick={() => setUploadOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload First Document
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}