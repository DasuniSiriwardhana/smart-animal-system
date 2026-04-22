import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, pet_name, rating, review, type } = body;

    if (!name || !email || !review) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Simple keyword-based sentiment analysis
    const positiveWords = ['love', 'great', 'excellent', 'amazing', 'good', 'helpful', 'recommend', 'best', 'perfect', 'wonderful', 'fantastic', 'awesome', 'happy'];
    const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'bad', 'useless', 'disappointed', 'poor', 'horrible', 'waste', 'frustrating', 'annoying', 'sad'];
    
    const reviewLower = review.toLowerCase();
    const positiveCount = positiveWords.filter(word => reviewLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => reviewLower.includes(word)).length;
    
    const isPositive = positiveCount > negativeCount;
    const total = positiveCount + negativeCount;
    const confidence = total > 0 ? Math.max(positiveCount, negativeCount) / total : 0.5;
    const autoApprove = (isPositive && confidence > 0.6) || (rating && rating >= 4);

    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        name,
        email,
        pet_name: pet_name || null,
        rating: type === 'review' ? rating : null,
        review,
        type: type || 'review',
        status: autoApprove ? 'approved' : 'pending',
        is_approved: autoApprove,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      approved: autoApprove,
      message: autoApprove 
        ? 'Thank you! Your review has been published.'
        : 'Thank you! Your review will be published after moderation.'
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}