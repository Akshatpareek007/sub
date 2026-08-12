export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface FollowUpNote {
  id: string;
  customerId: string;
  note: string;
  createdByUserId: string;
  createdByUser?: { id: string; name: string; role: UserRole };
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  address: string;
  status: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  followUpNotes?: FollowUpNote[];
  challans?: Array<{
    id: string;
    challanNumber: string;
    status: string;
    totalQuantity: number;
    totalAmount: number;
    createdAt: string;
  }>;
  _count?: {
    followUpNotes: number;
    challans: number;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  createdAt: string;
  updatedAt: string;
  stockLogs?: StockLog[];
  _count?: {
    stockLogs: number;
  };
}

export interface StockLog {
  id: string;
  productId: string;
  product?: { id: string; name: string; sku: string };
  quantityChanged: number;
  type: 'IN' | 'OUT';
  reason: string;
  createdByUserId: string;
  createdByUser?: { id: string; name: string; role: UserRole };
  createdAt: string;
}

export interface ChallanItem {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  productSnapshot?: any;
  product?: { id: string; name: string; sku: string; currentStock: number };
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: { id: string; name: string; businessName: string; mobile: string; email: string };
  customerSnapshot: any;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  totalQuantity: number;
  totalAmount: number;
  createdByUserId: string;
  createdByUser?: { id: string; name: string; role: UserRole; email: string };
  createdAt: string;
  updatedAt: string;
  items: ChallanItem[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
