// src/components/pets/MedicationsList.tsx
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Pill, AlertCircle, Loader2 } from "lucide-react"

type Medication = {
  id: string
  pet_id: string
  name: string
  dosage: string
  frequency: string
  start_date: string
  end_date: string | null
  prescribed_by: string | null
  is_active: boolean
}

interface MedicationsListProps {
  petId: string
}

export function MedicationsList({ petId }: MedicationsListProps) {
  const { user } = useAuth()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingMed, setEditingMed] = useState<Medication | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    prescribed_by: "",
    is_active: true
  })

  useEffect(() => {
    fetchMedications()
  }, [petId])

  const fetchMedications = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from("medications")
        .select("*")
        .eq("pet_id", petId)
        .order("start_date", { ascending: false })

      if (fetchError) {
        console.error("Fetch error:", fetchError)
        setError(fetchError.message)
        return
      }

      setMedications(data || [])
    } catch (err) {
      console.error("Unexpected error fetching medications:", err)
      setError(err instanceof Error ? err.message : "Failed to load medications")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      setError("Please log in to save medications")
      return
    }

    if (!formData.name || !formData.dosage || !formData.frequency) {
      setError("Please fill in all required fields (name, dosage, frequency)")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const medicationData = {
        pet_id: petId,
        user_id: user.id,  // ✅ Now this column exists!
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        prescribed_by: formData.prescribed_by || null,
        is_active: formData.is_active
      }

      console.log("Saving medication:", medicationData)

      let result
      if (editingMed) {
        result = await supabase
          .from("medications")
          .update(medicationData)
          .eq("id", editingMed.id)
      } else {
        result = await supabase
          .from("medications")
          .insert([medicationData])
      }

      if (result.error) {
        console.error("Supabase error:", result.error)
        setError(result.error.message)
        return
      }

      console.log("Medication saved successfully:", result)
      
      resetForm()
      await fetchMedications()
      
    } catch (err) {
      console.error("Unexpected error saving medication:", err)
      setError(err instanceof Error ? err.message : "Failed to save medication")
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      frequency: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      prescribed_by: "",
      is_active: true
    })
    setEditingMed(null)
    setShowForm(false)
    setError(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medication?")) return

    try {
      setError(null)
      const { error: deleteError } = await supabase
        .from("medications")
        .delete()
        .eq("id", id)

      if (deleteError) {
        console.error("Delete error:", deleteError)
        setError(deleteError.message)
        return
      }

      await fetchMedications()
    } catch (err) {
      console.error("Unexpected error deleting medication:", err)
      setError(err instanceof Error ? err.message : "Failed to delete medication")
    }
  }

  const handleEdit = (med: Medication) => {
    setEditingMed(med)
    setFormData({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      start_date: med.start_date,
      end_date: med.end_date || "",
      prescribed_by: med.prescribed_by || "",
      is_active: med.is_active
    })
    setShowForm(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">Loading medications...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-gray-600" />
          Medications
        </CardTitle>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Medication
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-3">
              {editingMed ? "Edit Medication" : "Add New Medication"}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Medication name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Dosage (e.g., 10mg) *"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Frequency (e.g., Twice daily) *"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="date"
                  placeholder="End date (optional)"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <input
                type="text"
                placeholder="Prescribed by (optional)"
                value={formData.prescribed_by}
                onChange={(e) => setFormData({ ...formData, prescribed_by: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                <label className="text-sm">Active prescription</label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {medications.length === 0 && !showForm ? (
          <div className="text-center py-8 text-gray-500">
            <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No medications prescribed</p>
            <p className="text-sm">Click &quot;Add Medication&quot; to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{med.name}</h4>
                      {med.is_active ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 text-xs">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{med.dosage} • {med.frequency}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Started: {new Date(med.start_date).toLocaleDateString()}
                      {med.end_date && ` • Ended: ${new Date(med.end_date).toLocaleDateString()}`}
                    </p>
                    {med.prescribed_by && (
                      <p className="text-xs text-gray-500">Prescribed by: {med.prescribed_by}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(med)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(med.id)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}