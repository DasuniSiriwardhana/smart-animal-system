"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Mail } from 'lucide-react';

type AuthError = {
  message: string;
};

type PasswordChecks = {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

// Function to detect user location
async function detectUserLocation() {
  try {
    // Using ipapi.co for free geolocation (no API key needed)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      city: data.city || 'Unknown',
      country: data.country_name || 'Unknown',
      latitude: data.latitude || null,
      longitude: data.longitude || null
    };
  } catch (error) {
    console.error('Location detection failed:', error);
    return { city: 'Unknown', country: 'Unknown', latitude: null, longitude: null };
  }
}

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validatePassword = (password: string): PasswordChecks => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }
    
    const passwordChecks = validatePassword(formData.password);
    if (!passwordChecks.length) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!passwordChecks.uppercase) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!passwordChecks.lowercase) {
      setError("Password must contain at least one lowercase letter");
      return;
    }
    if (!passwordChecks.number) {
      setError("Password must contain at least one number");
      return;
    }
    
    setLoading(true);
    
    try {
      // Detect location before signup
      const location = await detectUserLocation();
      
      const { data, error } = await supabase.auth.signUp({ 
        email: formData.email, 
        password: formData.password,
        options: { 
          data: { 
            name: formData.name,
            city: location.city,
            country: location.country
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Update profile with location data
        await supabase
          .from('profiles')
          .update({
            name: formData.name,
            city: location.city,
            country: location.country,
            latitude: location.latitude,
            longitude: location.longitude
          })
          .eq('id', data.user.id);
        
        setSuccess(true);
        setTimeout(() => {
          router.push('/login?verified=pending');
        }, 5000);
      }
      
    } catch (err) {
      const authError = err as AuthError;
      let errorMessage = authError.message || "Failed to create account";
      if (errorMessage.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout type="signup">
        <div className="text-center space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-green-700 font-semibold text-lg">Verify Your Email</p>
            <p className="text-green-600 text-sm mt-2">
              We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>
            </p>
            <p className="text-gray-500 text-xs mt-4">
              Please check your email and click the verification link to activate your account.
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const passwordChecks = validatePassword(formData.password);
  const showStrength = formData.password.length > 0;

  return (
    <AuthLayout type="signup">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="David Warner"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="mt-1.5"
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="petowner@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="mt-1.5"
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="mt-1.5"
          />
          
          {showStrength && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-2">
                <div className={`h-1 flex-1 rounded-full ${passwordChecks.length ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`h-1 flex-1 rounded-full ${passwordChecks.uppercase ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`h-1 flex-1 rounded-full ${passwordChecks.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                <div className={`h-1 flex-1 rounded-full ${passwordChecks.special ? 'bg-green-500' : 'bg-gray-200'}`} />
              </div>
              <p className="text-xs text-muted-foreground">
                Password must have: 8+ chars, uppercase, number, special character
              </p>
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            className="mt-1.5"
          />
        </div>
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Create Account
        </Button>
      </form>
    </AuthLayout>
  );
}