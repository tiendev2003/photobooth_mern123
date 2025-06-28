import { prisma } from '../prisma';

export enum FileType {
  IMAGE = 'IMAGE',
  GIF = 'GIF',
  VIDEO = 'VIDEO'
}

export interface ImageData {
  filename: string;
  path: string;
  fileType?: FileType;
  size?: number;
  duration?: number;
}

export async function getAllImages() {
  return prisma.image.findMany();
}

export async function getImageById(id: string) {
  return prisma.image.findUnique({
    where: { id }
  });
}

export async function createImage(data: ImageData) {
  return prisma.image.create({
    data
  });
}

export async function deleteImage(id: string) {
  const image = await getImageById(id);
  
  if (!image) {
    throw new Error('Image not found');
  }

  // Chỉ xóa record trong database, không xử lý file hệ thống
  return prisma.image.delete({
    where: { id }
  });
}

export function getImageUrl(imagePath: string) {
  // Chuyển đổi đường dẫn tương đối thành URL đầy đủ
  // Ví dụ: /uploads/image.jpg -> https://yourwebsite.com/uploads/image.jpg
  // Trong môi trường phát triển, đơn giản trả về đường dẫn tương đối
  return imagePath;
}

/**
 * Tìm kiếm các file media cũ hơn số ngày được chỉ định
 * KHÔNG thực hiện xóa file, chỉ trả về danh sách
 * @param days Số ngày, mặc định là 3
 * @param fileTypes Loại file cần tìm, mặc định là tất cả
 * @returns Danh sách file cần xóa
 */
export async function findOldImages(days: number = 3, fileTypes?: FileType[]) {
  try {
    // Tính toán ngày cắt giảm
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Xây dựng điều kiện tìm kiếm
    const where: {
      createdAt: { lt: Date };
      fileType?: { in: FileType[] };
    } = {
      createdAt: {
        lt: cutoffDate
      }
    };
    
    // Nếu có chỉ định loại file cần xóa
    if (fileTypes && fileTypes.length > 0) {
      where.fileType = {
        in: fileTypes
      };
    }
    
    // Tìm tất cả file media đã tạo trước cutoffDate
    return await prisma.image.findMany({ where });
  } catch (error) {
    console.error('Error in findOldImages:', error);
    return [];
  }
}
