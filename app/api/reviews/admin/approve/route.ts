import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { reviewId, action } = await request.json();

    if (!reviewId || !action) {
      return NextResponse.json({ error: 'Missing reviewId or action' }, { status: 400 });
    }
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updateData = action === 'approve'
      ? { status: 'approved', is_approved: true }
      : { status: 'rejected', is_approved: false };

    const { error } = await supabaseAdmin
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    console.error('Admin review error:', err);
    return NextResponse.json({ error: 'Failed to process review' }, { status: 500 });
  }
}