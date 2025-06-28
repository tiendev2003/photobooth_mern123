import {
    CreateFrameTemplateInput,
    CreateFrameTypeInput,
    FrameTemplate,
    FrameType,
    UpdateFrameTemplateInput,
    UpdateFrameTypeInput
} from '@/lib/models';
import { PrismaClient } from '@prisma/client';

// Define return types for Prisma operations
interface FrameTemplateWithFrameType extends FrameTemplate {
  frameType?: FrameType;
}

interface FrameTypeWithTemplates extends FrameType {
  templates?: FrameTemplate[];
}

// Enhanced PrismaClient type with all models explicitly defined
export type CustomPrismaClient = PrismaClient & {
  frameTemplate: {
    findMany: (args: {
      where?: {
        frameTypeId?: string;
        id?: string;
      };
      include?: {
        frameType?: boolean;
      };
      orderBy?: {
        createdAt?: 'asc' | 'desc';
      };
    }) => Promise<FrameTemplateWithFrameType[]>;
    findUnique: (args: {
      where: {
        id: string;
      };
      include?: {
        frameType?: boolean;
      };
    }) => Promise<FrameTemplateWithFrameType | null>;
    create: (args: {
      data: CreateFrameTemplateInput;
      include?: {
        frameType?: boolean;
      };
    }) => Promise<FrameTemplateWithFrameType>;
    update: (args: {
      where: {
        id: string;
      };
      data: UpdateFrameTemplateInput;
      include?: {
        frameType?: boolean;
      };
    }) => Promise<FrameTemplateWithFrameType>;
    delete: (args: {
      where: {
        id: string;
      };
    }) => Promise<FrameTemplate>;
  };
  frameType: {
    findMany: (args: {
      include?: {
        templates?: boolean;
      };
      orderBy?: {
        createdAt?: 'asc' | 'desc';
      };
    }) => Promise<FrameTypeWithTemplates[]>;
    findUnique: (args: {
      where: {
        id: string;
      };
      include?: {
        templates?: boolean;
      };
    }) => Promise<FrameTypeWithTemplates | null>;
    create: (args: {
      data: CreateFrameTypeInput & { totalImages: number };
      include?: {
        templates?: boolean;
      };
    }) => Promise<FrameTypeWithTemplates>;
    update: (args: {
      where: {
        id: string;
      };
      data: UpdateFrameTypeInput & { totalImages?: number };
      include?: {
        templates?: boolean;
      };
    }) => Promise<FrameTypeWithTemplates>;
    delete: (args: {
      where: {
        id: string;
      };
    }) => Promise<FrameType>;
  };
};
