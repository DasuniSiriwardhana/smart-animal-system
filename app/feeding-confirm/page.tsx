"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, PawPrint } from 'lucide-react';

type ScheduleDetails = {
  meal_type: string;
  portion_size: number;
  portion_unit: string;
  food_type: string;
};

function FeedingConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get('scheduleId');
  const petName = searchParams.get('petName') || 'your pet';
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [scheduleDetails, setScheduleDetails] = useState<ScheduleDetails | null>(null);
  
  const [formData, setFormData] = useState({
    brand: '',
    product: '',
    actualPortion: ''
  });

  useEffect(() => {
    if (scheduleId) {
      fetchScheduleDetails();
    }
  }, [scheduleId]);

  const fetchScheduleDetails = async () => {
    try {
      const response = await fetch(`/api/feeding/schedule-details?scheduleId=${scheduleId}`);
      const data = await response.json();
      if (data.success) {
        setScheduleDetails(data.schedule);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.brand || !formData.product || !formData.actualPortion) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/feeding/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: scheduleId,
          food_brand: formData.brand,
          food_product: formData.product,
          actual_portion: parseFloat(formData.actualPortion)
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
      } else {
        setError(data.error || 'Failed to confirm feeding');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!scheduleId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 max-w-md">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 font-medium">Invalid confirmation link</p>
              <p className="text-sm text-muted-foreground mt-2">The link may be broken or already used.</p>
              <Button onClick={() => window.location.href = '/dashboard'} className="mt-4">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <PawPrint className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Confirm Feeding</CardTitle>
            <CardDescription>
              Log the details for {petName}&apos;s meal
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-green-600 font-medium text-lg">Feeding Confirmed!</p>
                <p className="text-muted-foreground">Thank you for logging {petName}&apos;s meal.</p>
                <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {scheduleDetails && (
                  <div className="p-3 bg-primary/5 rounded-lg text-sm">
                    <p className="font-medium mb-1">📋 Meal Details:</p>
                    <p className="text-muted-foreground">
                      {scheduleDetails.meal_type} • {scheduleDetails.portion_size} {scheduleDetails.portion_unit || 'grams'} • {scheduleDetails.food_type}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="brand">Food Brand *</Label>
                  <Input
                    id="brand"
                    placeholder="e.g., Whiskas, Pedigree, Royal Canin"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                
                <div>
                  <Label htmlFor="product">Food Product *</Label>
                  <Input
                    id="product"
                    placeholder="e.g., Tuna, Chicken, Adult Dry Food"
                    value={formData.product}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>
                
                <div>
                  <Label htmlFor="actualPortion">Actual Portion Eaten *</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="actualPortion"
                      type="number"
                      step="10"
                      placeholder="e.g., 150"
                      value={formData.actualPortion}
                      onChange={(e) => setFormData({ ...formData, actualPortion: e.target.value })}
                      required
                      className="flex-1"
                    />
                    <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted rounded-lg">
                      {scheduleDetails?.portion_unit || 'grams'}
                    </span>
                  </div>
                </div>
                
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loading ? 'Confirming...' : '✅ Confirm Feeding'}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  This will record the feeding and update your pet&apos;s feeding history.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function FeedingConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <FeedingConfirmContent />
    </Suspense>
  );
}