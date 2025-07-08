import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { getLoginUrl, isAdminDomain } from "./lib/domainConfig";

// Define JWT payload interface
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  [key: string]: string | number | boolean;
}

// Paths that don't require authentication
const publicPaths = [
  "/api/media-session",
  "/api/media-session-temp",
  "/api/auth/login",
  "/api/auth/register",
  "/api/frame-types",
  "/api/frame-templates",
  "/api/coupons/verify",
  "/api/cron/cleanup-check",
  "/api/stores/**",
  "/api/stores",
  "/api/cron/cleanup-check",
  "/",
  "/api/upload/store-images",
  "/api/pricing/default",
  "/api/print",
  "/api/videos",
  "/api/gifs",
  "/api/images",
  "/api/filters",
  "/login",
  "/admin/login", // Add admin login as a public path
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
  "/session", // Add session routes
  "/session-temp", // Add temp session routes
  "/media", // Add media routes
];

// Middleware function
export async function middleware(request: NextRequest) {
  // Check if the path is public
  const path = request.nextUrl.pathname;
  const host = request.headers.get('host') || '';
  const isAdminDomainActive = isAdminDomain(host);
  
  // Handle static files with higher priority
  if (path.startsWith('/uploads/')) {
    console.log(`Static file request bypassing middleware: ${path}`);
    return NextResponse.next();
  }

  // Allow public paths and static assets
  if (
    publicPaths.includes(path) ||
    path.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|webm|mp4|webp)$/) ||
    // Check for routes with patterns like /api/frame-types/123
    publicPaths.some((publicPath) => path.startsWith(publicPath + "/"))
  ) {
    // Special handling for subdomain routing
    if (isAdminDomainActive && !path.startsWith('/admin') && !path.startsWith('/api/')) {
      // Redirect to admin subdomain's admin path if it's not already there
      const url = request.nextUrl.clone();
      url.pathname = `/admin${path === '/' ? '' : path}`;
      return NextResponse.redirect(url);
    }
    
    // If accessing admin login from main domain, let it proceed
    if (path === '/admin/login') {
      return NextResponse.next();
    }
    
    return NextResponse.next();
  }

  // For admin routes, store routes, or protected API routes
  if (path.startsWith("/admin/") || path.startsWith("/store/") || path.startsWith("/api/")) {
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

      // For admin routes, check if we're on the admin subdomain or under /admin path
      if (path.startsWith("/admin/")) {
        // Client-side AuthGuard component will handle authorization
        return NextResponse.next();
      }
      
      // For store routes
      return NextResponse.next();
    } catch (error) {
      console.error("Authentication error:", error);

      // For API routes, return JSON error
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // For admin routes, redirect to admin login
      if (path.startsWith("/admin/")) {
        const url = request.nextUrl.clone();
        url.pathname = getLoginUrl(true); // admin login
        url.searchParams.set("from", request.nextUrl.pathname);
        return NextResponse.redirect(url);
      }
      
      // For store routes, redirect to regular login
      const url = request.nextUrl.clone();
      url.pathname = getLoginUrl(false); // client login
      url.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Allow all other routes
  return NextResponse.next();
}

// Configure which paths the middleware will run on
export const config = {
  matcher: [
    // Include API, admin and store paths
    "/api/:path*", 
    "/admin/:path*",
    "/store/:path*",
    
    // Include root path for subdomain handling
    "/",
    
    // Explicitly exclude static file paths
    "/((?!uploads|public|_next/static|_next/image|favicon.ico).*)"
  ],
};
