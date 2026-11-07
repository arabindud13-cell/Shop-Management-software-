import { AppDataPayload, UserProfile } from '../types';
import { generateInitialData, generateCleanShopData, DEFAULT_CATEGORIES, DEFAULT_SHOP_SETTINGS } from '../data/defaults';

const AUTH_STORAGE_KEY = 'radhamadhab_auth_v2';
const getStorageKey = (userId?: string) => `radhamadhab_shop_data_${userId || 'default'}`;

export class ApiClient {
  private static localDataCache: Record<string, AppDataPayload> = {};
  private static isSyncing = false;
  private static pendingSyncData: { data: AppDataPayload; userId?: string } | null = null;

  // Helper to ensure full categories & settings compatibility
  private static sanitizePayload(data: AppDataPayload, fallbackShopName?: string, fallbackMobile?: string): AppDataPayload {
    if (!data) return generateInitialData();
    const existingCatIds = new Set((data.categories || []).map(c => c.id));
    const missingCats = DEFAULT_CATEGORIES.filter(c => !existingCatIds.has(c.id));
    const mergedCats = missingCats.length > 0 ? [...(data.categories || []), ...missingCats] : (data.categories || []);

    const fallbackSettings = fallbackShopName
      ? {
          ...DEFAULT_SHOP_SETTINGS,
          shopName: fallbackShopName,
          shopNameBn: fallbackShopName,
          ownerName: fallbackShopName,
          phone: fallbackMobile || '',
          email: fallbackMobile ? `${fallbackMobile}@shop.local` : '',
          address: '',
          receiptFooterMessage: `Thank you for visiting ${fallbackShopName}! Please visit again.`,
          upiId: '',
        }
      : DEFAULT_SHOP_SETTINGS;

    const mergedSettings = { ...fallbackSettings, ...(data.shopSettings || {}) };

    // When registered shop name exists, automatically ensure shop settings reflect this user's shop info
    if (fallbackShopName) {
      if (
        !mergedSettings.shopName ||
        mergedSettings.shopName === 'Radhamadhab Online Center' ||
        mergedSettings.shopName === 'Radha Madhab Online Center' ||
        mergedSettings.shopName === 'Online Center' ||
        mergedSettings.shopName.trim() === ''
      ) {
        mergedSettings.shopName = fallbackShopName;
        mergedSettings.shopNameBn = fallbackShopName;
      }
      if (!mergedSettings.ownerName || mergedSettings.ownerName === 'Arabindu D.' || mergedSettings.ownerName === 'Shop Owner') {
        mergedSettings.ownerName = fallbackShopName;
      }
      if (fallbackMobile && (!mergedSettings.phone || mergedSettings.phone === '9876543210')) {
        mergedSettings.phone = fallbackMobile;
      }
      if (
        !mergedSettings.receiptFooterMessage ||
        mergedSettings.receiptFooterMessage.includes('Radhamadhab') ||
        mergedSettings.receiptFooterMessage.includes('Radha Madhab')
      ) {
        mergedSettings.receiptFooterMessage = `Thank you for visiting ${fallbackShopName}! Please visit again.`;
      }
    }

    return {
      ...data,
      categories: mergedCats,
      shopSettings: mergedSettings,
      dailyBalances: data.dailyBalances || {},
      transactions: data.transactions || [],
      receipts: data.receipts || [],
      khataParties: data.khataParties || [],
      khataEntries: data.khataEntries || [],
      smsLogs: data.smsLogs || [],
      simSmsQueue: data.simSmsQueue || [],
    };
  }

  // Read local cache first per user
  public static getLocalData(userId?: string, shopName?: string, mobile?: string): AppDataPayload {
    const key = getStorageKey(userId);
    if (this.localDataCache[key]) {
      return this.localDataCache[key];
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        const clean = this.sanitizePayload(parsed, shopName, mobile);
        this.localDataCache[key] = clean;
        return clean;
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }

    const initial = shopName
      ? generateCleanShopData({
          shopName,
          shopNameBn: shopName,
          ownerName: shopName,
          phone: mobile || '',
          email: mobile ? `${mobile}@shop.local` : '',
          receiptFooterMessage: `Thank you for visiting ${shopName}! Please visit again.`,
        })
      : generateInitialData();
    this.saveLocalData(initial, userId);
    return initial;
  }

  // Save to local cache per user
  public static saveLocalData(data: AppDataPayload, userId?: string): void {
    const key = getStorageKey(userId);
    const clean = this.sanitizePayload(data);
    this.localDataCache[key] = clean;
    try {
      localStorage.setItem(key, JSON.stringify(clean));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  // Fetch full data from server with local fallback
  public static async fetchRemoteData(
    userId?: string,
    token?: string,
    shopName?: string,
    mobile?: string
  ): Promise<{ data: AppDataPayload; isOnline: boolean }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const url = userId ? `/api/data?userId=${encodeURIComponent(userId)}` : '/api/data';
      const headers: Record<string, string> = {};
      if (userId) headers['x-user-id'] = userId;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const cleanRemote = this.sanitizePayload(json.data, shopName, mobile);
          this.saveLocalData(cleanRemote, userId);
          return { data: cleanRemote, isOnline: true };
        }
      }
    } catch (err) {
      // offline or server unavailable
    }
    return { data: this.getLocalData(userId, shopName, mobile), isOnline: false };
  }

  // Push local updates to server with guaranteed retry/queueing
  public static async syncToServer(data: AppDataPayload, userId?: string, token?: string): Promise<boolean> {
    this.saveLocalData(data, userId);

    if (this.isSyncing) {
      this.pendingSyncData = { data, userId };
      return true;
    }

    this.isSyncing = true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) headers['x-user-id'] = userId;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = userId ? `/api/data?userId=${encodeURIComponent(userId)}` : '/api/data';
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      this.isSyncing = false;

      // If another save occurred during this sync, run it now
      if (this.pendingSyncData) {
        const next = this.pendingSyncData;
        this.pendingSyncData = null;
        return this.syncToServer(next.data, next.userId, token);
      }

      return res.ok;
    } catch (err) {
      this.isSyncing = false;
      return false;
    }
  }

  // Register a new shopkeeper with exact Shop Name, Mobile, and Password (No OTP)
  public static async register(
    shopName: string,
    mobile: string,
    password: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName, mobile, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        if (data.shopData) {
          this.saveLocalData(data.shopData, data.user.id);
        } else {
          const initial = generateCleanShopData({
            shopName: data.user.shopName || shopName,
            shopNameBn: data.user.shopName || shopName,
            ownerName: data.user.name || shopName,
            phone: data.user.phone || mobile,
            email: data.user.email || `${mobile}@shop.local`,
            receiptFooterMessage: `Thank you for visiting ${data.user.shopName || shopName}! Please visit again.`,
          });
          this.saveLocalData(initial, data.user.id);
        }
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: 'Network error during registration: ' + err.message };
    }
  }

  // Login using Mobile Number and Password only (No OTP)
  public static async login(
    mobile: string,
    password?: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        if (data.shopData) {
          this.saveLocalData(data.shopData, data.user.id);
        }
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Invalid mobile number or password' };
    } catch (err: any) {
      return { success: false, error: 'Network error during login: ' + err.message };
    }
  }

  public static getStoredUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  public static logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('radhamadhab_') || key.startsWith('shop_data_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      // ignore
    }
    this.localDataCache = {};
  }
}
