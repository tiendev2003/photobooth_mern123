import { prisma } from '@/lib/prisma';
import type { FrameType } from './FrameType';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Store {
  id: string;
  name: string;
  manager: User;
}

export interface FrameTemplate {
  id: string;
  name: string;
  filename: string;
  background: string;
  overlay: string;
  frameTypeId: string;
  frameType?: FrameType;
  storeId?: string | null;
  store?: Store | null;
  isActive: boolean;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFrameTemplateInput {
  name: string;
  filename: string;
  background: string;
  overlay: string;
  frameTypeId: string;
  storeId?: string | null;
  isActive?: boolean;
  isGlobal?: boolean;
}

export interface UpdateFrameTemplateInput {
  name?: string;
  filename?: string;
  background?: string;
  overlay?: string;
  frameTypeId?: string;
  storeId?: string | null;
  isActive?: boolean;
  isGlobal?: boolean;
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
  
  // Fetch all frame templates with frameType and store relations
  const allFrameTemplates = await prisma.frameTemplate.findMany({
    include: {
      frameType: true,
      store: {
        select: {
          id: true,
          name: true,
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
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
