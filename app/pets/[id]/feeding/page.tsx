// app/pets/[id]/feeding/page.tsx
"use client";

import { useState, useEffect } from "react"; 
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { FeedingScheduleManager } from "@/components/pets/FeedingScheduleManager";
import { FeedingReminder } from "@/components/pets/FeedingReminder";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/auth-provider";

export default function FeedingPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const petId = params.id as string;
  const [petName, setPetName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPetName() {
      if (!user) {
        router.push("/login");
        return;
      }
      
      if (!petId) return;
      
      const { data } = await supabase
        .from("pets")
        .select("name")
        .eq("id", petId)
        .single();
      
      if (data) {
        setPetName(data.name);
      }
      setLoading(false);
    }

    fetchPetName();
  }, [user, petId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href={`/pets/${petId}`} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {petName || "Pet"}
            </Link>
          </Button>
        </div>

        {/* Feeding Schedule Manager */}
        <FeedingScheduleManager petId={petId} />
        
        {/* Feeding Reminder Popup */}
        {petName && <FeedingReminder petId={petId} petName={petName} />}
      </div>
    </div>
  );
}