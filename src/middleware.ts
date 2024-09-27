// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUser } from "./lib/getUser";
import { verifyRequestOrigin } from "lucia";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that can be accessed without authentication
  const publicPaths = ["/login", "/client"];

  // If the path is public, allow access
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if the session cookie exists
  const sessionCookie = request.cookies.get("auth_session");

  if (!sessionCookie) {
    // Redirect to login if no session cookie is present
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login
     * - client
     * - public files (_next/static, _next/image, favicon.ico, assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|client).*)",
  ],
};
