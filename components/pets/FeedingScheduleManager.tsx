"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Trash2, Edit, Calendar, AlertCircle, Loader2, Crown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";
import { canAddMoreFeedingSchedules, getPlanLimit } from "@/lib/plan-config";

type FeedingSchedule = {
  id: string;
  meal_time: string;
  meal_type: string;
  food_type: string;
  portion_size: number;
  portion_unit: string;
  instructions: string | null;
  is_active: boolean;
};

export function FeedingScheduleManager({ petId }: { petId: string }) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FeedingSchedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    meal_time: "08:00",
    meal_type: "breakfast",
    food_type: "dry",
    portion_size: 100,
    portion_unit: "grams",
    instructions: ""
  });

  const userPlan = (user?.plan || "basic") as "basic" | "standard" | "premium";
  const maxSchedules = getPlanLimit(userPlan, "maxFeedingSchedules");
  const canAddMore = canAddMoreFeedingSchedules(userPlan, schedules.length);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("feeding_schedules")
        .select("*")
        .eq("pet_id", petId)
        .order("meal_time");
      
      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [petId]);

const saveSchedule = async () => {
  setSubmitting(true);
  try {
    if (editingSchedule) {
      const { error } = await supabase
        .from("feeding_schedules")
        .update({
          meal_time: formData.meal_time,
          meal_type: formData.meal_type,
          food_type: formData.food_type,
          portion_size: formData.portion_size,
          portion_unit: formData.portion_unit,
          instructions: formData.instructions || null,
        })
        .eq("id", editingSchedule.id);
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("feeding_schedules")
        .insert({
          pet_id: petId,
          meal_time: formData.meal_time,
          meal_type: formData.meal_type,
          food_type: formData.food_type,
          portion_size: formData.portion_size,
          portion_unit: formData.portion_unit,
          instructions: formData.instructions || null,
          is_active: true,
          confirmed: false,
          skipped: false,
          reminder_sent: false
        });
      
      if (error) throw error;
    }
    
    fetchSchedules();
    setIsDialogOpen(false);
    resetForm();
  } catch (error) {
    console.error("Error saving schedule:", error);
    alert("Failed to save schedule");
  } finally {
    setSubmitting(false);
  }
};

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this feeding schedule?")) return;
    
    try {
      const { error } = await supabase
        .from("feeding_schedules")
        .delete()
        .eq("id", scheduleId);
      
      if (error) throw error;
      fetchSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Failed to delete schedule");
    }
  };

  const toggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("feeding_schedules")
        .update({ is_active: !isActive })
        .eq("id", scheduleId);
      
      if (error) throw error;
      fetchSchedules();
    } catch (error) {
      console.error("Error toggling schedule:", error);
    }
  };

  const resetForm = () => {
    setEditingSchedule(null);
    setFormData({
      meal_time: "08:00",
      meal_type: "breakfast",
      food_type: "dry",
      portion_size: 100,
      portion_unit: "grams",
      instructions: ""
    });
  };

  const openEditDialog = (schedule: FeedingSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      meal_time: schedule.meal_time,
      meal_type: schedule.meal_type,
      food_type: schedule.food_type,
      portion_size: schedule.portion_size,
      portion_unit: schedule.portion_unit,
      instructions: schedule.instructions || ""
    });
    setIsDialogOpen(true);
  };

  const getMealIcon = (type: string) => {
    switch(type) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥗';
      case 'dinner': return '🍲';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading feeding schedules...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
          <p className="text-red-600 font-medium">Error loading schedules</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button onClick={fetchSchedules} className="mt-4" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Feeding Schedules
          <Badge variant="outline" className="ml-2">
            {schedules.length} / {maxSchedules === 999 ? "∞" : maxSchedules}
          </Badge>
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => resetForm()} disabled={!canAddMore}>
              <Plus className="h-4 w-4 mr-1" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Edit Feeding Schedule" : "Create Feeding Schedule"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Meal Time</Label>
                  <Input
                    type="time"
                    value={formData.meal_time}
                    onChange={(e) => setFormData({...formData, meal_time: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Meal Type</Label>
                  <Select value={formData.meal_type} onValueChange={(v) => setFormData({...formData, meal_type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Food Type</Label>
                  <Select value={formData.food_type} onValueChange={(v) => setFormData({...formData, food_type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dry">Dry Food</SelectItem>
                      <SelectItem value="wet">Wet Food</SelectItem>
                      <SelectItem value="raw">Raw Food</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Portion Size</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.portion_size}
                      onChange={(e) => setFormData({...formData, portion_size: parseFloat(e.target.value)})}
                    />
                    <Select value={formData.portion_unit} onValueChange={(v) => setFormData({...formData, portion_unit: v})}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grams">grams</SelectItem>
                        <SelectItem value="cups">cups</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div>
                <Label>Instructions (Optional)</Label>
                <Input
                  placeholder="e.g., Add warm water, mix with medication"
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                />
              </div>
              <Button onClick={saveSchedule} disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingSchedule ? "Update Schedule" : "Create Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No feeding schedules yet</p>
            <p className="text-sm text-muted-foreground">Click Add Schedule to create one</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.id} className={`flex items-center justify-between p-4 border rounded-lg ${!schedule.is_active ? 'opacity-50 bg-gray-50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{getMealIcon(schedule.meal_type)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">{schedule.meal_type}</span>
                        <span className="text-sm text-muted-foreground">at {schedule.meal_time}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {schedule.portion_size} {schedule.portion_unit} • {schedule.food_type} food
                      </div>
                      {schedule.instructions && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {schedule.instructions}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                    >
                      {schedule.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {!canAddMore && schedules.length > 0 && (
              <p className="text-xs text-amber-600 mt-4 text-center">
                <Crown className="h-3 w-3 inline mr-1" />
                You&apos;ve reached your feeding schedule limit ({maxSchedules}). Upgrade to Premium for unlimited schedules.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}