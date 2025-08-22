import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Clear any auth cookies
    const response = NextResponse.json({ success: true });
    
    // Clear authentication cookies
    response.cookies.delete('firebase-auth-session');
    response.cookies.delete('auth-token');
    
    // Set cache headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Sign out failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests by redirecting to sign-in
  return NextResponse.redirect(new URL('/auth/signin', request.url));
}
