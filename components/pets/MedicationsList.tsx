"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pill,
  Plus,
  Trash2,
  Edit,
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  prescribed_by: string | null;
  reason: string | null;
  is_active: boolean;
};

export function MedicationsList({ petId }: { petId: string }) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    prescribed_by: "",
    reason: "",
    is_active: true
  });

  useEffect(() => {
    fetchMedications();
  }, [petId]);

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("pet_id", petId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error("Error fetching medications:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingMed(null);
    setFormData({
      name: "",
      dosage: "",
      frequency: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      prescribed_by: "",
      reason: "",
      is_active: true
    });
  };

  const openEditDialog = (med: Medication) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      start_date: med.start_date,
      end_date: med.end_date || "",
      prescribed_by: med.prescribed_by || "",
      reason: med.reason || "",
      is_active: med.is_active
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.dosage || !formData.frequency) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const medicationData = {
        pet_id: petId,
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        prescribed_by: formData.prescribed_by || null,
        reason: formData.reason || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      if (editingMed) {
        const { error } = await supabase
          .from("medications")
          .update(medicationData)
          .eq("id", editingMed.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("medications")
          .insert([medicationData]);
        if (error) throw error;
      }

      fetchMedications();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving medication:", error);
      alert("Failed to save medication");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medication?")) return;
    
    try {
      const { error } = await supabase
        .from("medications")
        .delete()
        .eq("id", id);
      if (error) throw error;
      fetchMedications();
    } catch (error) {
      console.error("Error deleting medication:", error);
      alert("Failed to delete medication");
    }
  };

  const toggleActive = async (med: Medication) => {
    try {
      const { error } = await supabase
        .from("medications")
        .update({ is_active: !med.is_active })
        .eq("id", med.id);
      if (error) throw error;
      fetchMedications();
    } catch (error) {
      console.error("Error toggling medication:", error);
    }
  };

  const isExpired = (endDate: string | null) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">Loading medications...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Medications
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-1" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMed ? "Edit Medication" : "Add Medication"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Medicine Name *</Label>
                <Input
                  placeholder="e.g., Amoxicillin"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dosage *</Label>
                  <Input
                    placeholder="e.g., 50mg"
                    value={formData.dosage}
                    onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Frequency *</Label>
                  <Input
                    placeholder="e.g., Twice daily"
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Prescribed By (Optional)</Label>
                <Input
                  placeholder="e.g., Dr. Smith"
                  value={formData.prescribed_by}
                  onChange={(e) => setFormData({...formData, prescribed_by: e.target.value})}
                />
              </div>
              <div>
                <Label>Reason (Optional)</Label>
                <Input
                  placeholder="e.g., Ear infection"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingMed ? "Update" : "Add"} Medication
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {medications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No medications yet</p>
            <p className="text-sm">Click Add Medicine to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med) => {
              const expired = isExpired(med.end_date);
              return (
                <div
                  key={med.id}
                  className={`p-4 border rounded-lg transition-all ${
                    !med.is_active ? "opacity-60 bg-gray-50" : ""
                  } ${expired && med.is_active ? "border-red-200 bg-red-50" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        med.is_active && !expired ? "bg-primary/10" : "bg-gray-100"
                      }`}>
                        <Pill className={`h-5 w-5 ${
                          med.is_active && !expired ? "text-primary" : "text-gray-400"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{med.name}</h4>
                          {med.is_active && !expired ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : expired ? (
                            <Badge className="bg-red-100 text-red-700">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {med.dosage} • {med.frequency}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(med.start_date).toLocaleDateString()}
                            {med.end_date && ` - ${new Date(med.end_date).toLocaleDateString()}`}
                          </span>
                          {med.prescribed_by && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Dr. {med.prescribed_by}
                            </span>
                          )}
                        </div>
                        {med.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reason: {med.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleActive(med)}
                        title={med.is_active ? "Mark inactive" : "Mark active"}
                      >
                        {med.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(med)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(med.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}