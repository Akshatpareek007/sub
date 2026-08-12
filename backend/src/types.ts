import { Request } from 'express';
import { z } from 'zod';

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Zod Validation Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  mobile: z.string().min(8, 'Mobile number is required'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(5, 'Address is required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const followUpNoteSchema = z.object({
  note: z.string().min(1, 'Note content cannot be empty'),
  nextFollowUpDate: z.string().optional().nullable(),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Price must be greater than 0'),
  currentStock: z.number().int().nonnegative('Stock cannot be negative').default(0),
  minStockAlert: z.number().int().nonnegative('Alert limit cannot be negative').default(5),
  location: z.string().min(2, 'Warehouse location is required'),
});

export const stockAdjustmentSchema = z.object({
  quantityChanged: z.number().int().positive('Quantity must be greater than 0'),
  type: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Reason is required'),
});

export const challanItemSchema = z.object({
  productId: z.string().uuid({ message: 'Valid product ID required' }),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const challanSchema = z.object({
  customerId: z.string().uuid({ message: 'Valid customer ID required' }),
  status: z.enum(['DRAFT', 'CONFIRMED']),
  items: z.array(challanItemSchema).min(1, 'At least one item is required'),
});

export const updateChallanStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
});
