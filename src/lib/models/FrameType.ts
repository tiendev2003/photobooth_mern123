import { prisma } from '@/lib/prisma';

// Import FrameTemplate type để tránh circular dependency
import { FrameTemplate } from "@/lib/models/FrameTemplate";

 
export interface FrameType {
  id: string;
  name: string;
  description?: string;
  columns: number;
  rows: number;
  totalImages: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  templates?: FrameTemplate[];
}

export interface CreateFrameTypeInput {
  name: string;
  description?: string;
  columns: number;
  rows: number;
  totalImages: number;
  isActive?: boolean;
}

export interface UpdateFrameTypeInput {
  name?: string;
  description?: string;
  columns?: number;
  rows?: number;
  totalImages?: number;
  isActive?: boolean;
}

// Add pagination function for FrameType
export async function getAllFrameTypes(options?: { 
  page?: number; 
  limit?: number; 
  search?: string;
}) {
  // Default values
  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const search = options?.search || '';
  
  // Fetch all frame types
  const allFrameTypes = await prisma.frameType.findMany({
    include: {
      templates: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  // Manual filtering for search
  const filteredFrameTypes = search
    ? allFrameTypes.filter(frameType => 
        frameType.name.toLowerCase().includes(search.toLowerCase()) || 
        (frameType.description && 
         frameType.description.toLowerCase().includes(search.toLowerCase()))
      )
    : allFrameTypes;
  
  // Get total count for pagination
  const totalFrameTypes = filteredFrameTypes.length;
  
  // Manual pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Get paginated frame types
  const frameTypes = filteredFrameTypes.slice(startIndex, endIndex);
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(totalFrameTypes / limit);
  
  return {
    frameTypes,
    pagination: {
      total: totalFrameTypes,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}
