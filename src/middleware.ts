import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

// Define JWT payload interface
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  [key: string]: string | number | boolean;
}

// Paths that don't require authentication
const publicPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/frame-types",
  "/api/frame-templates",
  "/",
  "/api/print",
  "/login",
  "/step/step1",
  "/step/step2",
  "/step/step3",
  "/step/step4",
  "/step/step5",
  "/step/step6",
  "/step/step7",
  "/step/step8",
  "/step/step9",
  "/step/step10",
];

// Middleware function
export async function middleware(request: NextRequest) {
  // Check if the path is public
  const path = request.nextUrl.pathname;

  // Allow public paths and static assets
  if (
    publicPaths.includes(path) ||
    path.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/) ||
    // Check for routes with patterns like /api/frame-types/123
    publicPaths.some((publicPath) => path.startsWith(publicPath + "/"))
  ) {
    return NextResponse.next();
  }

  // For admin routes or protected API routes
  if (path.startsWith("/admin/") || path.startsWith("/api/")) {
    try {
      // For API routes, get token from Authorization header
      if (path.startsWith("/api/")) {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify the token
        const secretKey = new TextEncoder().encode(
          process.env.JWT_SECRET || "fallback-secret-key"
        );
        const { payload } = await jwtVerify(token, secretKey);
        const decodedToken = payload as JWTPayload;

        // Admin-only routes
        if (
          (path.startsWith("/api/users") && request.method !== "GET") ||
          path.startsWith("/api/admin")
        ) {
          if (decodedToken.role !== "ADMIN" && decodedToken.role !== "KETOAN") {
            return NextResponse.json(
              { error: "Forbidden: Admin access required" },
              { status: 403 }
            );
          }
        }

        // Add the user to the request headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-id", decodedToken.id);
        requestHeaders.set("x-user-role", decodedToken.role);

        // Continue with the request
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }

      // For admin routes, redirect to login if no token in cookies or local storage
      // Client-side AuthGuard component will handle this, so we can just let it proceed
      return NextResponse.next();
    } catch (error) {
      console.error("Authentication error:", error);

      // For API routes, return JSON error
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // For admin routes, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Allow all other routes
  return NextResponse.next();
}

// Configure which paths the middleware will run on
export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
