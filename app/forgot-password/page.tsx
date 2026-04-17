"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        setError("No account found with this email address");
        setLoading(false);
        return;
      }

      // Generate token
      const token = crypto.randomUUID ? crypto.randomUUID() : 
                    Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Save token
      await supabase.from("password_reset_requests").insert({
        user_id: profile.id,
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false
      });

      // FIX: Use the full URL with the correct path
      const resetLink = `${window.location.origin}/verify-password?token=${token}`;
      
      console.log("Reset link being sent:", resetLink); // Debug log
      
      const response = await fetch('/api/auth/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email,
          resetLink: resetLink,
          name: email.split('@')[0]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      setSuccess(true);
      
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="mb-4">
          <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            {success ? (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Password reset link sent! Please check your email.
                  </AlertDescription>
                </Alert>
                <Link href="/login">
                  <Button className="w-full">Return to Login</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send Reset Link
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}