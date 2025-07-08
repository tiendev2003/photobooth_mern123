import { FrameTemplate } from "./FrameTemplate";

export interface Store {
  id: string;
  name: string;
  slogan?: string;
  logo?: string;
  background?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  accountNumber?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isActive: boolean;
  maxEmployees: number;
  maxAccounts: number;
  createdAt: Date;
  updatedAt: Date;
  managerId: string;
  manager?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  employees?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
  }[];
  frameTemplates?: FrameTemplate[];
  _count?: {
    employees: number;
  };
}
