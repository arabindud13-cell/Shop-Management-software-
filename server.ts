import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  getShopData,
  saveShopData,
  registerShopUser,
  loginShopUser,
  createSimSmsRequest,
  getSimSmsRequests,
  updateSimSmsStatus,
  deleteSimSmsRequest,
  formatSimSmsMessage,
} from './src/server/storage';
import { generateInitialData, generateCleanShopData } from './src/data/defaults';
import { AppDataPayload, SmsSettings } from './src/types';
import {
  sendRegistrationOtp,
  verifyRegistrationOtp,
  sendKhataTransactionSms,
  retrySmsDelivery,
  sendSmsDirect,
  recordSmsLog,
} from './src/server/smsService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Dedicated ZIP Download Route
app.get('/api/download-project-zip', (_req, res) => {
  try {
    const scriptPath = path.resolve(__dirname, 'scripts', 'create_project_zip.py');
    const zipPath = path.resolve(__dirname, 'public', 'radhamadhab-online-center-full-website.zip');
    
    if (fs.existsSync(scriptPath)) {
      try {
        execSync('python3 scripts/create_project_zip.py', { cwd: __dirname, stdio: 'ignore' });
      } catch (e) {
        console.warn('Zip script generation warning:', e);
      }
    }

    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'radhamadhab-online-center-full-website.zip');
    } else {
      res.status(404).json({ error: 'Zip file not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate zip: ' + err.message });
  }
});

// Also serve direct public zip
app.use(express.static(path.resolve(__dirname, 'public')));

// Helper to extract userId from request
const extractUserId = (req: express.Request): string | undefined => {
  const queryUser = req.query.userId as string | undefined;
  if (queryUser) return queryUser;
  const headerUser = req.headers['x-user-id'] as string | undefined;
  if (headerUser) return headerUser;
  const auth = req.headers['authorization'];
  if (typeof auth === 'string' && auth.startsWith('Bearer token_')) {
    const raw = auth.replace('Bearer token_', '');
    const parts = raw.split('_');
    if (parts.length > 0) return parts[0];
  }
  if (req.body?.userId) return req.body.userId;
  return undefined;
};

// API Routes
app.get('/api/data', (req, res) => {
  const userId = extractUserId(req);
  const data = getShopData(userId);
  res.json({ success: true, data });
});

app.post('/api/data', (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Missing data payload' });
  }
  const userId = extractUserId(req);
  saveShopData(data, userId);
  res.json({ success: true, lastUpdated: new Date().toISOString() });
});

// New shopkeeper registration: Shop Name, Mobile, Password - NO OTP
app.post('/api/auth/register', (req, res) => {
  const { shopName, mobile, password } = req.body;
  if (!shopName || !mobile || !password) {
    return res.status(400).json({ success: false, error: 'Shop Name, Mobile Number, and Password are required.' });
  }
  const result = registerShopUser(shopName, mobile, password);
  return res.status(result.success ? 200 : 400).json(result);
});

// Login using Mobile Number and Password only - NO OTP
app.post('/api/auth/login', (req, res) => {
  const { mobile, password, email } = req.body;
  const mobileInput = mobile || email;
  if (!mobileInput || !password) {
    return res.status(400).json({ success: false, error: 'Mobile number and password are required.' });
  }
  const result = loginShopUser(mobileInput, password);
  return res.status(result.success ? 200 : 400).json(result);
});

app.post('/api/backup/import', (req, res) => {
  const { backup } = req.body;
  if (!backup || !backup.shopSettings) {
    return res.status(400).json({ error: 'Invalid backup' });
  }
  saveShopData(backup);
  res.json({ success: true, message: 'Backup restored successfully' });
});

app.post('/api/reset', (req, res) => {
  const { mode } = req.body || {};
  const current = getShopData();
  const resetData = mode === 'demo' ? generateInitialData() : generateCleanShopData(current?.shopSettings);
  saveShopData(resetData);
  res.json({ success: true, data: resetData });
});

app.get('/api/status', (_req, res) => {
  const current = getShopData();
  res.json({
    status: 'online',
    shopName: current.shopSettings.shopName,
    lastUpdated: current.lastUpdated,
    totalTransactions: current.transactions.length,
  });
});

