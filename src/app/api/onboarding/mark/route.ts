import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { setItemDone, maybeComplete } from '~/server/onboarding/service';
import { emitOnboardingItemDone, emitOnboardingComplete } from '~/server/crm/hooks';
import { trackOnboardingItemDone, trackOnboardingComplete } from '~/lib/analytics';
import type { ChecklistItem } from '~/server/onboarding/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const item = searchParams.get('item') as ChecklistItem;

    if (!item) {
      return NextResponse.json({ ok: false, error: 'Missing item parameter' }, { status: 400 });
    }

    // Validate item key
    const validItems: ChecklistItem[] = ['create_api_key', 'call_ping', 'upgrade_plan', 'invite_member', 'enable_2fa'];
    if (!validItems.includes(item)) {
      return NextResponse.json({ ok: false, error: 'Invalid item' }, { status: 400 });
    }

    // Mark item as done
    await setItemDone(user.uid, item);

    // Emit CRM event
    await emitOnboardingItemDone(user.uid, item);

    // Track analytics event
    trackOnboardingItemDone(user.uid, item);

    // Check if all items are complete
    const allComplete = await maybeComplete(user.uid);

    if (allComplete) {
      // Emit completion events
      await emitOnboardingComplete(user.uid);
      trackOnboardingComplete(user.uid);
    }

    return NextResponse.json({ 
      ok: true, 
      allComplete,
      item,
      message: allComplete ? 'Onboarding completed!' : 'Item marked as done'
    });

  } catch (error) {
    console.error('Onboarding mark error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
