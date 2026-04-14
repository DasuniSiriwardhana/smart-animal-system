"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";
import { ArrowLeft, Loader2, Save, PawPrint } from "lucide-react";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  photo_url: string | null;
};

export default function EditPetPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pet, setPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    age: "",
    weight: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchPet();
  }, [user, petId]);

  const fetchPet = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("id", petId)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setPet(data);
        setFormData({
          name: data.name || "",
          species: data.species || "",
          breed: data.breed || "",
          age: data.age?.toString() || "",
          weight: data.weight?.toString() || "",
        });
      }
    } catch (error) {
      console.error("Error fetching pet:", error);
      setError("Pet not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("pets")
        .update({
          name: formData.name,
          species: formData.species,
          breed: formData.breed,
          age: parseInt(formData.age) || 0,
          weight: parseFloat(formData.weight) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", petId)
        .eq("user_id", user?.id);

      if (error) throw error;

      router.push(`/pets/${petId}`);
    } catch (error) {
      console.error("Error updating pet:", error);
      setError("Failed to update pet. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Pet not found</h1>
          <Button asChild className="mt-4">
            <Link href="/pets">Back to Pets</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-gray-50/50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/pets/${petId}`} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {pet.name}
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              Edit {pet.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Pet Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="species">Species *</Label>
                <Input
                  id="species"
                  name="species"
                  value={formData.species}
                  onChange={handleChange}
                  placeholder="Dog, Cat, Bird, etc."
                  required
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  placeholder="e.g., Golden Retriever"
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age (years)</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    step="0.5"
                    value={formData.age}
                    onChange={handleChange}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleChange}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/pets/${petId}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}