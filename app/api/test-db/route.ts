import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test connection by fetching pets
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database connected!",
      data: data 
    });
  } catch (error) {
    return NextResponse.json({ error: "Connection failed" }, { status: 500 });
  }
}