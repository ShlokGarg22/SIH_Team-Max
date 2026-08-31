import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side Next.js Middleware for protecting the /admin portal with Basic Authentication.
 * Credentials are stored in server-side environment variables (ADMIN_USERNAME & ADMIN_PASSWORD).
 */
export function middleware(request: NextRequest) {
  // Target only /admin and nested sub-routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const authHeader = request.headers.get("authorization");

    // Server-side environment variables with sensible defaults
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (authHeader) {
      // Header format: "Basic base64(username:password)"
      const authValue = authHeader.split(" ")[1];
      if (authValue) {
        try {
          const credentials = atob(authValue).split(":");
          const username = credentials[0];
          const password = credentials.slice(1).join(":"); // Handle passwords that might contain colons

          if (username === adminUsername && password === adminPassword) {
            return NextResponse.next();
          }
        } catch {
          // Invalid Base64 format
        }
      }
    }

    // Return 401 Unauthorized with WWW-Authenticate header to trigger standard browser auth prompt
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Portal"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
