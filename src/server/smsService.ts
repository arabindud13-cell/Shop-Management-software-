import { SmsLogEntry, SmsSettings, UserProfile } from '../types';
import { getShopData, saveShopData } from './storage';

export interface SendSmsResult {
  success: boolean;
  gateway: string;
  messageId?: string;
  error?: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface OtpRecord {
  phone: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
  resendAfter: number;
  name?: string;
}

// In-memory OTP storage
const otpStore = new Map<string, OtpRecord>();

// Helper to normalize Indian phone number to 10 digits
export function normalizePhoneNumber(input: string): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits.slice(-10);
}

// Format for international E.164 (e.g. +919832100000)
export function formatE164(phone: string): string {
  const norm = normalizePhoneNumber(phone);
  return norm ? `+91${norm}` : '';
}

// Retrieve effective SMS settings combining shop data & process.env
export function getEffectiveSmsSettings(): SmsSettings {
  const shopData = getShopData();
  const dbSettings = shopData.shopSettings?.smsSettings || {
    smsEnabled: true,
    smsLanguage: 'both',
    gatewayProvider: 'fast2sms',
    senderId: 'RDMCTR',
  };

  return {
    smsEnabled: dbSettings.smsEnabled ?? true,
    smsLanguage: dbSettings.smsLanguage || 'both',
    gatewayProvider: (process.env.SMS_GATEWAY_PROVIDER as any) || dbSettings.gatewayProvider || 'fast2sms',
    senderId: dbSettings.senderId || 'RDMCTR',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || dbSettings.twilioAccountSid || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || dbSettings.twilioAuthToken || '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || dbSettings.twilioPhoneNumber || '',
    fast2smsApiKey: process.env.FAST2SMS_API_KEY || dbSettings.fast2smsApiKey || '',
    msg91AuthKey: process.env.MSG91_AUTH_KEY || dbSettings.msg91AuthKey || '',
    msg91TemplateId: process.env.MSG91_TEMPLATE_ID || dbSettings.msg91TemplateId || '',
  };
}

/**
 * Dispatch SMS through real gateway (Twilio, Fast2SMS, MSG91)
 */
