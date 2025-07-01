import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
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
    
    // Clear the token from the database
    await prisma.user.update({
      where: { id: userId },
      data: { currentToken: null }
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
