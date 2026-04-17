"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function VerifyPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawToken = searchParams.get('token');
  
  // ✅ Decode the token in case it's URL encoded
  const token = rawToken ? decodeURIComponent(rawToken) : null;
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔍 Raw token from URL:", rawToken);
    console.log("🔍 Decoded token:", token);
    
    if (!token) {
      setError("Invalid or missing verification token");
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        console.log("🔍 Verifying token in database:", token);
        
        const { data, error } = await supabase
          .from('password_reset_requests')
          .select('user_id, expires_at, used')
          .eq('token', token)
          .maybeSingle();  // ✅ Changed from .single() to .maybeSingle() to avoid errors

        console.log("🔍 Database result:", data);
        console.log("🔍 Database error:", error);

        if (error) {
          console.error("Database query error:", error);
          setError("Error verifying token. Please try again.");
          setVerifying(false);
          return;
        }

        if (!data) {
          setError("Invalid verification token. The link may be incorrect or already used.");
          setVerifying(false);
          return;
        }

        if (data.used) {
          setError("This link has already been used. Please request a new password reset.");
          setVerifying(false);
          return;
        }

        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        
        console.log("Expires at:", expiresAt);
        console.log("Now:", now);
        
        if (expiresAt < now) {
          setError("This link has expired. Please request a new password change.");
          setVerifying(false);
          return;
        }

        setUserId(data.user_id);
        setValid(true);
        setVerifying(false);
        
      } catch (err) {
        console.error("Token verification error:", err);
        setError("Failed to verify token. Please try again.");
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, rawToken]);

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Updating password for user:", userId);
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId,
          newPassword: newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      console.log("Password updated successfully");
      
      // Mark token as used
      await supabase
        .from('password_reset_requests')
        .update({ used: true })
        .eq('token', token);

      setSuccess(true);
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err) {
      console.error("Password update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3">Verifying your request...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {valid ? "Set New Password" : "Verification Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Password updated successfully! Redirecting to login...
                </AlertDescription>
              </Alert>
            )}

            {valid && !success && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={loading || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </div>
            )}

            {!valid && !success && (
              <Button onClick={() => router.push('/forgot-password')} className="w-full">
                Request New Reset Link
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyPasswordContent />
    </Suspense>
  );
}