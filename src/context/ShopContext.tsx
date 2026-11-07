import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppDataPayload,
  Category,
  DailyBalance,
  ShopSettings,
  Transaction,
  GeneratedReceipt,
  KhataParty,
  KhataEntry,
  SmsLogEntry,
  SmsSettings,
  SimSmsRequest,
  SimSmsStatus,
} from '../types';
import { ApiClient } from '../lib/apiClient';
import { getTodayDateString, generateInitialData, generateCleanShopData, DEFAULT_SHOP_SETTINGS } from '../data/defaults';
import { calculateDailySummary, DailyAccountSummary } from '../lib/accounting';
import { useAuth } from './AuthContext';

interface ShopContextType {
  shopSettings: ShopSettings;
  categories: Category[];
  dailyBalances: Record<string, DailyBalance>;
  transactions: Transaction[];
  receipts: GeneratedReceipt[];
  khataParties: KhataParty[];
  khataEntries: KhataEntry[];
  smsLogs: SmsLogEntry[];
  totalYouWillGet: number;
  totalYouWillGive: number;
  totalCustomerDue: number;
  totalCustomerPaid: number;
  todaySummary: DailyAccountSummary;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime: Date | null;

  // Actions
  addTransaction: (txn: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => boolean;
  deleteTransaction: (id: string) => boolean;
  setDailyOpeningBalance: (date: string, openingCash: number, openingBank: number, note?: string) => void;
  getOpeningBalanceForDate: (date: string) => DailyBalance | undefined;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  updateShopSettings: (settings: Partial<ShopSettings>) => void;
  forceSync: () => Promise<void>;
  restoreBackup: (data: AppDataPayload) => Promise<boolean>;
  resetShopData: (mode?: 'clean' | 'demo') => Promise<void>;

  // Khata Book (Digital Udhar Ledger) Actions
  addKhataParty: (
    party: Omit<KhataParty, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>,
    initialEntry?: {
      amount: number;
      type: 'you_gave' | 'you_got';
      date: string;
      note?: string;
    }
  ) => string;
  updateKhataParty: (id: string, updates: Partial<KhataParty>) => void;
  deleteKhataParty: (id: string) => boolean;
  addKhataEntry: (entry: Omit<KhataEntry, 'id' | 'createdAt'>) => string;
  deleteKhataEntry: (id: string) => boolean;
  getPartyEntries: (partyId: string) => KhataEntry[];
  getPartyById: (partyId: string) => KhataParty | undefined;

  // Receipt Actions & History
  saveReceipt: (receipt: GeneratedReceipt) => void;
  deleteReceipt: (id: string) => boolean;
  createReceiptFromTransaction: (txn: Transaction) => GeneratedReceipt;

  // SMS Notification & Gateway Actions
  retrySms: (logId: string) => Promise<{ success: boolean; error?: string }>;
  refreshSmsLogs: () => Promise<void>;
  updateSmsSettings: (settings: Partial<SmsSettings>) => Promise<void>;
  triggerKhataSms: (params: {
    entryId: string;
    partyId: string;
    partyName: string;
    partyMobile: string;
    type: 'you_gave' | 'you_got';
    amount: number;
    currentBalance: number;
    date?: string;
    note?: string;
  }) => Promise<any>;

  // Android SIM SMS Reminder System (Website to Android Phone)
  simSmsQueue: SimSmsRequest[];
  pendingSimSmsCount: number;
  createSimSms: (params: {
    partyId?: string;
    entryId?: string;
    customerName: string;
    customerMobile: string;
    shopName?: string;
    dueAmount: number;
    remainingBalance?: number;
    transactionType?: 'Due' | 'Payment';
    dateTime?: string;
    language?: 'bn' | 'en' | 'hi';
    message?: string;
  }) => Promise<{ success: boolean; request?: SimSmsRequest; error?: string }>;
  updateSimSmsStatus: (params: {
    requestId: string;
    status: SimSmsStatus;
    sentAt?: string;
    failedReason?: string;
    simSlot?: number;
    editedMessage?: string;
  }) => Promise<{ success: boolean; request?: SimSmsRequest; error?: string }>;
  deleteSimSms: (requestId: string) => Promise<boolean>;
  refreshSimSmsQueue: () => Promise<void>;

  // Global Quick Add Modal State
  isAddModalOpen: boolean;
  modalInitialType: string | null;
  modalInitialCategory: string | null;
  modalTransferDirection: 'cash_to_bank' | 'bank_to_cash' | null;
  openAddModal: (type?: string, prefillCategory?: string, transferDirection?: 'cash_to_bank' | 'bank_to_cash') => void;
  closeAddModal: () => void;

  // Global Receipt Modals State
  selectedReceipt: GeneratedReceipt | null;
  isReceiptModalOpen: boolean;
  openReceiptModal: (receipt: GeneratedReceipt) => void;
  closeReceiptModal: () => void;
  openReceiptModalForTransaction: (txn: Transaction) => void;

  isGenerateReceiptModalOpen: boolean;
  prefillReceiptTxn: Transaction | null;
  openGenerateReceiptModal: (prefillTxn?: Transaction | null) => void;
  closeGenerateReceiptModal: () => void;

  isReceiptHistoryModalOpen: boolean;
  openReceiptHistoryModal: () => void;
  closeReceiptHistoryModal: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<AppDataPayload>(() => ApiClient.getLocalData(user?.id, user?.shopName));
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());

