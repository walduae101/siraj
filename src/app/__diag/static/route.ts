// Guard via env; remove after fix.
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET() {
  try {
    if (process.env.ENABLE_DIAG !== 'true') {
      return new NextResponse('disabled', { status: 404 });
    }
    const root = process.cwd(); // should be /app in container
    const staticDir = path.join(root, '.next', 'static', 'chunks');

    const exists = fs.existsSync(staticDir);
    const sample = exists ? (fs.readdirSync(staticDir).slice(0, 5)) : [];

    return NextResponse.json({ cwd: root, staticDir, exists, sample });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
