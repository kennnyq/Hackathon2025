import { NextResponse } from 'next/server';
import { getCsvCars } from '@/data/csvCars.server';
import { getOrCreateUserProfile, updateUserProfileWithFeedback } from '@/server/recommendationEngine';

type FeedbackBody = {
  sessionId?: string;
  listingId?: number | string;
  feedback?: 'like' | 'reject';
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FeedbackBody;
    const sessionId = (body.sessionId || '').trim();
    const listingId = typeof body.listingId === 'string' ? Number.parseInt(body.listingId, 10) : body.listingId;
    const feedback = body.feedback;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    if (!listingId || !Number.isFinite(listingId)) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
    }
    if (feedback !== 'like' && feedback !== 'reject') {
      return NextResponse.json({ error: 'feedback must be "like" or "reject"' }, { status: 400 });
    }

    const listing = getCsvCars().find(car => car.Id === Number(listingId));
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const profile = getOrCreateUserProfile(sessionId);
    updateUserProfileWithFeedback(profile, listing, feedback);

    return NextResponse.json({
      success: true,
      sessionId,
      totals: { likes: profile.totalLikes, rejects: profile.totalRejects },
    });
  } catch (error) {
    console.error('feedback POST failed', error);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}
