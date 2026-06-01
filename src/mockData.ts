/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Service, Receipt, SalonSettings, User, Expense } from './types';

// Standard Initial Settings
const KEY_SETTINGS = 'salon_pos_settings';
export const DEFAULT_SETTINGS: SalonSettings = {
  salonName: 'Bel Amours',
  phone: '0333 0717123',
  email: 'belamourspasaloon@gmail.com',
  address: 'Commercial Area Phase 5, DHA, Lahore, Pakistan',
  taxRate: 0.16, // 16% standard PK tax
  currency: 'PKR',
  openHours: 'Mon - Sun: 11:00 AM - 9:00 PM',
};

// Standard Initial Services
const KEY_SERVICES = 'salon_pos_services';
const INITIAL_SERVICES: Service[] = [
  // SPA TREATMENT / MASSAGE
  { id: 'srv-1', name: 'HEAD MASSAGE', category: 'Spa & Massage', price: 1000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-2', name: 'HAND MASSAGE', category: 'Spa & Massage', price: 1500.00, durationMinutes: 30, isActive: true },
  { id: 'srv-3', name: 'FOOT MASSAGE', category: 'Spa & Massage', price: 1500.00, durationMinutes: 30, isActive: true },
  { id: 'srv-4', name: 'SHOULDER AND NECK MASSAGE', category: 'Spa & Massage', price: 2000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-5', name: 'HEAD SHOULDER AND BACK MASSAGE', category: 'Spa & Massage', price: 5000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-6', name: 'FULL BODY MASSAGE (ESSENTIAL OILS)', category: 'Spa & Massage', price: 8000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-7', name: 'FULL BODY SCRUB', category: 'Spa & Massage', price: 8000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-8', name: 'HOT MASSAGE (OIL)', category: 'Spa & Massage', price: 5000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-9', name: 'AROMATHERAPY MASSAGE', category: 'Spa & Massage', price: 6000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-10', name: 'SWEDISH MASSAGE', category: 'Spa & Massage', price: 6000.00, durationMinutes: 40, isActive: true },
  { id: 'srv-11', name: 'SPORTS MASSAGE', category: 'Spa & Massage', price: 6000.00, durationMinutes: 40, isActive: true },

  // MAKEUP
  { id: 'srv-12', name: 'BRIDAL / BARAT / WALIMA (SIGNATURE)', category: 'Makeup', price: 50000.00, durationMinutes: 120, isActive: true },
  { id: 'srv-13', name: 'BRIDAL / BARAT / WALIMA (SEN. MUA)', category: 'Makeup', price: 35000.00, durationMinutes: 120, isActive: true },
  { id: 'srv-14', name: 'ENGAGEMENT / MEHNDI / NIKKAH (SIGNATURE)', category: 'Makeup', price: 35000.00, durationMinutes: 90, isActive: true },
  { id: 'srv-15', name: 'ENGAGEMENT / MEHNDI / NIKKAH (SEN. MUA)', category: 'Makeup', price: 25000.00, durationMinutes: 90, isActive: true },
  { id: 'srv-16', name: 'PARTY MAKEUP WITH HAIRSTYLING (SIGNATURE)', category: 'Makeup', price: 10000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-17', name: 'PARTY MAKEUP WITH HAIRSTYLING (SEN. MUA)', category: 'Makeup', price: 6000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-18', name: 'EYE MAKEUP', category: 'Makeup', price: 2000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-19', name: '3D EYELASHES', category: 'Makeup', price: 1000.00, durationMinutes: 15, isActive: true },
  { id: 'srv-20', name: 'DUPATTA & JEWELRY SETTING', category: 'Makeup', price: 1000.00, durationMinutes: 20, isActive: true },
  { id: 'srv-21', name: 'HAIR ACCESSORY SETTING', category: 'Makeup', price: 500.00, durationMinutes: 15, isActive: true },
  { id: 'srv-22', name: 'BASE FOUNDATION', category: 'Makeup', price: 1500.00, durationMinutes: 20, isActive: true },

  // BRIDAL PACKAGES
  { id: 'srv-23', name: 'BRIDAL PACKAGE #1 (SIGNATURE)', category: 'Bridal Packages', price: 80000.00, durationMinutes: 240, isActive: true },
  { id: 'srv-24', name: 'BRIDAL PACKAGE #1 (MUA)', category: 'Bridal Packages', price: 65000.00, durationMinutes: 240, isActive: true },
  { id: 'srv-25', name: 'BRIDAL PACKAGE #2 (SIGNATURE)', category: 'Bridal Packages', price: 100000.00, durationMinutes: 300, isActive: true },
  { id: 'srv-26', name: 'BRIDAL PACKAGE #2 (MUA)', category: 'Bridal Packages', price: 85000.00, durationMinutes: 300, isActive: true },

  // FACIALS
  { id: 'srv-27', name: 'CLEANSING FACIAL', category: 'Facials', price: 3000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-28', name: 'BRIGHTENING FACIAL', category: 'Facials', price: 3500.00, durationMinutes: 30, isActive: true },
  { id: 'srv-29', name: 'PROTIEN OXYGEN FACIAL', category: 'Facials', price: 4000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-30', name: 'OXYGEN (SPOT TREATMENT)', category: 'Facials', price: 6000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-31', name: 'HYDRA DERMIE PEELING', category: 'Facials', price: 10000.00, durationMinutes: 40, isActive: true },
  { id: 'srv-32', name: 'HYDRA FACIAL', category: 'Facials', price: 10000.00, durationMinutes: 40, isActive: true },

  // WAXING
  { id: 'srv-33', name: 'CHEST WAX', category: 'Waxing', price: 2000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-34', name: 'BACK WAX', category: 'Waxing', price: 2000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-35', name: 'FULL LEG WAX', category: 'Waxing', price: 3000.00, durationMinutes: 45, isActive: true },
  { id: 'srv-36', name: 'FULL ARMS WAX', category: 'Waxing', price: 1500.00, durationMinutes: 30, isActive: true },
  { id: 'srv-37', name: 'UNDER ARMS WAX', category: 'Waxing', price: 800.00, durationMinutes: 15, isActive: true },
  { id: 'srv-38', name: 'UPPER BODY WAX', category: 'Waxing', price: 4000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-39', name: 'FACE WAX', category: 'Waxing', price: 1000.00, durationMinutes: 20, isActive: true },
  { id: 'srv-40', name: 'EYEBROW WAX', category: 'Waxing', price: 1000.00, durationMinutes: 15, isActive: true },
  { id: 'srv-41', name: 'UPPERLIPS WAX', category: 'Waxing', price: 300.00, durationMinutes: 10, isActive: true },
  { id: 'srv-42', name: 'FULL FACE WITH MASK AND SERUM', category: 'Waxing', price: 2000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-43', name: 'NOSE WAX', category: 'Waxing', price: 500.00, durationMinutes: 10, isActive: true },
  { id: 'srv-44', name: 'BIKINI WAX', category: 'Waxing', price: 1500.00, durationMinutes: 30, isActive: true },
  { id: 'srv-45', name: 'STOMACH WAX', category: 'Waxing', price: 1000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-46', name: 'FULL BODY WAX', category: 'Waxing', price: 8000.00, durationMinutes: 90, isActive: true },

  // HAIR TREATMENTS
  { id: 'srv-47', name: 'HAIR FALL TREATMENT', category: 'Hair Treatments', price: 6000.00, durationMinutes: 45, isActive: true },
  { id: 'srv-48', name: 'PROTIEN OXYGENATING TREATMENT', category: 'Hair Treatments', price: 8000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-49', name: 'SEMI-PERMANENT KERATINE BOTOX (ABOVE SHOULDER)', category: 'Hair Treatments', price: 25000.00, durationMinutes: 120, isActive: true },
  { id: 'srv-50', name: 'SEMI-PERMANENT KERATINE BOTOX (BELOW SHOULDER)', category: 'Hair Treatments', price: 35000.00, durationMinutes: 150, isActive: true },
  { id: 'srv-51', name: 'SEMI-PERMANENT KERATINE BOTOX (WAIST LENGTH)', category: 'Hair Treatments', price: 45000.00, durationMinutes: 180, isActive: true },
  { id: 'srv-52', name: 'X-TENSO (ABOVE SHOULDER)', category: 'Hair Treatments', price: 20000.00, durationMinutes: 120, isActive: true },
  { id: 'srv-53', name: 'X-TENSO (BELOW SHOULDER)', category: 'Hair Treatments', price: 25000.00, durationMinutes: 150, isActive: true },
  { id: 'srv-54', name: 'X-TENSO (WAIST LENGTH)', category: 'Hair Treatments', price: 35000.00, durationMinutes: 180, isActive: true },
  { id: 'srv-55', name: 'GLOSS/TONER (ABOVE SHOULDER)', category: 'Hair Treatments', price: 6000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-56', name: 'GLOSS/TONER (BELOW SHOULDER)', category: 'Hair Treatments', price: 8000.00, durationMinutes: 90, isActive: true },
  { id: 'srv-57', name: 'GLOSS/TONER (WAIST LENGTH)', category: 'Hair Treatments', price: 10000.00, durationMinutes: 120, isActive: true },
  { id: 'srv-58', name: 'KERATINE (ABOVE SHOULDER)', category: 'Hair Treatments', price: 25000.00, durationMinutes: 120, isActive: true },
  { id: 'srv-59', name: 'KERATINE (BELOW SHOULDER)', category: 'Hair Treatments', price: 35000.00, durationMinutes: 150, isActive: true },
  { id: 'srv-60', name: 'KERATINE (WAIST LENGTH)', category: 'Hair Treatments', price: 45000.00, durationMinutes: 180, isActive: true },

  // HAIR CUT
  { id: 'srv-61', name: 'CUT & BLOWDRY', category: 'Hair Cut & Styling', price: 3000.00, durationMinutes: 45, isActive: true },
  { id: 'srv-62', name: 'KIDS CUT', category: 'Hair Cut & Styling', price: 1500.00, durationMinutes: 30, isActive: true },
  { id: 'srv-63', name: 'FRINGES & BANGS', category: 'Hair Cut & Styling', price: 1000.00, durationMinutes: 20, isActive: true },
  { id: 'srv-64', name: 'WASH AND BLOW DRY', category: 'Hair Cut & Styling', price: 1500.00, durationMinutes: 30, isActive: true },
  { id: 'srv-65', name: 'HAIR WASH', category: 'Hair Cut & Styling', price: 800.00, durationMinutes: 15, isActive: true },

  // ACRYLIC NAILS EXTENSIONS
  { id: 'srv-66', name: 'FULL SET (HANDS)', category: 'Nails & Extensions', price: 8000.00, durationMinutes: 90, isActive: true },
  { id: 'srv-67', name: 'REFILLS', category: 'Nails & Extensions', price: 3500.00, durationMinutes: 45, isActive: true },
  { id: 'srv-68', name: 'ACRYLIC REMOVAL (HANDS)', category: 'Nails & Extensions', price: 3000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-69', name: 'ACRYLIC REMOVAL (FEET)', category: 'Nails & Extensions', price: 4500.00, durationMinutes: 30, isActive: true },

  // NAIL ART
  { id: 'srv-70', name: 'STENCIL ART', category: 'Nails & Extensions', price: 3000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-71', name: 'STONES', category: 'Nails & Extensions', price: 4000.00, durationMinutes: 30, isActive: true },
  { id: 'srv-72', name: 'FRENCH WITH GLITTER', category: 'Nails & Extensions', price: 4000.00, durationMinutes: 45, isActive: true },
  { id: 'srv-73', name: 'STONES WITH GLITTER', category: 'Nails & Extensions', price: 5000.00, durationMinutes: 45, isActive: true },
  { id: 'srv-74', name: 'NAIL COLOR', category: 'Nails & Extensions', price: 500.00, durationMinutes: 15, isActive: true },
  { id: 'srv-75', name: 'FRENCH POLISH (COLOR)', category: 'Nails & Extensions', price: 1000.00, durationMinutes: 20, isActive: true },

  // FOOT AND HAND SPA
  { id: 'srv-76', name: 'ORGANIC MANICURE', category: 'Spa & Massage', price: 1500.00, durationMinutes: 35, isActive: true },
  { id: 'srv-77', name: 'ORGANIC PEDICURE', category: 'Spa & Massage', price: 1500.00, durationMinutes: 45, isActive: true },
  { id: 'srv-78', name: 'BA SIGNATURE MANICURE', category: 'Spa & Massage', price: 2500.00, durationMinutes: 45, isActive: true },
  { id: 'srv-79', name: 'BA SIGNATURE PEDICURE', category: 'Spa & Massage', price: 2500.00, durationMinutes: 55, isActive: true },

  // HAIR COLOR
  { id: 'srv-80', name: 'ROOTS COVERAGE', category: 'Color & Highlights', price: 2000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-81', name: 'ONE COLOR FASHION - MAJIREL (ABOVE SHOULDER)', category: 'Color & Highlights', price: 6000.00, durationMinutes: 90, isActive: true },
  { id: 'srv-82', name: 'ONE COLOR FASHION - MAJIREL (BELOW SHOULDER)', category: 'Color & Highlights', price: 8000.00, durationMinutes: 120, isActive: true },
  { id: 'srv-83', name: 'ONE COLOR FASHION - MAJIREL (WAIST LENGTH)', category: 'Color & Highlights', price: 10000.00, durationMinutes: 150, isActive: true },
  { id: 'srv-84', name: 'HIGHLIGHTS (FULL HEAD WITHOUT BASE) (ABOVE SHOULDER)', category: 'Color & Highlights', price: 12000.00, durationMinutes: 150, isActive: true },
  { id: 'srv-85', name: 'HIGHLIGHTS (FULL HEAD WITHOUT BASE) (BELOW SHOULDER)', category: 'Color & Highlights', price: 15000.00, durationMinutes: 180, isActive: true },
  { id: 'srv-86', name: 'HIGHLIGHTS (FULL HEAD WITHOUT BASE) (WAIST LENGTH)', category: 'Color & Highlights', price: 20000.00, durationMinutes: 210, isActive: true },
  { id: 'srv-87', name: 'HIGHLIGHTS (FULL HEAD WITH BASE) (ABOVE SHOULDER)', category: 'Color & Highlights', price: 18000.00, durationMinutes: 180, isActive: true },
  { id: 'srv-88', name: 'HIGHLIGHTS (FULL HEAD WITH BASE) (BELOW SHOULDER)', category: 'Color & Highlights', price: 25000.00, durationMinutes: 210, isActive: true },
  { id: 'srv-89', name: 'HIGHLIGHTS (FULL HEAD WITH BASE) (WAIST LENGTH)', category: 'Color & Highlights', price: 35000.00, durationMinutes: 240, isActive: true },
  { id: 'srv-90', name: 'OMBRE / BALAYAGE (ABOVE SHOULDER)', category: 'Color & Highlights', price: 20000.00, durationMinutes: 180, isActive: true },
  { id: 'srv-91', name: 'OMBRE / BALAYAGE (BELOW SHOULDER)', category: 'Color & Highlights', price: 30000.00, durationMinutes: 210, isActive: true },
  { id: 'srv-92', name: 'OMBRE / BALAYAGE (WAIST LENGTH)', category: 'Color & Highlights', price: 40000.00, durationMinutes: 240, isActive: true },

  // EYELASH EXTENSIONS
  { id: 'srv-93', name: 'CLASSIC EYELASH EXTENSIONS', category: 'Eyelash Extensions', price: 8000.00, durationMinutes: 60, isActive: true },
  { id: 'srv-94', name: 'WISPY EYELASH EXTENSIONS', category: 'Eyelash Extensions', price: 12000.00, durationMinutes: 75, isActive: true },
  { id: 'srv-95', name: 'CAT EYE EYELASH EXTENSIONS', category: 'Eyelash Extensions', price: 12000.00, durationMinutes: 75, isActive: true },
  { id: 'srv-96', name: 'OPEN EYE EYELASH EXTENSIONS', category: 'Eyelash Extensions', price: 12000.00, durationMinutes: 75, isActive: true },
  { id: 'srv-97', name: 'VOLUME EYELASH EXTENSIONS', category: 'Eyelash Extensions', price: 12000.00, durationMinutes: 90, isActive: true },

  // THREADING
  { id: 'srv-98', name: 'THREADING FULL FACE WITH MASK AND SERUM', category: 'Threading', price: 1500.00, durationMinutes: 30, isActive: true },
  { id: 'srv-99', name: 'THREADING FULL FACE', category: 'Threading', price: 1000.00, durationMinutes: 20, isActive: true },
  { id: 'srv-100', name: 'THREADING PER AREA', category: 'Threading', price: 200.00, durationMinutes: 5, isActive: true },
  { id: 'srv-101', name: 'EYEBROWS (THREADING)', category: 'Threading', price: 400.00, durationMinutes: 10, isActive: true },

  // LAMINATION
  { id: 'srv-102', name: 'EYELASH LAMINATION', category: 'Lamination', price: 4000.00, durationMinutes: 45, isActive: true },
  { id: 'srv-103', name: 'EYELASH TINT AND LAMINATION', category: 'Lamination', price: 4500.00, durationMinutes: 60, isActive: true },
  { id: 'srv-104', name: 'EYEBROW LAMINATION', category: 'Lamination', price: 4000.00, durationMinutes: 40, isActive: true },
  { id: 'srv-105', name: 'EYEBROW TINT AND LAMINATION', category: 'Lamination', price: 4500.00, durationMinutes: 50, isActive: true },

  // MICROBLADING
  { id: 'srv-106', name: 'MICROBLADING EYEBROWS', category: 'Microblading', price: 25000.00, durationMinutes: 120, isActive: true },
];

/// Standard Initial Customers
const KEY_CUSTOMERS = 'salon_pos_customers';
const INITIAL_CUSTOMERS: Customer[] = [];

// Standard Initial Receipts spanning the last 12 days to populate graphs in high-quality fashion.
const KEY_RECEIPTS = 'salon_pos_receipts';
const INITIAL_RECEIPTS: Receipt[] = [];

// Active user
export const ACTIVE_USER: User = {
  id: 'user-1',
  name: "BEL'AMOUR",
  email: 'belamourspasaloon@gmail.com',
  role: 'Manager',
};

// Database state operations simulation
export function getStoredSettings(): SalonSettings {
  try {
    const data = localStorage.getItem(KEY_SETTINGS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: SalonSettings): void {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
}

export function getStoredCustomers(): Customer[] {
  try {
    const data = localStorage.getItem(KEY_CUSTOMERS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading customers', e);
  }
  // If first-time load, write initial customers to localStorage for persistence
  localStorage.setItem(KEY_CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  return INITIAL_CUSTOMERS;
}

export function saveStoredCustomers(customers: Customer[]): void {
  localStorage.setItem(KEY_CUSTOMERS, JSON.stringify(customers));
}

export function getStoredServices(): Service[] {
  try {
    const data = localStorage.getItem(KEY_SERVICES);
    if (data) {
      const parsed = JSON.parse(data) as Service[];
      if (parsed && parsed.length >= 15) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading services', e);
  }
  // Force reset/persist initial services to clear legacy items
  localStorage.setItem(KEY_SERVICES, JSON.stringify(INITIAL_SERVICES));
  return INITIAL_SERVICES;
}

export function saveStoredServices(services: Service[]): void {
  localStorage.setItem(KEY_SERVICES, JSON.stringify(services));
}

export function getStoredReceipts(): Receipt[] {
  try {
    const data = localStorage.getItem(KEY_RECEIPTS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading receipts', e);
  }
  // Persist initial receipts
  localStorage.setItem(KEY_RECEIPTS, JSON.stringify(INITIAL_RECEIPTS));
  return INITIAL_RECEIPTS;
}

export function saveStoredReceipts(receipts: Receipt[]): void {
  localStorage.setItem(KEY_RECEIPTS, JSON.stringify(receipts));
}

// Stored Expenses support
const KEY_EXPENSES = 'salon_pos_expenses';
const INITIAL_EXPENSES: Expense[] = [];

export function getStoredExpenses(): Expense[] {
  try {
    const data = localStorage.getItem(KEY_EXPENSES);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading expenses', e);
  }
  localStorage.setItem(KEY_EXPENSES, JSON.stringify(INITIAL_EXPENSES));
  return INITIAL_EXPENSES;
}

export function saveStoredExpenses(expenses: Expense[]): void {
  localStorage.setItem(KEY_EXPENSES, JSON.stringify(expenses));
}

// Generate next invoice sequential number
export function generateNextInvoiceNumber(receipts: Receipt[]): string {
  const latestNo = receipts.reduce((max, obj) => {
    const match = obj.receiptNo.match(/\d+/);
    if (match) {
      const val = parseInt(match[0], 10);
      return val > max ? val : max;
    }
    return max;
  }, 10501);
  return `TX-${latestNo + 1}`;
}
