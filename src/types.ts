/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  totalSpending: number;
  visitCount: number;
  lastVisit?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface ReceiptItem {
  id: string; // serviceId
  name: string;
  price: number;
  quantity: number;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  customerId: string | null; // null represents Walk-In
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  services: ReceiptItem[];
  subtotal: number;
  discount: number; // absolute discount in currency
  tax: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Tap-to-Pay' | 'Gift Card' | 'EasyPaisa' | 'Bank Transfer' | string;
  receptionistId: string;
  receptionistName: string;
  date: string; // ISO String
  staffName?: string;
  cardNo?: string;
  onlineProvider?: 'EasyPaisa' | 'Bank Transfer' | string;
  transactionRef?: string;
  onlineAccountNo?: string;
}

export interface SalonSettings {
  salonName: string;
  phone: string;
  email: string;
  address: string;
  taxRate: number; // e.g., 0.08 for 8%
  currency: string; // e.g., "$"
  openHours: string;
  complaintNumber?: string;
  websiteUrl?: string;
  facebookLink?: string;
  instagramLink?: string;
  whatsappNumber?: string;
  receiptFooter?: string;
  logoUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Manager' | 'Receptionist' | 'Stylist' | 'Admin' | 'Cashier';
}

export interface Expense {
  id: string;
  category: 'Staff Salary' | 'Electricity Bill' | 'Food/Tea Expense' | 'Cosmetic Purchases' | 'Shop Maintenance' | 'Other Expenses' | string;
  amount: number;
  notes: string;
  date: string; // YYYY-MM-DD
  createdBy: string;
}
