import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionExpiryDate, signToken, verifyToken } from '@/lib/auth/jwt';

const protectedRoutes = [
  '/dashboard',
  '/daily-plan',
  '/input-output',
  '/flashcards',
  '/activity',
  '/practice',
  '/collocations',
  '/weekly-review',
  '/settings',
];

function setSessionCookie(response: NextResponse, value: string, expires: Date) {
  response.cookies.set({
    name: 'session',
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const res = NextResponse.next();

  // Rolling session refresh on GET requests
  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresAt = getSessionExpiryDate();

      const refreshedToken = await signToken({
        ...parsed,
        expires: expiresAt.toISOString(),
      });
      setSessionCookie(res, refreshedToken, expiresAt);
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-192.png|icon-512.png|apple-touch-icon.png).*)',
  ],
};
