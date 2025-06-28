'use server';

import { FileType, findOldImages } from '@/lib/models/Image';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

// Hàm xóa một file từ hệ thống
export async function deleteFileFromSystem(filePath: string) {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
}

// Hàm xóa file và record trong database
export async function deleteMediaFile(id: string) {
  try {
    const image = await prisma.image.findUnique({ where: { id } });
    
    if (!image) {
      return { success: false, message: 'File not found' };
    }
    
    // Xóa file từ hệ thống
    const filePath = image.path;
    await deleteFileFromSystem(filePath);
    
    // Xóa record trong database
    await prisma.image.delete({ where: { id } });
    
    return { success: true };
  } catch (error) {
    console.error(`Error deleting media file ${id}:`, error);
    return { success: false, message: 'Internal server error' };
  }
}

// Hàm xóa các file cũ
export async function deleteOldMediaFiles(days: number = 3, fileTypes?: FileType[]) {
  try {
    // Tìm các file cũ
    const oldFiles = await findOldImages(days, fileTypes);
    console.log(`Found ${oldFiles.length} files older than ${days} days to delete.`);
    
    let deletedCount = 0;
    
    // Xóa từng file
    for (const file of oldFiles) {
      try {
        // Xóa file từ hệ thống
        const success = await deleteFileFromSystem(file.path);
        if (!success) {
          console.error(`Failed to delete file from system: ${file.path}`);
        }
        
        // Xóa record trong database
        await prisma.image.delete({ where: { id: file.id } });
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting file ${file.id}:`, error);
      }
    }
    
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error in deleteOldMediaFiles:', error);
    return { success: false, deletedCount: 0, error: String(error) };
  }
}
