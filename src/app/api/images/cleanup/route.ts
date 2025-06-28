import { deleteOldMediaFiles } from '@/app/api/images/actions/file-utils';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/images/cleanup - Trigger manual image cleanup
export async function POST(req: NextRequest) {
  try {
    // Kiểm tra xem người dùng hiện tại có quyền admin không
    const userRole = req.headers.get('x-user-role');
    console.log('User role:', userRole);
    if (userRole !== 'ADMIN' && userRole !== 'KETOAN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Chạy công việc xóa ảnh thủ công
    const result = await deleteOldMediaFiles(3);
    
    return NextResponse.json({ 
      message: 'Image cleanup completed successfully', 
      deletedCount: result.deletedCount 
    }, { status: 200 });
  } catch (error) {
    console.error('Error running manual image cleanup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
