export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const PROJECT_ID = 'walduae-project-20250809071906';

function admin() {
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
      projectId: PROJECT_ID,
    });
  }
  return { auth: getAuth() };
}

export async function GET() {
  try {
    const { auth } = admin();
    console.log('✅ Firebase Admin initialized successfully');
    console.log('✅ Project ID:', PROJECT_ID);
    console.log('✅ Auth instance created');
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Firebase Admin working',
      projectId: PROJECT_ID,
      appsCount: getApps().length
    });
  } catch (e: any) {
    console.error('❌ Firebase Admin test failed:', {
      message: e?.message,
      code: e?.code,
      stack: e?.stack?.split('\n').slice(0,3).join('\n')
    });
    
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? 'unknown-error',
      code: e?.code ?? null
    }, { status: 500 });
  }
}
