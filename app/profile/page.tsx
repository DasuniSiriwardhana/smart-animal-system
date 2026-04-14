"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth/auth-provider';
import { Loader2, Camera, User, Mail, Calendar, Shield } from 'lucide-react';

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  avatar_url: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      alert('Profile updated successfully!');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file');
    return;
  }
  
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('File size must be less than 2MB');
    return;
  }
  
  setUploading(true);
  
  try {
    // Create a unique file name with user ID as folder
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);
    
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user?.id);
    
    if (updateError) throw updateError;
    
    alert('Avatar updated successfully!');
    fetchProfile();
    
  } catch (error) {
    console.error('Error uploading avatar:', error);
    alert('Failed to upload avatar. Please try again.');
  } finally {
    setUploading(false);
  }
};

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Avatar Section */}
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 mx-auto">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-primary/50" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              {uploading && (
                <p className="text-xs text-muted-foreground mt-2">Uploading...</p>
              )}
              <p className="text-sm text-muted-foreground mt-4">
                Click the camera icon to upload a profile picture
              </p>
            </CardContent>
          </Card>
          
          {/* Profile Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="mt-1.5 bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Account Role</Label>
                    <div className="flex items-center gap-2 mt-1.5 p-2 bg-muted rounded-lg">
                      <Shield className="h-4 w-4 text-accent" />
                      <span className="text-sm capitalize">{profile?.role || 'User'}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Subscription Plan</Label>
                    <div className="flex items-center gap-2 mt-1.5 p-2 bg-muted rounded-lg">
                      <span className="text-sm capitalize font-medium">
                        {profile?.plan || 'Basic'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Member Since</Label>
                  <div className="flex items-center gap-2 mt-1.5 p-2 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString() 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}