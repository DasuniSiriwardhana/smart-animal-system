"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function VerifyPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing verification token");
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const { data, error } = await supabase
          .from('password_reset_requests')
          .select('user_id, expires_at, used')
          .eq('token', token)
          .single();

        if (error || !data) {
          setError("Invalid verification token");
          setVerifying(false);
          return;
        }

        if (data.used) {
          setError("This link has already been used");
          setVerifying(false);
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setError("This link has expired. Please request a new password change.");
          setVerifying(false);
          return;
        }

        setValid(true);
        setVerifying(false);
      } catch (err) {
        setError("Failed to verify token");
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

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
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      await supabase
        .from('password_reset_requests')
        .update({ used: true })
        .eq('token', token);

      setSuccess(true);
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err) {
      setError("Failed to update password. Please try again.");
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
              <Button onClick={() => router.push('/settings')} className="w-full">
                Back to Settings
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}