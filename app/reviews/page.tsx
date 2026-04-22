"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Heart, ThumbsUp, MessageCircle, User, Mail, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Review = {
  id: string;
  name: string;
  pet_name: string;
  rating: number;
  review: string;
  type: string;
  created_at: string;
};

function StarRating({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (rating: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onChange?.(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`h-5 w-5 ${
              star <= rating ? 'fill-accent text-accent' : 'text-muted-foreground'
            } ${interactive ? 'hover:scale-110 transition-transform' : ''}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [submissionType, setSubmissionType] = useState<'review' | 'inquiry'>('review');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    petName: '',
    rating: 5,
    review: '',
  });

  useEffect(() => {
    fetchApprovedReviews();
  }, []);

  const fetchApprovedReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'review')
      .order('created_at', { ascending: false });
    
    if (data) setReviews(data);
    setLoading(false);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setError(null);
  setSuccess(null);

  try {
    if (!formData.name || !formData.email || !formData.review) {
      setError('Please fill in all required fields.');
      setSubmitting(false);
      return;
    }

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        pet_name: formData.petName || null,
        rating: submissionType === 'review' ? formData.rating : null,
        review: formData.review,
        type: submissionType,
      }),
    });

    if (res.status === 404) {
      setError('API route not found. Check that /api/reviews/route.ts exists and is deployed.');
      return;
    }

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || 'Submission failed');
    }

    //  Show message returned by API
    setSuccess(result.message);
    
    //  If auto-approved, add to list immediately without waiting for refetch
    if (result.approved && submissionType === 'review') {
      const newReview: Review = {
        id: result.id ?? crypto.randomUUID(),
        name: formData.name,
        pet_name: formData.petName || '',
        rating: formData.rating,
        review: formData.review,
        type: 'review',
        created_at: new Date().toISOString(),
      };
      setReviews(prev => [newReview, ...prev]);
    }

    setFormData({ name: '', email: '', petName: '', rating: 5, review: '' });

    setTimeout(() => {
      setFormOpen(false);
      setSuccess(null);
    }, 3000);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Something went wrong.';
    setError(msg);
  } finally {
    setSubmitting(false);
  }
};

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <Heart className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Pet Parent Stories</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            What{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pet Parents
            </span>{' '}
            Say
          </h1>
          <p className="text-lg text-muted-foreground">
            Join thousands of happy pet parents who trust Smart Animal System
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="h-5 w-5 fill-accent text-accent" />
                <Star className="h-5 w-5 fill-accent text-accent" />
                <Star className="h-5 w-5 fill-accent text-accent" />
                <Star className="h-5 w-5 fill-accent text-accent" />
                <Star className="h-5 w-5 fill-accent text-accent" />
              </div>
              <p className="text-2xl font-bold">4.9</p>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <ThumbsUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">1,000+</p>
              <p className="text-sm text-muted-foreground">Happy Pet Parents</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">500+</p>
              <p className="text-sm text-muted-foreground">Verified Reviews</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
            <p className="text-muted-foreground">Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {displayedReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{review.name}</p>
                        <p className="text-xs text-muted-foreground">{review.pet_name || 'Pet Parent'}</p>
                      </div>
                    </div>
                    
                    <StarRating rating={review.rating} />
                    
                    <p className="text-sm text-muted-foreground mt-3">
                      &quot;{review.review}&quot;
                    </p>
                    
                    <p className="text-xs text-muted-foreground mt-4">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* View More Button */}
        {reviews.length > 3 && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              onClick={() => setShowAll(!showAll)}
              className="gap-2"
            >
              {showAll ? 'Show Less' : `View All (${reviews.length})`}
            </Button>
          </div>
        )}

        {/* Write Review/Inquiry Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <div className="text-center mt-16">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 text-center max-w-3xl mx-auto cursor-pointer hover:shadow-lg transition-all">
                <h3 className="text-xl font-semibold mb-2">Share Your Experience</h3>
                <p className="text-muted-foreground mb-4">
                  Help other pet parents make informed decisions
                </p>
                <Button className="bg-gradient-to-r from-primary to-accent text-white">
                  Write a Review
                </Button>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Your Experience</DialogTitle>
            </DialogHeader>
            
            {/* Type Selection */}
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setSubmissionType('review')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  submissionType === 'review'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📝 Write a Review
              </button>
              <button
                type="button"
                onClick={() => setSubmissionType('inquiry')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  submissionType === 'inquiry'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ❓ Send an Inquiry
              </button>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-600">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="petName">Pet Name (Optional)</Label>
                <Input
                  id="petName"
                  value={formData.petName}
                  onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                />
              </div>
              
              {submissionType === 'review' && (
                <div>
                  <Label>Rating *</Label>
                  <StarRating rating={formData.rating} interactive={true} onChange={(r) => setFormData({ ...formData, rating: r })} />
                </div>
              )}
              
              <div>
                <Label htmlFor="review">
                  {submissionType === 'review' ? 'Your Review *' : 'Your Inquiry *'}
                </Label>
                <Textarea
                  id="review"
                  rows={4}
                  value={formData.review}
                  onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                  required
                  placeholder={
                    submissionType === 'review'
                      ? "Share your experience with our service..."
                      : "Ask us anything about our products or services..."
                  }
                />
              </div>
              
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {submitting 
                  ? "Submitting..." 
                  : submissionType === 'review' 
                    ? "Submit Review" 
                    : "Send Inquiry"}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                All submissions are reviewed by our team before being published.
                We&apos;ll respond to inquiries within 24-48 hours.
              </p>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}