export type PaymentMethod = 'cash' | 'bank' | 'upi';

export type TransactionType =
  | 'cash_in'
  | 'cash_out'
  | 'bank_in'
  | 'bank_out'
  | 'cash_to_bank'
  | 'bank_to_cash'
  | 'service_income'
  | 'expense'
  | 'recharge'
  | 'money_transfer';

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

export interface DailyBalance {
  id: string; // date in YYYY-MM-DD format
  date: string; // YYYY-MM-DD
  openingCash: number;
  openingBank: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h or 12h)
  type: TransactionType;
  category: string; // Category id or name
  serviceName: string; // Specific service e.g. "Xerox Black & White"
  amount: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerMobile?: string;
  referenceNumber?: string;
  note?: string;

  // Specific to recharge
  rechargeOperator?: string;
  rechargeProfit?: number;

  // Specific to money transfer
  receiverName?: string;
  receiverAccount?: string;
  serviceCharge?: number;

  // Specific to expense
  expenseCategory?: string;

  createdAt: string;
  updatedAt: string;
}

export interface SmsSettings {
  smsEnabled: boolean;
  smsLanguage: 'en' | 'bn' | 'both';
  gatewayProvider: 'fast2sms' | 'twilio' | 'msg91';
  senderId?: string; // DLT / Sender ID or header
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  fast2smsApiKey?: string;
  msg91AuthKey?: string;
  msg91TemplateId?: string;
}

export interface SmsLogEntry {
  id: string;
  transactionId?: string; // Khata entry or transaction ID for idempotency
  partyId?: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  type: 'payment_received' | 'payment_given' | 'otp_registration' | 'manual_reminder' | 'test';
  status: 'sent' | 'delivered' | 'failed' | 'queued';
  amount?: number;
  balance?: number;
  error?: string;
  gateway: string;
  createdAt: string;
  retriedAt?: string;
  retryCount?: number;
}

export type SimSmsStatus = 'Pending' | 'Approved' | 'Sending' | 'Sent' | 'Failed';

export interface SimSmsRequest {
  id: string;
  userId: string;
  partyId?: string;
  entryId?: string;
  customerName: string;
  customerMobile: string;
  shopName: string;
  dueAmount: number;
  remainingBalance?: number;
  transactionType: 'Due' | 'Payment';
  dateTime: string;
  status: SimSmsStatus;
  language: 'bn' | 'en' | 'hi';
  message: string;
  sentAt?: string;
  failedReason?: string;
  simSlot?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopSettings {
  shopName: string;
  shopNameBn: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  gstinOrReg: string;
  receiptFooterMessage: string;
  currencySymbol: string;
  upiId?: string;
  smsSettings?: SmsSettings;
}

export interface UserProfile {
  id: string;
  name: string;
  shopName: string;
  email?: string;
  role: 'owner' | 'staff';
  phone?: string;
  createdAt: string;
  token?: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  category?: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface GeneratedReceipt {
  id: string;
  receiptNumber: string;
  transactionId?: string;
  date: string;
  time: string;
  customerName: string;
  customerMobile: string;
  items: ReceiptItem[];
  subtotal: number;
  serviceCharge: number;
  discount?: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'due';
  note?: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  gstinOrReg?: string;
  footerMessage?: string;
  createdAt: string;
}

export interface KhataParty {
  id: string;
  name: string;
  mobile: string;
  type: 'customer' | 'supplier';
  currentBalance: number; // positive: you will get (receivable); negative: you will give (payable)
  address?: string;
  date?: string; // Account / Customer entry date (YYYY-MM-DD)
  createdAt: string;
  updatedAt: string;
}

export interface KhataEntry {
  id: string;
  partyId: string;
  type: 'you_gave' | 'you_got'; // you_gave = Red (Udhar / Credit given); you_got = Green (Jama / Payment received)
  amount: number;
  date: string;
  time: string;
  note?: string;
  billNumber?: string;
  dueDate?: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
}

export interface AppDataPayload {
  version: number;
  lastUpdated: string;
  shopSettings: ShopSettings;
  categories: Category[];
  dailyBalances: Record<string, DailyBalance>; // key: YYYY-MM-DD
  transactions: Transaction[];
  receipts?: GeneratedReceipt[];
  users?: UserProfile[];
  khataParties?: KhataParty[];
  khataEntries?: KhataEntry[];
  smsLogs?: SmsLogEntry[];
  simSmsQueue?: SimSmsRequest[];
}

export interface DateRangeFilter {
  preset: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'custom';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}
