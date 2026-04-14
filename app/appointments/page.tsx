"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Clock,
  MapPin,
  Stethoscope,
  PawPrint,
  ArrowLeft
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"

type Pet = {
  id: string
  name: string
  species: string
}

type Appointment = {
  id: string
  pet_id: string
  appointment_date: string
  appointment_time: string
  vet_name: string
  clinic_name: string
  reason: string
  status: string
  notes: string
  created_at: string
  pets?: {
    name: string
    species: string
  }
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  missed: "bg-yellow-100 text-yellow-700"
}

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  missed: "Missed"
}

export default function AppointmentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    pet_id: "",
    appointment_date: "",
    appointment_time: "",
    vet_name: "",
    clinic_name: "",
    reason: "",
    status: "scheduled",
    notes: ""
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchPets()
    fetchAppointments()
  }, [user, router])

  const fetchPets = async () => {
    try {
      const { data, error } = await supabase
        .from("pets")
        .select("id, name, species")
        .eq("user_id", user?.id)

      if (error) throw error
      setPets(data || [])
    } catch (error) {
      console.error("Error fetching pets:", error)
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          pets!inner (
            name,
            species
          )
        `)
        .eq("pets.user_id", user?.id)
        .order("appointment_date", { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError("")
    
    // Validation
    if (!formData.pet_id) {
      setError("Please select a pet")
      return
    }
    if (!formData.appointment_date) {
      setError("Please select a date")
      return
    }
    if (!formData.appointment_time) {
      setError("Please select a time")
      return
    }
    if (!formData.vet_name.trim()) {
      setError("Please enter vet name")
      return
    }
    if (!formData.reason.trim()) {
      setError("Please enter a reason")
      return
    }

    setSaving(true)
    
    try {
      const appointmentData = {
        pet_id: formData.pet_id,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        vet_name: formData.vet_name.trim(),
        clinic_name: formData.clinic_name.trim() || null,
        reason: formData.reason.trim(),
        status: formData.status,
        notes: formData.notes.trim() || null
      }

      console.log("Saving appointment:", appointmentData)

      let result
      if (editingAppointment) {
        result = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", editingAppointment.id)
      } else {
        result = await supabase
          .from("appointments")
          .insert([appointmentData])
      }

      if (result.error) {
        console.error("Supabase error:", result.error)
        setError(result.error.message)
        return
      }

      console.log("Save successful:", result)
      resetForm()
      fetchAppointments()
    } catch (err) {
      console.error("Error saving appointment:", err)
      setError(err instanceof Error ? err.message : "Failed to save appointment")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id)

      if (error) throw error
      fetchAppointments()
    } catch (error) {
      console.error("Error deleting appointment:", error)
      alert("Failed to delete appointment")
    }
  }

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setFormData({
      pet_id: appointment.pet_id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      vet_name: appointment.vet_name,
      clinic_name: appointment.clinic_name || "",
      reason: appointment.reason,
      status: appointment.status,
      notes: appointment.notes || ""
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingAppointment(null)
    setFormData({
      pet_id: "",
      appointment_date: "",
      appointment_time: "",
      vet_name: "",
      clinic_name: "",
      reason: "",
      status: "scheduled",
      notes: ""
    })
    setError("")
    setDialogOpen(false)
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-700"}>
        {statusLabels[status] || status}
      </Badge>
    )
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-muted-foreground">Manage your pet&apos;s vet appointments</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={resetForm}>
                <Plus className="h-4 w-4" />
                  New Appointment
                     </Button>
                      </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingAppointment ? "Edit Appointment" : "New Appointment"}</DialogTitle>
                <DialogDescription>
                  {editingAppointment ? "Update appointment details" : "Schedule a new vet appointment"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Select Pet *</Label>
                  <Select value={formData.pet_id} onValueChange={(v) => setFormData({...formData, pet_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a pet" />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name} ({pet.species})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input 
                      type="date" 
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time *</Label>
                    <Input 
                      type="time" 
                      value={formData.appointment_time}
                      onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vet Name *</Label>
                  <Input 
                    placeholder="Dr. Smith"
                    value={formData.vet_name}
                    onChange={(e) => setFormData({...formData, vet_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Clinic Name</Label>
                  <Input 
                    placeholder="Animal Care Clinic"
                    value={formData.clinic_name}
                    onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reason *</Label>
                  <Input 
                    placeholder="Vaccination, Checkup, etc."
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Additional notes..."
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingAppointment ? "Update" : "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {appointments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No appointments yet</h3>
              <p className="text-muted-foreground mb-4">
                Schedule vet appointments to keep track of your pet&apos;s health
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule First Appointment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        {appointment.pets?.name || "Unknown Pet"}
                      </CardTitle>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                  <CardDescription>{appointment.reason}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span>{appointment.appointment_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.vet_name}</span>
                    </div>
                    {appointment.clinic_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.clinic_name}</span>
                      </div>
                    )}
                    {appointment.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(appointment)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(appointment.id)}
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
  )
}



