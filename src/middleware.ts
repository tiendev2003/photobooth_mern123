import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

// Define JWT payload interface
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  [key: string]: string | number | boolean;
}

// Paths that don't require authentication
const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/'
];

// Middleware function
export async function middleware(request: NextRequest) {
  // Check if the path is public
  const path = request.nextUrl.pathname;
  if (!path.startsWith('/api/') || publicPaths.includes(path) || path.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/)) {
    return NextResponse.next();
  }

  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Token:', token);

    // Verify the token
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
    const { payload } = await jwtVerify(token, secretKey);
    const decodedToken = payload as JWTPayload;
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin-only routes
    if ((path.startsWith('/api/users') && request.method !== 'GET') || path.startsWith('/api/admin')) {
      if (decodedToken.role !== 'ADMIN' && decodedToken.role !== 'KETOAN') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    // Add the user to the request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decodedToken.id);
    requestHeaders.set('x-user-role', decodedToken.role);

    // Continue with the request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// Configure which paths the middleware will run on
export const config = {
  matcher: [
    '/api/:path*'
  ],
}
