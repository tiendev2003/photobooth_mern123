import { cleanExpiredMedia } from '@/lib/cron/mediaCleaner';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    await cleanExpiredMedia();
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    const secretKey = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback-secret-key'
    );
    
    // Decode the token to get user ID
    const { payload } = await jwtVerify(token, secretKey);
    const userId = payload.id as string;
    
    // Check if token matches the one in the database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user || user.currentToken !== token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Token is valid
    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