app.post('/api/auth/send-registration-otp', async (req, res) => {
  const { phone, name } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Mobile number is required' });
  }
  try {
    const result = await sendRegistrationOtp(phone, name);
    return res.status(result.success ? 200 : (result.error === 'RESEND_COOLDOWN' ? 429 : 400)).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/verify-registration-otp', async (req, res) => {
  const { phone, otp, name, password } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, error: 'Phone and OTP are required' });
  }
  try {
    const result = await verifyRegistrationOtp(phone, otp, name, password);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sms/send-khata-transaction', async (req, res) => {
  const body = req.body;
  if (!body?.entryId || !body?.partyMobile) {
    return res.status(400).json({ success: false, error: 'Missing required Khata transaction details' });
  }
  try {
    const result = await sendKhataTransactionSms(body);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/sms/logs', (_req, res) => {
  const current = getShopData();
  res.json({ success: true, logs: current.smsLogs || [] });
});

app.post('/api/sms/retry', async (req, res) => {
  const { logId } = req.body;
  if (!logId) {
    return res.status(400).json({ success: false, error: 'Missing logId' });
  }
  try {
    const result = await retrySmsDelivery(logId);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sms/test', async (req, res) => {
  const { phone, message, customSettings } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ success: false, error: 'Phone and test message are required' });
  }
  try {
    const sendRes = await sendSmsDirect(phone, message, customSettings);
    const logEntry = recordSmsLog({
      recipientName: 'Test SMS Recipient',
      recipientPhone: phone,
      type: 'test',
      message,
      status: sendRes.status,
      gateway: sendRes.gateway,
      error: sendRes.error,
    });
    return res.status(sendRes.success ? 200 : 400).json({ ...sendRes, log: logEntry });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sms/settings', (req, res) => {
  const { smsSettings } = req.body;
  if (!smsSettings) {
    return res.status(400).json({ error: 'Missing smsSettings' });
  }
  const current = getShopData();
  current.shopSettings = {
    ...current.shopSettings,
    smsSettings,
  };
  saveShopData(current);
  res.json({ success: true, smsSettings: current.shopSettings.smsSettings });
});

// SIM SMS: Website creates pending SMS request when shopkeeper clicks Confirm Due
app.post('/api/sim-sms/create', (req, res) => {
  const uid = extractUserId(req);
  const { partyId, entryId, customerName, customerMobile, shopName, dueAmount, remainingBalance, transactionType, dateTime, language, message } = req.body;
  if (!customerName || !customerMobile || dueAmount === undefined) {
    return res.status(400).json({ success: false, error: 'Customer Name, Customer Mobile, and Due Amount are required' });
  }
  try {
    const result = createSimSmsRequest({
      userId: uid,
      partyId,
      entryId,
      customerName,
      customerMobile,
      shopName,
      dueAmount: Number(dueAmount) || 0,
      remainingBalance: remainingBalance !== undefined ? Number(remainingBalance) : undefined,
      transactionType: transactionType || 'Due',
      dateTime: dateTime || new Date().toISOString(),
      language: language || 'bn',
      message,
    });
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// SIM SMS: Android companion polls or receives pending requests
app.get('/api/sim-sms/pending', (req, res) => {
  const uid = extractUserId(req);
  const requests = getSimSmsRequests(uid);
  const pending = requests.filter(r => r.status === 'Pending' || r.status === 'Approved');
  res.json({ success: true, count: pending.length, requests: pending });
});

// SIM SMS: All requests / history
app.get('/api/sim-sms/all', (req, res) => {
  const uid = extractUserId(req);
  const requests = getSimSmsRequests(uid);
  res.json({ success: true, count: requests.length, requests });
});

// SIM SMS: Android updates status
app.post('/api/sim-sms/status', (req, res) => {
  const uid = extractUserId(req);
  const { requestId, status, sentAt, failedReason, simSlot, editedMessage } = req.body;
  if (!requestId || !status) {
    return res.status(400).json({ success: false, error: 'requestId and status are required' });
  }
  try {
    const result = updateSimSmsStatus({
      requestId,
      status,
      userId: uid,
      sentAt,
      failedReason,
      simSlot,
      editedMessage,
    });
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// SIM SMS: Delete request
app.post('/api/sim-sms/delete', (req, res) => {
  const uid = extractUserId(req);
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ success: false, error: 'requestId is required' });
  }
  const deleted = deleteSimSmsRequest(requestId, uid);
  res.json({ success: deleted });
});

// Download full Android Studio Project ZIP
app.get('/api/download-android-project', (_req, res) => {
  try {
    const zipPath = path.resolve(__dirname, 'public', 'radhamadhab-sms-sender-android-project.zip');
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'radhamadhab-sms-sender-android-project.zip');
    } else {
      res.status(404).json({ error: 'Android project zip not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to download Android project: ' + err.message });
  }
});

// Serve frontend assets
const distDir = path.resolve(__dirname, 'dist');
app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Radhamadhab Online Center server running on port ${PORT}`);
});
