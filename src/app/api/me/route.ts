import { NextResponse } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });
  return NextResponse.json({ ok:true, user });
}
