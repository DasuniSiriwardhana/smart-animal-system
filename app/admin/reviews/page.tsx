"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth/auth-provider';
import { CheckCircle, XCircle, Loader2, EyeOff, Star, MessageCircle, ThumbsUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Review = {
  id: string;
  name: string;
  email: string;
  pet_name: string;
  rating: number;
  review: string;
  is_approved: boolean;
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

  const fetchReviews = useCallback(async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setReviews(data);
    setLoading(false);
  }, []);

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
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', reviewId);
      
      if (!error) await fetchReviews();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const rejectReview = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      
      if (!error) await fetchReviews();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  };

// Filter: Pending bad reviews (rating <= 3, not approved, type = 'review')
const pendingReviews = reviews.filter(r => 
  !r.is_approved && 
  r.type === 'review' && 
  r.rating && 
  r.rating <= 3
);

// Filter: Good reviews auto-approved (rating >= 4, approved)
const goodReviews = reviews.filter(r => 
  r.is_approved && 
  r.type === 'review' && 
  r.rating && 
  r.rating >= 4
);

// Filter: Inquiries
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
        <p className="text-muted-foreground">Moderate bad reviews (rating ≤ 3) - good reviews are auto-approved</p>
      </div>
      
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Bad Reviews ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Good Reviews ({goodReviews.length})
          </TabsTrigger>
          <TabsTrigger value="inquiries">
            Inquiries ({inquiries.length})
          </TabsTrigger>
        </TabsList>

        {/* PENDING BAD REVIEWS TAB */}
        <TabsContent value="pending">
          {pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <EyeOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending bad reviews</p>
                <p className="text-sm text-muted-foreground">Good reviews are auto-approved</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <Card key={review.id} className="border-red-200 bg-red-50/30">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                            {review.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold">{review.name}</p>
                            <p className="text-xs text-muted-foreground">{review.email}</p>
                          </div>
                          <Badge className="bg-red-100 text-red-700">Bad Review</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map((star) => (
                              <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{`(${review.rating}/5) - Needs attention`}</span>
                        </div>
                        
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
                            <ThumbsUp className="h-4 w-4 mr-1" />
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

        {/* GOOD REVIEWS TAB (Auto-approved) */}
        <TabsContent value="approved">
          {goodReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">No good reviews yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {goodReviews.map((review) => (
                <Card key={review.id} className="border-green-200 bg-green-50/30">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold">
                            {review.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold">{review.name}</p>
                            <p className="text-xs text-muted-foreground">{review.email}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Auto-Approved</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map((star) => (
                              <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-green-500 text-green-500' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{`(${review.rating}/5)`}</span>
                        </div>
                        
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* INQUIRIES TAB */}
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