  // Modal control
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<string | null>(null);
  const [modalInitialCategory, setModalInitialCategory] = useState<string | null>(null);
  const [modalTransferDirection, setModalTransferDirection] = useState<'cash_to_bank' | 'bank_to_cash' | null>(null);

  // Global Receipt Modal states
  const [selectedReceipt, setSelectedReceipt] = useState<GeneratedReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isGenerateReceiptModalOpen, setIsGenerateReceiptModalOpen] = useState(false);
  const [prefillReceiptTxn, setPrefillReceiptTxn] = useState<Transaction | null>(null);
  const [isReceiptHistoryModalOpen, setIsReceiptHistoryModalOpen] = useState(false);

  const todayStr = getTodayDateString();

  // Load and sync data when user changes or on mount
  useEffect(() => {
    let isMounted = true;

    // Immediately load user-specific local cache so UI switches without delay
    const local = ApiClient.getLocalData(user?.id, user?.shopName, user?.phone);
    setData(local);

    async function initialLoad() {
      setSyncStatus('syncing');
      const { data: remoteData, isOnline } = await ApiClient.fetchRemoteData(
        user?.id,
        user?.token,
        user?.shopName,
        user?.phone
      );
      if (!isMounted) return;

      if (remoteData) {
        setData(remoteData);
        setSyncStatus(isOnline ? 'synced' : 'offline');
        setLastSyncTime(new Date());
      } else {
        setSyncStatus('offline');
      }
    }

    initialLoad();

    // Polling sync every 7 seconds for multi-device live sync (phone & PC)
    const interval = setInterval(async () => {
      if (!navigator.onLine) {
        setSyncStatus('offline');
        return;
      }
      try {
        const url = user?.id ? `/api/data?userId=${encodeURIComponent(user.id)}` : '/api/data';
        const headers: Record<string, string> = {};
        if (user?.id) headers['x-user-id'] = user.id;
        if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

        const res = await fetch(url, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(prev => {
              // Only update if remote has changed (compare lastUpdated or transaction count)
              if (json.data.lastUpdated !== prev.lastUpdated) {
                ApiClient.saveLocalData(json.data, user?.id);
                return json.data;
              }
              return prev;
            });
            setSyncStatus('synced');
            setLastSyncTime(new Date());
          }
        }
      } catch (e) {
        // silent fail during poll
      }
    }, 7000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.id, user?.shopName, user?.phone, user?.token]);

  // Save changes locally and trigger server sync
  const commitData = useCallback((newDataOrUpdater: AppDataPayload | ((prev: AppDataPayload) => AppDataPayload)) => {
    setData(prev => {
      const nextData = typeof newDataOrUpdater === 'function' ? newDataOrUpdater(prev) : newDataOrUpdater;
      ApiClient.saveLocalData(nextData, user?.id);
      setSyncStatus('syncing');

      ApiClient.syncToServer(nextData, user?.id, user?.token)
        .then(success => {
          setSyncStatus(success ? 'synced' : 'offline');
          setLastSyncTime(new Date());
        })
        .catch(() => {
          setSyncStatus('offline');
        });

      return nextData;
    });
  }, [user?.id, user?.token]);

  // Set opening balance for any date (permanently saved per date)
  const setDailyOpeningBalance = useCallback((
    date: string,
    openingCash: number,
    openingBank: number,
    note?: string
  ) => {
    const existing = data.dailyBalances[date];
    const updatedBalance: DailyBalance = {
      id: date,
      date,
      openingCash: Math.max(0, Number(openingCash) || 0),
      openingBank: Math.max(0, Number(openingBank) || 0),
      note: note || existing?.note || '',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.id || 'owner',
    };

    const newData: AppDataPayload = {
      ...data,
      dailyBalances: {
        ...data.dailyBalances,
        [date]: updatedBalance,
      },
    };

    commitData(newData);
  }, [data, commitData, user?.id]);

  const getOpeningBalanceForDate = useCallback((date: string): DailyBalance | undefined => {
    return data.dailyBalances[date];
  }, [data.dailyBalances]);

  // Add transaction
  const addTransaction = useCallback((
    txnInput: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): string => {
    const newId = 'txn-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const nowIso = new Date().toISOString();

    const newTxn: Transaction = {
      ...txnInput,
      id: newId,
      userId: user?.id || 'owner',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Prepend to maintain reverse chronological order
    const updatedTxns = [newTxn, ...data.transactions];
    const newData: AppDataPayload = {
      ...data,
      transactions: updatedTxns,
    };

    commitData(newData);
    return newId;
  }, [data, commitData, user?.id]);

  // Update transaction
  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>): boolean => {
    const index = data.transactions.findIndex(t => t.id === id);
    if (index === -1) return false;

    const updatedTxn: Transaction = {
      ...data.transactions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const newTxns = [...data.transactions];
    newTxns[index] = updatedTxn;

    commitData({
      ...data,
      transactions: newTxns,
    });
    return true;
  }, [data, commitData]);

  // Delete transaction
  const deleteTransaction = useCallback((id: string): boolean => {
    const exists = data.transactions.some(t => t.id === id);
    if (!exists) return false;

    const filtered = data.transactions.filter(t => t.id !== id);
    commitData({
      ...data,
      transactions: filtered,
    });
    return true;
  }, [data, commitData]);

  // Category management
  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const newId = 'cat-' + Date.now();
    const newCat: Category = { ...cat, id: newId };
    commitData({
      ...data,
      categories: [...data.categories, newCat],
    });
  }, [data, commitData]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    const updated = data.categories.map(c => (c.id === id ? { ...c, ...updates } : c));
    commitData({
      ...data,
      categories: updated,
    });
  }, [data, commitData]);

  const deleteCategory = useCallback((id: string) => {
    const filtered = data.categories.filter(c => c.id !== id);
    commitData({
      ...data,
      categories: filtered,
    });
  }, [data, commitData]);

  // Shop Settings
  const updateShopSettings = useCallback((settings: Partial<ShopSettings>) => {
    commitData({
      ...data,
      shopSettings: {
        ...data.shopSettings,
        ...settings,
      },
    });
  }, [data, commitData]);

  // Force manual sync
  const forceSync = useCallback(async () => {
    setSyncStatus('syncing');
    const { data: remoteData, isOnline } = await ApiClient.fetchRemoteData(
      user?.id,
      user?.token,
      user?.shopName,
      user?.phone
    );
    if (remoteData) {
      setData(remoteData);
      setSyncStatus(isOnline ? 'synced' : 'offline');
      setLastSyncTime(new Date());
    } else {
      setSyncStatus('offline');
    }
  }, [user?.id, user?.token, user?.shopName, user?.phone]);

  // Restore backup
  const restoreBackup = useCallback(async (backup: AppDataPayload): Promise<boolean> => {
    if (!backup || !backup.shopSettings) return false;
    commitData(backup);
    try {
      await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup }),
      });
    } catch (e) {
      // ignore
    }
    return true;
  }, [commitData]);

  // Reset to clean empty database or demo state
  const resetShopData = useCallback(async (mode: 'clean' | 'demo' = 'clean'): Promise<void> => {
    const currentSettings = data.shopSettings;
    const initial = mode === 'clean'
      ? generateCleanShopData(currentSettings)
      : generateInitialData();
    commitData(initial);
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: initial }),
      });
    } catch (e) {
      // offline or server unavailable
    }
  }, [commitData, data.shopSettings]);

  // Modal helpers
  const openAddModal = (
    type?: string,
    prefillCategory?: string,
    transferDirection?: 'cash_to_bank' | 'bank_to_cash'
  ) => {
    setModalInitialType(type || null);
    setModalInitialCategory(prefillCategory || null);
    setModalTransferDirection(transferDirection || null);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setModalInitialType(null);
    setModalInitialCategory(null);
    setModalTransferDirection(null);
  };

  // Receipt Actions & Helpers
  const createReceiptFromTransaction = useCallback((txn: Transaction): GeneratedReceipt => {
    const existing = (data.receipts || []).find(r => r.transactionId === txn.id);
    if (existing) return existing;

    const receiptNum = txn.referenceNumber && txn.referenceNumber.startsWith('REC-')
      ? txn.referenceNumber
      : `REC-${txn.date.replace(/-/g, '')}-${txn.id.slice(-4).toUpperCase()}`;

    return {
      id: 'rec-' + txn.id,
      receiptNumber: receiptNum,
      transactionId: txn.id,
      date: txn.date,
      time: txn.time,
      customerName: txn.customerName || 'Walking Customer',
      customerMobile: txn.customerMobile || '',
      items: [
        {
          id: 'item-' + txn.id,
          name: txn.serviceName || 'Digital Service',
          category: txn.category,
          qty: 1,
          rate: txn.amount,
          amount: txn.amount,
        },
      ],
      subtotal: txn.amount,
      serviceCharge: txn.serviceCharge || 0,
      totalAmount: txn.amount + (txn.serviceCharge || 0),
      paymentMethod: txn.paymentMethod,
      paymentStatus: 'paid',
      note: txn.note,
      shopName: data.shopSettings.shopName,
      shopPhone: data.shopSettings.phone,
      shopAddress: data.shopSettings.address,
      gstinOrReg: data.shopSettings.gstinOrReg,
      footerMessage: data.shopSettings.receiptFooterMessage,
      createdAt: txn.createdAt || new Date().toISOString(),
    };
  }, [data.receipts, data.shopSettings]);

  const saveReceipt = useCallback((receipt: GeneratedReceipt) => {
    const existingList = data.receipts || [];
    const index = existingList.findIndex(r => r.id === receipt.id || r.receiptNumber === receipt.receiptNumber);
    let updatedReceipts: GeneratedReceipt[];
    if (index >= 0) {
      updatedReceipts = [...existingList];
      updatedReceipts[index] = receipt;
    } else {
      updatedReceipts = [receipt, ...existingList];
    }
    commitData({
      ...data,
      receipts: updatedReceipts,
    });
  }, [data, commitData]);

  const deleteReceipt = useCallback((id: string): boolean => {
    const filtered = (data.receipts || []).filter(r => r.id !== id);
    commitData({
      ...data,
      receipts: filtered,
    });
    return true;
  }, [data, commitData]);

  const openReceiptModal = useCallback((receipt: GeneratedReceipt) => {
    setSelectedReceipt(receipt);
    setIsReceiptModalOpen(true);
  }, []);

  const closeReceiptModal = useCallback(() => {
    setIsReceiptModalOpen(false);
    setSelectedReceipt(null);
  }, []);

  const openReceiptModalForTransaction = useCallback((txn: Transaction) => {
    const receipt = createReceiptFromTransaction(txn);
    saveReceipt(receipt);
    setSelectedReceipt(receipt);
    setIsReceiptModalOpen(true);
  }, [createReceiptFromTransaction, saveReceipt]);

  const openGenerateReceiptModal = useCallback((prefillTxn?: Transaction | null) => {
    setPrefillReceiptTxn(prefillTxn || null);
    setIsGenerateReceiptModalOpen(true);
  }, []);

  const closeGenerateReceiptModal = useCallback(() => {
    setIsGenerateReceiptModalOpen(false);
    setPrefillReceiptTxn(null);
  }, []);

  const openReceiptHistoryModal = useCallback(() => {
    setIsReceiptHistoryModalOpen(true);
  }, []);

  const closeReceiptHistoryModal = useCallback(() => {
    setIsReceiptHistoryModalOpen(false);
  }, []);

  // Khata helper calculations
  const khataParties = useMemo(() => data.khataParties || [], [data.khataParties]);
  const khataEntries = useMemo(() => data.khataEntries || [], [data.khataEntries]);
  const smsLogs = useMemo(() => data.smsLogs || [], [data.smsLogs]);
  const simSmsQueue = useMemo(() => data.simSmsQueue || [], [data.simSmsQueue]);

  const pendingSimSmsCount = useMemo(() => {
    return simSmsQueue.filter(r => r.status === 'Pending' || r.status === 'Approved').length;
  }, [simSmsQueue]);

  const totalYouWillGet = useMemo(() => {
    return khataParties.reduce((sum, p) => (p.currentBalance > 0 ? sum + p.currentBalance : sum), 0);
  }, [khataParties]);

  const totalYouWillGive = useMemo(() => {
    return khataParties.reduce((sum, p) => (p.currentBalance < 0 ? sum + Math.abs(p.currentBalance) : sum), 0);
  }, [khataParties]);

  const totalCustomerDue = useMemo(() => {
    const customerIds = new Set(khataParties.filter(p => p.type === 'customer').map(p => p.id));
    return khataEntries
      .filter(e => customerIds.has(e.partyId) && e.type === 'you_gave')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [khataParties, khataEntries]);

  const totalCustomerPaid = useMemo(() => {
    const customerIds = new Set(khataParties.filter(p => p.type === 'customer').map(p => p.id));
    return khataEntries
      .filter(e => customerIds.has(e.partyId) && e.type === 'you_got')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [khataParties, khataEntries]);

  const addKhataParty = useCallback((
    partyInput: Omit<KhataParty, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>,
    initialEntry?: {
      amount: number;
      type: 'you_gave' | 'you_got';
      date: string;
      note?: string;
    }
  ): string => {
    const newId = 'party-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    const partyDate = partyInput.date || getTodayDateString();

    commitData(prev => {
      let initialBalance = 0;
      const newEntries = [...(prev.khataEntries || [])];

      if (initialEntry && initialEntry.amount > 0) {
        const delta = initialEntry.type === 'you_gave' ? initialEntry.amount : -initialEntry.amount;
        initialBalance = delta;

        const entryId = 'ke-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        newEntries.unshift({
          id: entryId,
          partyId: newId,
          type: initialEntry.type,
          amount: initialEntry.amount,
          date: initialEntry.date || partyDate,
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          note: initialEntry.note || 'Opening Balance (প্রারম্ভিক বকেয়া)',
          paymentMethod: 'cash',
          createdAt: now,
        });
      }

      const newParty: KhataParty = {
        ...partyInput,
        id: newId,
        date: partyDate,
        currentBalance: initialBalance,
        createdAt: now,
        updatedAt: now,
      };

      return {
        ...prev,
        khataParties: [newParty, ...(prev.khataParties || [])],
        khataEntries: newEntries,
      };
    });

    return newId;
  }, [commitData]);

  const updateKhataParty = useCallback((id: string, updates: Partial<KhataParty>) => {
    commitData(prev => {
      const parties = (prev.khataParties || []).map(p => {
        if (p.id === id) {
          return {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      return {
        ...prev,
        khataParties: parties,
      };
    });
  }, [commitData]);

  const deleteKhataParty = useCallback((id: string): boolean => {
    commitData(prev => {
      const updatedParties = (prev.khataParties || []).filter(p => p.id !== id);
      const updatedEntries = (prev.khataEntries || []).filter(e => e.partyId !== id);
      return {
        ...prev,
        khataParties: updatedParties,
        khataEntries: updatedEntries,
      };
    });
    return true;
  }, [commitData]);

  // Trigger Khata Transaction SMS
  const triggerKhataSms = useCallback(async (params: {
    entryId: string;
    partyId: string;
    partyName: string;
    partyMobile: string;
    type: 'you_gave' | 'you_got';
    amount: number;
    currentBalance: number;
    date?: string;
    note?: string;
  }) => {
    try {
      const res = await fetch('/api/sms/send-khata-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const resJson = await res.json();
      if (resJson.log) {
        commitData(prev => {
          const currentLogs = prev.smsLogs || [];
          const exists = currentLogs.some(l => l.id === resJson.log.id);
          if (exists) {
            return {
              ...prev,
              smsLogs: currentLogs.map(l => (l.id === resJson.log.id ? resJson.log : l)),
            };
          }
          return {
            ...prev,
            smsLogs: [resJson.log, ...currentLogs],
          };
        });
      }
      return resJson;
    } catch (e: any) {
      console.warn('Failed to send Khata transaction SMS:', e);
      return { success: false, error: e.message };
    }
  }, [commitData]);

  // Retry failed SMS
  const retrySms = useCallback(async (logId: string) => {
    try {
      const res = await fetch('/api/sms/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });
      const resJson = await res.json();
      if (resJson.log) {
        commitData(prev => {
          const currentLogs = prev.smsLogs || [];
          return {
            ...prev,
            smsLogs: currentLogs.map(l => (l.id === logId ? resJson.log : l)),
          };
        });
      }
      return { success: resJson.success, error: resJson.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, [commitData]);

  // Refresh SMS logs from server
  const refreshSmsLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/sms/logs');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.logs) {
          commitData(prev => ({
            ...prev,
            smsLogs: json.logs,
          }));
        }
      }
    } catch (e) {
      // ignore
    }
  }, [commitData]);

  // Update SMS Settings
  const updateSmsSettings = useCallback(async (settings: Partial<SmsSettings>) => {
    const updatedSettings: SmsSettings = {
      ...(data.shopSettings.smsSettings || {
        smsEnabled: true,
        smsLanguage: 'both',
        gatewayProvider: 'fast2sms',
        senderId: 'RDMCTR',
      }),
      ...settings,
    };

    commitData(prev => ({
      ...prev,
      shopSettings: {
        ...prev.shopSettings,
        smsSettings: updatedSettings,
      },
    }));

    try {
      await fetch('/api/sms/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsSettings: updatedSettings }),
      });
    } catch (e) {
      // ignore
    }
  }, [data.shopSettings, commitData]);

  // SIM SMS Action: Create new pending SIM SMS request from website (Confirm Due)
  const createSimSms = useCallback(async (params: {
    partyId?: string;
    entryId?: string;
    customerName: string;
    customerMobile: string;
    shopName?: string;
    dueAmount: number;
    remainingBalance?: number;
    transactionType?: 'Due' | 'Payment';
    dateTime?: string;
    language?: 'bn' | 'en' | 'hi';
    message?: string;
  }) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.id) headers['x-user-id'] = user.id;
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch('/api/sim-sms/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...params,
          shopName: user?.shopName || data.shopSettings?.shopName,
        }),
      });
      const resJson = await res.json();
      if (resJson.success && resJson.request) {
        commitData(prev => {
          const currentQueue = prev.simSmsQueue || [];
          const exists = currentQueue.some(q => q.id === resJson.request.id);
          if (exists) {
            return {
              ...prev,
              simSmsQueue: currentQueue.map(q => (q.id === resJson.request.id ? resJson.request : q)),
            };
          }
          return {
            ...prev,
            simSmsQueue: [resJson.request, ...currentQueue],
          };
        });
      }
      return resJson;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, [commitData, user?.id, user?.token, user?.shopName, data.shopSettings?.shopName]);

  // SIM SMS Action: Update status (Approved, Sending, Sent, Failed) from Android App
  const updateSimSmsStatus = useCallback(async (params: {
    requestId: string;
    status: SimSmsStatus;
    sentAt?: string;
    failedReason?: string;
    simSlot?: number;
    editedMessage?: string;
  }) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.id) headers['x-user-id'] = user.id;
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch('/api/sim-sms/status', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
      const resJson = await res.json();
      if (resJson.success && resJson.request) {
        commitData(prev => {
          const currentQueue = prev.simSmsQueue || [];
          return {
            ...prev,
            simSmsQueue: currentQueue.map(q => (q.id === params.requestId ? resJson.request : q)),
          };
        });
      }
      return resJson;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }, [commitData, user?.id, user?.token]);

  // SIM SMS Action: Delete request
  const deleteSimSms = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.id) headers['x-user-id'] = user.id;
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch('/api/sim-sms/delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ requestId }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        commitData(prev => ({
          ...prev,
          simSmsQueue: (prev.simSmsQueue || []).filter(q => q.id !== requestId),
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [commitData, user?.id, user?.token]);

  // SIM SMS Action: Refresh queue from server
  const refreshSimSmsQueue = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (user?.id) headers['x-user-id'] = user.id;
      if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

      const res = await fetch('/api/sim-sms/all', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.requests) {
          commitData(prev => ({
            ...prev,
            simSmsQueue: json.requests,
          }));
        }
      }
    } catch (e) {
      // ignore
    }
  }, [commitData, user?.id, user?.token]);

  const addKhataEntry = useCallback((entryInput: Omit<KhataEntry, 'id' | 'createdAt'>): string => {
    const entryId = 'ke-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    const newEntry: KhataEntry = {
      ...entryInput,
      id: entryId,
      createdAt: now,
    };

    let targetParty: KhataParty | undefined;
    let updatedBalance = 0;

    commitData(prev => {
      const updatedEntries = [newEntry, ...(prev.khataEntries || [])];
      const delta = entryInput.type === 'you_gave' ? entryInput.amount : -entryInput.amount;

      const updatedParties = (prev.khataParties || []).map(p => {
        if (p.id === entryInput.partyId) {
          const newBal = (Number(p.currentBalance) || 0) + delta;
          targetParty = p;
          updatedBalance = newBal;
          return {
            ...p,
            currentBalance: newBal,
            updatedAt: now,
          };
        }
        return p;
      });

      return {
        ...prev,
        khataParties: updatedParties,
        khataEntries: updatedEntries,
      };
    });

    // Automatic Khata SMS payment notification
    const currentParty = targetParty || (data.khataParties || []).find(p => p.id === entryInput.partyId);
    if (currentParty && currentParty.mobile) {
      const isSmsActive = data.shopSettings?.smsSettings?.smsEnabled !== false;
      if (isSmsActive) {
        // Trigger automatic SMS
        triggerKhataSms({
          entryId,
          partyId: currentParty.id,
          partyName: currentParty.name,
          partyMobile: currentParty.mobile,
          type: entryInput.type,
          amount: entryInput.amount,
          currentBalance: updatedBalance,
          date: entryInput.date,
          note: entryInput.note,
        });
      }
    }

    return entryId;
  }, [commitData, data.khataParties, data.shopSettings, triggerKhataSms]);

  const deleteKhataEntry = useCallback((entryId: string): boolean => {
    commitData(prev => {
      const entry = (prev.khataEntries || []).find(e => e.id === entryId);
      if (!entry) return prev;

      const updatedEntries = (prev.khataEntries || []).filter(e => e.id !== entryId);
      const delta = entry.type === 'you_gave' ? entry.amount : -entry.amount;

      const updatedParties = (prev.khataParties || []).map(p => {
        if (p.id === entry.partyId) {
          return {
            ...p,
            currentBalance: (Number(p.currentBalance) || 0) - delta,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      return {
        ...prev,
        khataParties: updatedParties,
        khataEntries: updatedEntries,
      };
    });
    return true;
  }, [commitData]);

  const getPartyEntries = useCallback((partyId: string): KhataEntry[] => {
    return (data.khataEntries || []).filter(e => e.partyId === partyId);
  }, [data.khataEntries]);

  const getPartyById = useCallback((partyId: string): KhataParty | undefined => {
    return (data.khataParties || []).find(p => p.id === partyId);
  }, [data.khataParties]);

  // Always prioritize the active logged-in shopkeeper's registered shop name and mobile
  const effectiveShopSettings = useMemo(() => {
    const base = data.shopSettings || DEFAULT_SHOP_SETTINGS;
    if (user?.shopName) {
      const isDefaultPlaceholder =
        !base.shopName ||
        base.shopName === 'Radhamadhab Online Center' ||
        base.shopName === 'Radha Madhab Online Center' ||
        base.shopName === 'Online Center';

      return {
        ...base,
        shopName: isDefaultPlaceholder ? user.shopName : base.shopName,
        shopNameBn:
          base.shopNameBn === 'রাধা মাধব অনলাইন সেন্টার' || !base.shopNameBn
            ? user.shopName
            : base.shopNameBn,
        ownerName: base.ownerName === 'Arabindu D.' || !base.ownerName ? user.shopName : base.ownerName,
        phone: base.phone === '9876543210' || !base.phone ? user.phone || base.phone : base.phone,
        receiptFooterMessage:
          !base.receiptFooterMessage ||
          base.receiptFooterMessage.includes('Radhamadhab') ||
          base.receiptFooterMessage.includes('Radha Madhab')
            ? `Thank you for visiting ${user.shopName}! Please visit again.`
            : base.receiptFooterMessage,
      };
    }
    return base;
  }, [data.shopSettings, user?.shopName, user?.phone]);

  // Compute today's balances & summaries dynamically
  const todaySummary = useMemo(() => {
    return calculateDailySummary(todayStr, data.dailyBalances, data.transactions);
  }, [todayStr, data.dailyBalances, data.transactions]);

  return (
    <ShopContext.Provider
      value={{
        shopSettings: effectiveShopSettings,
        categories: data.categories,
        dailyBalances: data.dailyBalances,
        transactions: data.transactions,
        receipts: data.receipts || [],
        khataParties,
        khataEntries,
        smsLogs,
        simSmsQueue,
        pendingSimSmsCount,
        createSimSms,
        updateSimSmsStatus,
        deleteSimSms,
        refreshSimSmsQueue,
        totalYouWillGet,
        totalYouWillGive,
        totalCustomerDue,
        totalCustomerPaid,
        addKhataParty,
        updateKhataParty,
        deleteKhataParty,
        addKhataEntry,
        deleteKhataEntry,
        getPartyEntries,
        getPartyById,
        triggerKhataSms,
        retrySms,
        refreshSmsLogs,
        updateSmsSettings,
        todaySummary,
        syncStatus,
        lastSyncTime,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setDailyOpeningBalance,
        getOpeningBalanceForDate,
        addCategory,
        updateCategory,
        deleteCategory,
        updateShopSettings,
        forceSync,
        restoreBackup,
        resetShopData,
        saveReceipt,
        deleteReceipt,
        createReceiptFromTransaction,
        isAddModalOpen,
        modalInitialType,
        modalInitialCategory,
        modalTransferDirection,
        openAddModal,
        closeAddModal,
        selectedReceipt,
        isReceiptModalOpen,
        openReceiptModal,
        closeReceiptModal,
        openReceiptModalForTransaction,
        isGenerateReceiptModalOpen,
        prefillReceiptTxn,
        openGenerateReceiptModal,
        closeGenerateReceiptModal,
        isReceiptHistoryModalOpen,
        openReceiptHistoryModal,
        closeReceiptHistoryModal,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
};