export async function sendSmsDirect(
  phone: string,
  message: string,
  customSettings?: Partial<SmsSettings>
): Promise<SendSmsResult> {
  const cleanPhone = normalizePhoneNumber(phone);
  if (!cleanPhone || cleanPhone.length !== 10) {
    return {
      success: false,
      gateway: 'none',
      status: 'failed',
      error: `Invalid 10-digit mobile number: "${phone}"`,
    };
  }

  const settings: SmsSettings = {
    ...getEffectiveSmsSettings(),
    ...(customSettings || {}),
  };

  const provider = settings.gatewayProvider;

  // 1. FAST2SMS GATEWAY INTEGRATION
  if (provider === 'fast2sms') {
    const apiKey = settings.fast2smsApiKey?.trim();
    if (!apiKey) {
      return {
        success: false,
        gateway: 'Fast2SMS',
        status: 'failed',
        error: 'Fast2SMS API Key is not configured. Please enter your API key in Settings > SMS Gateway or set FAST2SMS_API_KEY.',
      };
    }

    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: message,
          language: /[\u0980-\u09FF]/.test(message) ? 'unicode' : 'english',
          numbers: cleanPhone,
        }),
      });

      const result = (await response.json()) as any;
      if (response.ok && (result.return === true || result.status_code === 200)) {
        return {
          success: true,
          gateway: 'Fast2SMS',
          messageId: result.request_id || `f2s-${Date.now()}`,
          status: 'delivered',
        };
      }

      return {
        success: false,
        gateway: 'Fast2SMS',
        status: 'failed',
        error: result.message || (Array.isArray(result.message) ? result.message.join(', ') : 'Fast2SMS API rejected request'),
      };
    } catch (err: any) {
      return {
        success: false,
        gateway: 'Fast2SMS',
        status: 'failed',
        error: `Fast2SMS network failure: ${err.message}`,
      };
    }
  }

  // 2. TWILIO GATEWAY INTEGRATION
  if (provider === 'twilio') {
    const sid = settings.twilioAccountSid?.trim();
    const token = settings.twilioAuthToken?.trim();
    const fromPhone = settings.twilioPhoneNumber?.trim();

    if (!sid || !token || !fromPhone) {
      return {
        success: false,
        gateway: 'Twilio',
        status: 'failed',
        error: 'Twilio credentials missing. Please set Account SID, Auth Token, and Twilio Phone Number in Settings > SMS Gateway or .env.',
      };
    }

    try {
      const e164To = formatE164(cleanPhone);
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      const basicAuth = Buffer.from(`${sid}:${token}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', e164To);
      params.append('From', fromPhone);
      params.append('Body', message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const result = (await response.json()) as any;
      if (response.ok && result.sid) {
        return {
          success: true,
          gateway: 'Twilio',
          messageId: result.sid,
          status: 'sent',
        };
      }

      return {
        success: false,
        gateway: 'Twilio',
        status: 'failed',
        error: result.message || `Twilio error code: ${result.code || response.status}`,
      };
    } catch (err: any) {
      return {
        success: false,
        gateway: 'Twilio',
        status: 'failed',
        error: `Twilio network failure: ${err.message}`,
      };
    }
  }

  // 3. MSG91 GATEWAY INTEGRATION
  if (provider === 'msg91') {
    const authKey = settings.msg91AuthKey?.trim();
    if (!authKey) {
      return {
        success: false,
        gateway: 'MSG91',
        status: 'failed',
        error: 'MSG91 Auth Key is not configured. Please enter your Auth Key in Settings > SMS Gateway or set MSG91_AUTH_KEY.',
      };
    }

    try {
      // MSG91 Send SMS API
      const response = await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flow_id: settings.msg91TemplateId || 'default',
          sender: settings.senderId || 'RDMCTR',
          mobiles: `91${cleanPhone}`,
          message: message,
        }),
      });

      const result = (await response.json()) as any;
      if (response.ok && (result.type === 'success' || result.status === 'success')) {
        return {
          success: true,
          gateway: 'MSG91',
          messageId: result.message_id || `msg91-${Date.now()}`,
          status: 'sent',
        };
      }

      return {
        success: false,
        gateway: 'MSG91',
        status: 'failed',
        error: result.message || 'MSG91 rejected request',
      };
    } catch (err: any) {
      return {
        success: false,
        gateway: 'MSG91',
        status: 'failed',
        error: `MSG91 network failure: ${err.message}`,
      };
    }
  }

  return {
    success: false,
    gateway: provider || 'Unknown',
    status: 'failed',
    error: `Unsupported gateway provider: ${provider}`,
  };
}

/**
 * Log SMS entry to persistent storage (shop_data.json)
 */
export function recordSmsLog(entry: Omit<SmsLogEntry, 'id' | 'createdAt'>): SmsLogEntry {
  const shopData = getShopData();
  const id = 'sms-log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const newLog: SmsLogEntry = {
    ...entry,
    id,
    createdAt: new Date().toISOString(),
  };

  const existingLogs = shopData.smsLogs || [];
  shopData.smsLogs = [newLog, ...existingLogs];
  saveShopData(shopData);
  return newLog;
}

/**
 * Update existing SMS log status
 */
export function updateSmsLog(logId: string, updates: Partial<SmsLogEntry>): SmsLogEntry | null {
  const shopData = getShopData();
  const existingLogs = shopData.smsLogs || [];
  const index = existingLogs.findIndex(l => l.id === logId);
  if (index === -1) return null;

  const updated: SmsLogEntry = {
    ...existingLogs[index],
    ...updates,
    retriedAt: new Date().toISOString(),
    retryCount: (existingLogs[index].retryCount || 0) + 1,
  };

  existingLogs[index] = updated;
  shopData.smsLogs = existingLogs;
  saveShopData(shopData);
  return updated;
}

// -------------------------------------------------------------
// 1. OTP-BASED USER REGISTRATION LOGIC
// -------------------------------------------------------------

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 45 * 1000; // 45 seconds cooldown
const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * Generate 6-digit numeric OTP and send via SMS to user
 */
export async function sendRegistrationOtp(phone: string, name?: string): Promise<{
  success: boolean;
  message: string;
  resendCooldown?: number;
  logId?: string;
  error?: string;
}> {
  const cleanPhone = normalizePhoneNumber(phone);
  if (!cleanPhone || cleanPhone.length !== 10) {
    return {
      success: false,
      message: 'Invalid mobile number. Please enter a valid 10-digit Indian phone number.',
      error: 'INVALID_PHONE',
    };
  }

  const shopData = getShopData();

  // Prevent duplicate registration using same mobile number
  const existingUser = (shopData.users || []).find(
    u => u.phone && normalizePhoneNumber(u.phone) === cleanPhone
  );

  if (existingUser) {
    return {
      success: false,
      message: `Mobile number ${cleanPhone} is already registered to user "${existingUser.name}". Please sign in instead.`,
      error: 'DUPLICATE_MOBILE',
    };
  }

  // Check resend cooldown
  const existingOtp = otpStore.get(cleanPhone);
  const now = Date.now();

  if (existingOtp && now < existingOtp.resendAfter) {
    const remainingSeconds = Math.ceil((existingOtp.resendAfter - now) / 1000);
    return {
      success: false,
      message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
      resendCooldown: remainingSeconds,
      error: 'RESEND_COOLDOWN',
    };
  }

  // Generate clean 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(cleanPhone, {
    phone: cleanPhone,
    otp: otpCode,
    expiresAt: now + OTP_EXPIRY_MS,
    resendAfter: now + OTP_RESEND_COOLDOWN_MS,
    attempts: 0,
    createdAt: now,
    name: name?.trim(),
  });

  const smsSettings = getEffectiveSmsSettings();
  const shopName = shopData.shopSettings?.shopName || 'Radha Madhab Online Center';

  // Format bilingual message
  let message = '';
  if (smsSettings.smsLanguage === 'bn') {
    message = `${shopName} রেজিস্ট্রেশনের জন্য আপনার ওটিপি (OTP) হলো ${otpCode}। মেয়াদ ৫ মিনিট। কাউকে এটি শেয়ার করবেন না।`;
  } else if (smsSettings.smsLanguage === 'en') {
    message = `Your verification OTP for ${shopName} registration is ${otpCode}. Valid for 5 minutes. Do not share with anyone.`;
  } else {
    // Both
    message = `Your verification OTP for ${shopName} registration is ${otpCode}. Valid for 5 mins.\n\n${shopName} রেজিস্ট্রেশন ভেরিফিকেশন ওটিপি: ${otpCode} (মেয়াদ ৫ মিনিট)`;
  }

  // Send real SMS through gateway
  const sendRes = await sendSmsDirect(cleanPhone, message, smsSettings);

  // Record in SMS Log
  const logEntry = recordSmsLog({
    recipientPhone: cleanPhone,
    recipientName: name?.trim() || 'New User Registration',
    type: 'otp_registration',
    message: message,
    status: sendRes.status,
    gateway: sendRes.gateway,
    error: sendRes.error,
  });

  return {
    success: sendRes.success,
    message: sendRes.success
      ? `Verification OTP sent to +91 ${cleanPhone}. Please verify within 5 minutes.`
      : `Failed to deliver OTP SMS via ${sendRes.gateway}: ${sendRes.error}`,
    resendCooldown: 45,
    logId: logEntry.id,
    error: sendRes.error,
  };
}

/**
 * Verify OTP and create user account
 */
export async function verifyRegistrationOtp(
  phone: string,
  otp: string,
  name?: string,
  _password?: string
): Promise<{
  success: boolean;
  message: string;
  user?: UserProfile;
  token?: string;
  error?: string;
}> {
  const cleanPhone = normalizePhoneNumber(phone);
  const cleanOtp = otp?.trim();

  if (!cleanPhone || cleanPhone.length !== 10) {
    return {
      success: false,
      message: 'Invalid mobile number.',
      error: 'INVALID_PHONE',
    };
  }

  const record = otpStore.get(cleanPhone);
  if (!record) {
    return {
      success: false,
      message: 'No active OTP found for this number. Please click "Resend OTP".',
      error: 'OTP_NOT_FOUND',
    };
  }

  const now = Date.now();
  if (now > record.expiresAt) {
    otpStore.delete(cleanPhone);
    return {
      success: false,
      message: 'OTP has expired (validity is 5 minutes). Please request a new OTP.',
      error: 'OTP_EXPIRED',
    };
  }

  record.attempts += 1;
  if (record.attempts > MAX_VERIFICATION_ATTEMPTS) {
    otpStore.delete(cleanPhone);
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. Please request a new OTP.',
      error: 'MAX_ATTEMPTS_EXCEEDED',
    };
  }

  if (record.otp !== cleanOtp) {
    const remaining = MAX_VERIFICATION_ATTEMPTS - record.attempts;
    return {
      success: false,
      message: `Incorrect OTP. ${remaining} attempt(s) remaining.`,
      error: 'INVALID_OTP',
    };
  }

  // OTP is correct! Clear from memory store
  otpStore.delete(cleanPhone);

  // Create new User Account in shop_data
  const shopData = getShopData();
  const userName = (name || record.name || `User ${cleanPhone.slice(-4)}`).trim();
  const userEmail = `${cleanPhone}@radhamadhab.center`;

  const newUser: UserProfile = {
    id: 'user-' + Date.now(),
    name: userName,
    shopName: shopData.shopSettings?.shopName || 'Radhamadhab Online Center',
    email: userEmail,
    phone: cleanPhone,
    role: (!shopData.users || shopData.users.length === 0) ? 'owner' : 'staff',
    createdAt: new Date().toISOString(),
  };

  shopData.users = [...(shopData.users || []), newUser];
  saveShopData(shopData);

  return {
    success: true,
    message: 'Mobile verification successful! Welcome to Radha Madhab Online Center.',
    user: newUser,
    token: 'session-' + Date.now(),
  };
}

// -------------------------------------------------------------
// 2. AUTOMATIC KHATA TRANSACTION SMS REMINDER SYSTEM
// -------------------------------------------------------------

export interface KhataSmsParams {
  entryId: string;
  partyId: string;
  partyName: string;
  partyMobile: string;
  type: 'you_gave' | 'you_got';
  amount: number;
  currentBalance: number; // calculated remaining balance
  date?: string;
  note?: string;
}

/**
 * Format SMS message as strictly instructed by user:
 * - Payment Received:
 *   "Dear Customer, we have received your payment of ₹500. Your remaining due balance is ₹1,000. Thank you for your payment. – Radha Madhab Online Center"
 * - Payment Given:
 *   "Dear Customer, ₹500 has been added to your account. Your updated balance is ₹1,500. Please check your account details. – Radha Madhab Online Center"
 * Support Bengali & English.
 */
export function formatKhataTransactionSms(params: KhataSmsParams, language: 'en' | 'bn' | 'both' = 'both'): {
  text: string;
  subject: string;
} {
  const { partyName, type, amount, currentBalance } = params;
  const formattedAmount = `₹${Math.round(amount).toLocaleString('en-IN')}`;
  const formattedBalance = `₹${Math.round(Math.abs(currentBalance)).toLocaleString('en-IN')}`;
  const customerName = partyName || 'Customer';

  if (type === 'you_got') {
    // Payment Received (Customer paid shop)
    const enText = `Dear ${customerName}, we have received your payment of ${formattedAmount}. Your remaining due balance is ${formattedBalance}. Thank you for your payment. – Radha Madhab Online Center`;
    const bnText = `প্রিয় ${customerName}, আমরা আপনার ${formattedAmount} পেমেন্ট গ্রহণ করেছি। আপনার অবশিষ্ট বকেয়া ${formattedBalance}। আপনার পেমেন্টের জন্য ধন্যবাদ। – রাধা মাধব অনলাইন সেন্টার`;

    let text = enText;
    if (language === 'bn') text = bnText;
    else if (language === 'both') text = `${enText}\n\n${bnText}`;

    return {
      subject: `Payment Received: ${formattedAmount}`,
      text,
    };
  } else {
    // Payment Given (Credit added / Udhar given to customer)
    const enText = `Dear ${customerName}, ${formattedAmount} has been added to your account. Your updated balance is ${formattedBalance}. Please check your account details. – Radha Madhab Online Center`;
    const bnText = `প্রিয় ${customerName}, আপনার অ্যাকাউন্টে ${formattedAmount} যোগ করা হয়েছে। আপনার বর্তমান বকেয়া ${formattedBalance}। অনুগ্রহ করে আপনার অ্যাকাউন্ট বিবরণী চেক করুন। – রাধা মাধব অনলাইন সেন্টার`;

    let text = enText;
    if (language === 'bn') text = bnText;
    else if (language === 'both') text = `${enText}\n\n${bnText}`;

    return {
      subject: `Account Updated: ${formattedAmount}`,
      text,
    };
  }
}

/**
 * Automatically send SMS when Khata transaction is recorded
 * Enforces:
 * - Only send after transaction saved
 * - Idempotency: no duplicate SMS for same transaction
 * - Enable/disable SMS notifications toggle
 * - Logs to SMS history with retry capability
 */
export async function sendKhataTransactionSms(params: KhataSmsParams): Promise<{
  success: boolean;
  skipped?: boolean;
  reason?: string;
  log?: SmsLogEntry;
  error?: string;
}> {
  const { entryId, partyMobile, partyName, type, amount, currentBalance } = params;
  const cleanPhone = normalizePhoneNumber(partyMobile);

  if (!cleanPhone || cleanPhone.length !== 10) {
    return {
      success: false,
      skipped: true,
      reason: `Customer phone number "${partyMobile}" is invalid or missing.`,
    };
  }

  const shopData = getShopData();
  const smsSettings = getEffectiveSmsSettings();

  // 1. Check if owner disabled SMS notifications
  if (!smsSettings.smsEnabled) {
    return {
      success: false,
      skipped: true,
      reason: 'Automatic SMS notifications are disabled in Settings.',
    };
  }

  // 2. Idempotency Check: Do not send duplicate SMS for the same transaction entry
  const existingLog = (shopData.smsLogs || []).find(
    l => l.transactionId === entryId && (l.status === 'sent' || l.status === 'delivered')
  );

  if (existingLog) {
    return {
      success: true,
      skipped: true,
      reason: 'SMS already sent for this transaction entry.',
      log: existingLog,
    };
  }

  // 3. Format message according to language settings
  const { text } = formatKhataTransactionSms(params, smsSettings.smsLanguage);

  // 4. Send real SMS via gateway
  const sendRes = await sendSmsDirect(cleanPhone, text, smsSettings);

  // 5. Record in persistent SMS History
  const logType = type === 'you_got' ? 'payment_received' : 'payment_given';
  const logEntry = recordSmsLog({
    transactionId: entryId,
    partyId: params.partyId,
    recipientName: partyName,
    recipientPhone: cleanPhone,
    type: logType,
    amount,
    balance: currentBalance,
    message: text,
    status: sendRes.status,
    gateway: sendRes.gateway,
    error: sendRes.error,
  });

  return {
    success: sendRes.success,
    log: logEntry,
    error: sendRes.error,
  };
}

/**
 * Retry a failed SMS from history
 */
export async function retrySmsDelivery(logId: string): Promise<{
  success: boolean;
  log?: SmsLogEntry;
  error?: string;
}> {
  const shopData = getShopData();
  const log = (shopData.smsLogs || []).find(l => l.id === logId);

  if (!log) {
    return {
      success: false,
      error: `SMS log entry "${logId}" not found.`,
    };
  }

  const settings = getEffectiveSmsSettings();
  const sendRes = await sendSmsDirect(log.recipientPhone, log.message, settings);

  const updatedLog = updateSmsLog(logId, {
    status: sendRes.status,
    gateway: sendRes.gateway,
    error: sendRes.error || undefined,
  });

  return {
    success: sendRes.success,
    log: updatedLog || log,
    error: sendRes.error,
  };
}
