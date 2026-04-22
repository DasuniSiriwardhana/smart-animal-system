import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, pet_name, rating, review, type } = body;

    if (!name || !email || !review) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sentiment analysis
    const positiveWords = ['love', 'great', 'excellent', 'amazing', 'good', 'helpful',
      'recommend', 'best', 'perfect', 'wonderful', 'fantastic', 'awesome', 'happy'];
    const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'bad', 'useless',
      'disappointed', 'poor', 'horrible', 'waste', 'frustrating', 'annoying'];

    const reviewLower = review.toLowerCase();
    const positiveCount = positiveWords.filter(w => reviewLower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => reviewLower.includes(w)).length;

    const total = positiveCount + negativeCount;
    const isPositive = positiveCount >= negativeCount;
    const confidence = total > 0 ? Math.max(positiveCount, negativeCount) / total : 0.5;

    // Auto-approve if: positive sentiment with confidence, OR rating >= 4
    const autoApprove = (isPositive && (confidence >= 0.5 || total === 0)) || 
                        (type === 'review' && rating >= 4);

    console.log(`Review sentiment: +${positiveCount}/-${negativeCount}, autoApprove: ${autoApprove}`);

    const { error: insertError } = await supabaseAdmin
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
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      approved: autoApprove,
      message: autoApprove
        ? ' Thank you! Your review has been published.'
        : ' Thank you! Your review will be visible after moderation.',
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}