"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

type User = {
  id: string;
  email: string;
  name?: string;
  role?: "user" | "admin";
  plan?: "basic" | "standard" | "premium";
  avatar_url?: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar_url?: string }) => Promise<void>;
};

type ProfileUpdate = {
  updated_at: string;
  name?: string;
  avatar_url?: string;
};

type ProfileData = {
  role: "user" | "admin";
  plan: "basic" | "standard" | "premium";
  name?: string;
  avatar_url?: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(userId: string): Promise<ProfileData> {
  try {
    // Get active subscription first (this is the source of truth)
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan_type, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    // Determine plan from subscription
    let plan: "basic" | "standard" | "premium" = "basic";
    if (subscription?.plan_type === "standard") {
      plan = "standard";
    } else if (subscription?.plan_type === "premium") {
      plan = "premium";
    }
    
    // Also update the profiles table to keep it in sync
    await supabase
      .from("profiles")
      .update({ plan: plan })
      .eq("id", userId);

    // Get role from profiles
    let role: "user" | "admin" = "user";
    let name: string | undefined;
    let avatar_url: string | null = null;
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, role, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      name = profile.name;
      avatar_url = profile.avatar_url;
      if (profile.role === "admin") {
        role = "admin";
      }
    }
    
    return { role, plan, name, avatar_url };
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return { role: "user", plan: "basic" };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: profile.name || session.user.user_metadata?.name,
          role: profile.role,
          plan: profile.plan,
          avatar_url: profile.avatar_url,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; avatar_url?: string }) => {
    if (!user) throw new Error("No user logged in");
    
    try {
      const updates: ProfileUpdate = { updated_at: new Date().toISOString() };
      if (data.name !== undefined) updates.name = data.name;
      if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;
      
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...updates });
      
      if (error) throw error;
      
      await refreshUser();
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }, [user, refreshUser]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile.name || session.user.user_metadata?.name,
            role: profile.role,
            plan: profile.plan,
            avatar_url: profile.avatar_url,
          });
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: profile.name || session.user.user_metadata?.name,
          role: profile.role,
          plan: profile.plan,
          avatar_url: profile.avatar_url,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refreshUser();
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error, data } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { 
        data: { name }
      }
    });
    if (error) throw error;
    
    if (data.user) {
      try {
        await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            name: name,
            email: email,
            plan: "basic",
            role: "user",
            created_at: new Date().toISOString(),
          });
        
        await supabase
          .from("subscriptions")
          .insert({
            user_id: data.user.id,
            plan_type: "basic",
            start_date: new Date().toISOString().split('T')[0],
            status: "active",
            amount: 0
          });
      } catch (subError) {
        console.error("Error creating profile/subscription:", subError);
      }
    }
    
    await refreshUser();
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      // Force hard navigation to home
      window.location.href = '/';
    } catch (error) {
      console.error("Sign out error:", error);
      setUser(null);
      window.location.replace('/');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      signIn, 
      signUp, 
      signOut, 
      refreshUser,
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}