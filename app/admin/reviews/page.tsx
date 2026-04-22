"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth/auth-provider';
import { CheckCircle, XCircle, Loader2, Eye, EyeOff, Star, MessageCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Review = {
  id: string;
  name: string;
  email: string;
  pet_name: string;
  rating: number;
  review: string;
  status: string;
  type: string;
  created_at: string;
};

export default function AdminReviewsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // DECLARE fetchReviews FIRST (before checkAdminAccess)
  const fetchReviews = useCallback(async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setReviews(data);
    setLoading(false);
  }, []);

  // THEN declare checkAdminAccess (which uses fetchReviews)
  const checkAdminAccess = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    setIsAdmin(true);
    await fetchReviews();
  }, [user, router, fetchReviews]);

 
useEffect(() => {
  let isMounted = true;
  
  const init = async () => {
    if (isMounted) {
      await checkAdminAccess();
    }
  };
  
  init();
  
  return () => {
    isMounted = false;
  };
}, [checkAdminAccess]);

const approveReview = async (reviewId: string) => {
  setActionLoading(reviewId);
  try {
    const response = await fetch('/api/reviews/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, action: 'approve' })
    });
    if (response.ok) await fetchReviews();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setActionLoading(null);
  }
};

const rejectReview = async (reviewId: string) => {
  setActionLoading(reviewId);
  try {
    const response = await fetch('/api/reviews/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, action: 'reject' })
    });
    if (response.ok) await fetchReviews();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setActionLoading(null);
  }
};

const deleteReview = async (reviewId: string) => {
  if (!confirm('Are you sure you want to delete this review?')) return;
  setActionLoading(reviewId);
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    
    if (!error) {
      await fetchReviews();
    }
  } catch (error) {
    console.error('Error deleting review:', error);
  } finally {
    setActionLoading(null);
  }
};

  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const approvedReviews = reviews.filter(r => r.status === 'approved');
  const inquiries = reviews.filter(r => r.type === 'inquiry');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Review & Inquiry Moderation</h1>
        <p className="text-muted-foreground">Approve or reject user reviews and respond to inquiries</p>
      </div>
      
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedReviews.length})
          </TabsTrigger>
          <TabsTrigger value="inquiries">
            Inquiries ({inquiries.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Reviews Tab */}
        <TabsContent value="pending">
          {pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <EyeOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending reviews</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <Card key={review.id} className="border-yellow-200 bg-yellow-50/30">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                            {review.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold">{review.name}</p>
                            <p className="text-xs text-muted-foreground">{review.email}</p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-700">
                            {review.type === 'inquiry' ? 'Inquiry' : 'Review'}
                          </Badge>
                        </div>
                        
                        {review.type === 'review' && review.rating && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map((star) => (
                                <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">{`(${review.rating}/5)`}</span>
                          </div>
                        )}
                        
                        {review.pet_name && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Pet:</span> {review.pet_name}
                          </p>
                        )}
                        
                        <p className="text-gray-700 mb-2">{`"${review.review}"`}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(review.created_at).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveReview(review.id)}
                          disabled={actionLoading === review.id}
                        >
                          {actionLoading === review.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectReview(review.id)}
                          disabled={actionLoading === review.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Approved Reviews Tab */}
        <TabsContent value="approved">
          {approvedReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No approved reviews yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                            {review.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold">{review.name}</p>
                            <p className="text-xs text-muted-foreground">{review.email}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Published</Badge>
                        </div>
                        
                        {review.type === 'review' && review.rating && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map((star) => (
                                <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">{`(${review.rating}/5)`}</span>
                          </div>
                        )}
                        
                        {review.pet_name && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Pet:</span> {review.pet_name}
                          </p>
                        )}
                        
                        <p className="text-gray-700 mb-2">{`"${review.review}"`}</p>
                        <p className="text-xs text-muted-foreground">
                          Published: {new Date(review.created_at).toLocaleString()}
                        </p>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteReview(review.id)}
                        disabled={actionLoading === review.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inquiries Tab */}
        <TabsContent value="inquiries">
          {inquiries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No inquiries yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <Card key={inquiry.id} className="border-blue-200 bg-blue-50/30">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                            {inquiry.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold">{inquiry.name}</p>
                            <p className="text-xs text-muted-foreground">{inquiry.email}</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">Inquiry</Badge>
                        </div>
                        
                        {inquiry.pet_name && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Pet:</span> {inquiry.pet_name}
                          </p>
                        )}
                        
                        <p className="text-gray-700 mb-2">{`"${inquiry.review}"`}</p>
                        <p className="text-xs text-muted-foreground">
                          Sent: {new Date(inquiry.created_at).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `mailto:${inquiry.email}?subject=Response to your inquiry`}
                        >
                          Reply via Email
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(inquiry.email);
                            alert('Email copied to clipboard');
                          }}
                        >
                          Copy Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}