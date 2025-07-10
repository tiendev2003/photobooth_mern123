import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// API để invalidate cache sau khi upload file
export async function POST(req: NextRequest) {
  try {
    const { paths, tags } = await req.json();

    // Revalidate specific paths
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        revalidatePath(path);
      }
    }

    // Revalidate specific tags
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        revalidateTag(tag);
      }
    }

    // Revalidate common paths
    revalidatePath('/uploads', 'layout');
    revalidatePath('/', 'layout');

    return NextResponse.json({ 
      success: true, 
      message: 'Cache invalidated successfully' 
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json({ 
      error: 'Failed to invalidate cache' 
    }, { status: 500 });
  }
}
