// Import FrameType type để tránh circular dependency
import { prisma } from '@/lib/prisma';
import type { FrameType } from './FrameType';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface FrameTemplate {
  id: string;
  name: string;
  filename: string;
  background: string;
  overlay: string;
  frameTypeId: string;
  frameType?: FrameType;
  userId?: string | null;
  user?: User | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFrameTemplateInput {
  name: string;
  filename: string;
  background: string;
  overlay: string;
  frameTypeId: string;
  userId?: string | null;
  isActive?: boolean;
}

export interface UpdateFrameTemplateInput {
  name?: string;
  filename?: string;
  background?: string;
  overlay?: string;
  frameTypeId?: string;
  userId?: string | null;
  isActive?: boolean;
}

// Add pagination function for FrameTemplate
export async function getAllFrameTemplates(options?: { 
  page?: number; 
  limit?: number; 
  search?: string;
  frameTypeId?: string;
}) {
  // Default values
  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const search = options?.search || '';
  const frameTypeId = options?.frameTypeId || '';
  
  // Fetch all frame templates with user relation
  const allFrameTemplates = await prisma.frameTemplate.findMany({
    include: {
      frameType: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  // Apply filters
  const filteredTemplates = allFrameTemplates.filter(template => {
    // Filter by search term if provided
    const searchMatch = !search || 
      template.name.toLowerCase().includes(search.toLowerCase());
    
    // Filter by frameTypeId if provided
    const frameTypeMatch = !frameTypeId || template.frameTypeId === frameTypeId;
    
    return searchMatch && frameTypeMatch;
  });
  
  // Get total count for pagination
  const totalTemplates = filteredTemplates.length;
  
  // Manual pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Get paginated templates
  const templates = filteredTemplates.slice(startIndex, endIndex);
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(totalTemplates / limit);
  
  return {
    templates,
    pagination: {
      total: totalTemplates,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}
