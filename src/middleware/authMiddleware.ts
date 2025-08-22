import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected routes
  const protectedRoutes = [
    "/rec/proponent/dashboard",
    "/rec/proponent/application",
    "/rec/proponent/profile",
    "/rec/proponent/settings",
  ];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // In a real application, you would check the auth state here
    // For now, we'll redirect to signin if no auth cookie is found
    const authCookie = request.cookies.get("auth-token");
    
    if (!authCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/signin";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/rec/proponent/dashboard/:path*",
    "/rec/proponent/application/:path*",
    "/rec/proponent/profile/:path*",
    "/rec/proponent/settings/:path*",
  ],
};
