"use client";

import { useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, AlertCircle } from 'lucide-react';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;


if (data.user) {
  console.log('✅ User logged in:', data.user.id);
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  console.log(' Profile data:', profile);
  console.log('👤 Role:', profile?.role);
  console.log('❌ Error if any:', profileError);

  if (profile?.role === 'admin') {
    console.log('🚀 Redirecting to /admin');
    window.location.href = '/admin';
  } else {
    console.log('🏠 Redirecting to /dashboard');
    window.location.href = '/dashboard';
  }
}

    } catch (err) {
      const error = err as { message: string };
      setError(error.message || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <AuthLayout type="signin">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1.5"
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1.5"
          />
        </div>
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Sign In
        </Button>
      </form>
    </AuthLayout>
  );
}