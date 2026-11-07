import { Category, ShopSettings, AppDataPayload, Transaction, DailyBalance, GeneratedReceipt, KhataParty, KhataEntry } from '../types';

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopName: '',
  shopNameBn: '',
  ownerName: '',
  phone: '',
  email: '',
  address: '',
  gstinOrReg: '',
  receiptFooterMessage: 'Thank you for your visit! Please visit again.',
  currencySymbol: '₹',
  upiId: '',
  smsSettings: {
    smsEnabled: true,
    smsLanguage: 'both',
    gatewayProvider: 'fast2sms',
    senderId: 'RDMCTR',
  },
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-xerox', name: 'Xerox', nameBn: 'জেরক্স', icon: 'Copy', color: 'blue', isDefault: true },
  { id: 'cat-print', name: 'Print', nameBn: 'প্রিন্ট', icon: 'Printer', color: 'indigo', isDefault: true },
  { id: 'cat-photo', name: 'Photo', nameBn: 'ফটো', icon: 'Camera', color: 'cyan', isDefault: true },
  { id: 'cat-online-form', name: 'Online Form', nameBn: 'অনলাইন ফর্ম', icon: 'FileText', color: 'emerald', isDefault: true },
  { id: 'cat-recharge', name: 'Recharge', nameBn: 'রিচার্জ', icon: 'Smartphone', color: 'violet', isDefault: true },
  { id: 'cat-money-transfer', name: 'Money Transfer', nameBn: 'মানি ট্রান্সফার', icon: 'ArrowRightLeft', color: 'amber', isDefault: true },
  { id: 'cat-banking', name: 'Banking Service', nameBn: 'ব্যাংকিং সেবা (AEPS)', icon: 'Building2', color: 'teal', isDefault: true },
  { id: 'cat-ticket', name: 'Ticket Booking', nameBn: 'টিকিট বুকিং', icon: 'Ticket', color: 'orange', isDefault: true },
  { id: 'cat-lamination', name: 'Lamination', nameBn: 'লেমিনেশন', icon: 'Layers', color: 'purple', isDefault: true },
  { id: 'cat-scan', name: 'Scan', nameBn: 'স্ক্যান', icon: 'Scan', color: 'sky', isDefault: true },
  { id: 'cat-passport-photo', name: 'Passport Photo', nameBn: 'পাসপোর্ট ফটো', icon: 'UserCheck', color: 'rose', isDefault: true },
  { id: 'cat-pancard', name: 'PAN Card Service', nameBn: 'প্যান কার্ড সার্ভিস', icon: 'CreditCard', color: 'amber', isDefault: true },
  { id: 'cat-aadhaar-voter', name: 'Aadhaar & Voter', nameBn: 'আধার ও ভোটার সেবা', icon: 'FileCheck', color: 'emerald', isDefault: true },
  { id: 'cat-electricity-bill', name: 'Electricity / Bill Pay', nameBn: 'বিদ্যুৎ বিল ও রিচার্জ', icon: 'Zap', color: 'yellow', isDefault: true },
  { id: 'cat-pvc-card', name: 'PVC Card Print', nameBn: 'পিভিসি স্মার্ট কার্ড', icon: 'CreditCard', color: 'blue', isDefault: true },
  { id: 'cat-certificates', name: 'Certificates Apply', nameBn: 'সার্টিফিকেট আবেদন', icon: 'Award', color: 'cyan', isDefault: true },
  { id: 'cat-other', name: 'Other', nameBn: 'অন্যান্য ডিজিটাল সেবা', icon: 'MoreHorizontal', color: 'slate', isDefault: true },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'exp-shop', name: 'Shop Expense', nameBn: 'দোকানের খরচ' },
  { id: 'exp-electricity', name: 'Electricity Bill', nameBn: 'বিদ্যুৎ বিল' },
  { id: 'exp-internet', name: 'Internet Bill', nameBn: 'ইন্টারনেট বিল' },
  { id: 'exp-stationery', name: 'Paper & Stationery', nameBn: 'কাগজ ও স্টেশনারি' },
  { id: 'exp-transport', name: 'Transport / Travelling', nameBn: 'যাতায়াত খরচ' },
  { id: 'exp-bank-charge', name: 'Bank Charge', nameBn: 'ব্যাংক চার্জ' },
  { id: 'exp-recharge-balance', name: 'Recharge Portal Load', nameBn: 'রিচার্জ পোর্টাল লোড' },
  { id: 'exp-tea', name: 'Tea & Refreshment', nameBn: 'চা ও আপ্যায়ন' },
  { id: 'exp-other', name: 'Other Expense', nameBn: 'অন্যান্য খরচ' },
];

// Helper to format ISO date string to YYYY-MM-DD
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function generateInitialData(): AppDataPayload {
  const today = getTodayDateString();
  const initialDailyBalance: DailyBalance = {
    id: today,
    date: today,
    openingCash: 0,
    openingBank: 0,
    note: 'Initial setup opening balance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'user_default',
  };

  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    shopSettings: { ...DEFAULT_SHOP_SETTINGS },
    categories: DEFAULT_CATEGORIES,
    dailyBalances: {
      [today]: initialDailyBalance,
    },
    transactions: [],
    receipts: [],
    khataParties: [],
    khataEntries: [],
    smsLogs: [],
    users: [],
    simSmsQueue: [],
  };
}

export function generateCleanShopData(customSettings?: Partial<ShopSettings>, userId?: string): AppDataPayload {
  const today = getTodayDateString();
  const uid = userId || 'user_default';
  const initialDailyBalance: DailyBalance = {
    id: today,
    date: today,
    openingCash: 0,
    openingBank: 0,
    note: 'Initial setup opening balance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: uid,
  };

  const name = customSettings?.shopName || '';
  const nameBn = customSettings?.shopNameBn || name;
  const owner = customSettings?.ownerName || name;
  const phone = customSettings?.phone || '';

  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    shopSettings: {
      ...DEFAULT_SHOP_SETTINGS,
      shopName: name,
      shopNameBn: nameBn,
      ownerName: owner,
      phone: phone,
      email: customSettings?.email || (phone ? `${phone}@shop.local` : ''),
      address: customSettings?.address || '',
      gstinOrReg: customSettings?.gstinOrReg || '',
      receiptFooterMessage:
        customSettings?.receiptFooterMessage ||
        (name ? `Thank you for visiting ${name}! Please visit again.` : 'Thank you for your visit! Please visit again.'),
      currencySymbol: '₹',
      upiId: customSettings?.upiId || '',
      ...(customSettings || {}),
    },
    categories: DEFAULT_CATEGORIES,
    dailyBalances: {
      [today]: initialDailyBalance,
    },
    transactions: [],
    receipts: [],
    khataParties: [],
    khataEntries: [],
    smsLogs: [],
    simSmsQueue: [],
    users: uid !== 'user_default' ? [
      {
        id: uid,
        email: customSettings?.email || (phone ? `${phone}@shop.local` : 'owner@shop.local'),
        name: owner || name || 'Shop Owner',
        shopName: name,
        role: 'owner',
        phone: phone,
        createdAt: new Date().toISOString(),
      },
    ] : [],
  };
}
