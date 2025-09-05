import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for a protected route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Check for Firebase session cookie
    const firebaseSession = request.cookies.get('firebase-session');
    
    if (!firebaseSession) {
      // Redirect to login if no session cookie
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Check if the request is for the login page and user is already authenticated
  if (request.nextUrl.pathname === '/login') {
    const firebaseSession = request.cookies.get('firebase-session');
    
    if (firebaseSession) {
      // Redirect to dashboard if already authenticated
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login'
  ],
};
