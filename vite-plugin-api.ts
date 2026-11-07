import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
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

export function shopApiPlugin(): Plugin {
  return {
    name: 'shop-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;

        // Dedicated ZIP Download Route
        if ((req.method === 'GET' || req.method === 'HEAD') && pathname === '/api/download-project-zip') {
          try {
            const scriptPath = path.resolve(process.cwd(), 'scripts', 'create_project_zip.py');
            const zipPath = path.resolve(process.cwd(), 'public', 'radhamadhab-online-center-full-website.zip');
            
            // Re-generate fresh zip if script exists
            if (fs.existsSync(scriptPath)) {
              try {
                execSync('python3 scripts/create_project_zip.py', { cwd: process.cwd(), stdio: 'ignore' });
              } catch (e) {
                console.warn('Zip script generation warning:', e);
              }
            }

            if (fs.existsSync(zipPath)) {
              const fileBuffer = fs.readFileSync(zipPath);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/zip');
              res.setHeader('Content-Disposition', 'attachment; filename="radhamadhab-online-center-full-website.zip"');
              res.setHeader('Content-Length', fileBuffer.length.toString());
              res.end(fileBuffer);
              return;
            } else {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Zip file not found' }));
              return;
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to generate zip: ' + err.message }));
            return;
          }
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // Helper to parse JSON body
        const readBody = (callback: (body: any) => void) => {
          let data = '';
          req.on('data', chunk => {
            data += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = data ? JSON.parse(data) : {};
              callback(parsed);
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
          });
        };

        // Helper to extract userId from headers, query, or body
        const extractUserId = (body?: any): string | undefined => {
          const queryUser = url.searchParams.get('userId');
          if (queryUser) return queryUser;
          const headerUser = req.headers['x-user-id'];
          if (typeof headerUser === 'string' && headerUser) return headerUser;
          const auth = req.headers['authorization'];
          if (typeof auth === 'string' && auth.startsWith('Bearer token_')) {
            const raw = auth.replace('Bearer token_', '');
            const parts = raw.split('_');
            if (parts.length > 0) return parts[0];
          }
          if (body?.userId) return body.userId;
          return undefined;
        };

        // 1. GET /api/data (Per-user private shop data)
        if (req.method === 'GET' && pathname === '/api/data') {
          const userId = extractUserId();
          const shopData = getShopData(userId);
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, data: shopData }));
          return;
        }

        // 2. POST /api/data (Per-user sync)
        if (req.method === 'POST' && pathname === '/api/data') {
          readBody((body: { data: AppDataPayload; userId?: string }) => {
            if (!body || !body.data) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing data payload' }));
              return;
            }
            const userId = extractUserId(body);
            saveShopData(body.data, userId);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, lastUpdated: new Date().toISOString() }));
          });
          return;
        }

        // 3. POST /api/auth/register (New shopkeeper registration: Shop Name, Mobile, Password - NO OTP)
        if (req.method === 'POST' && pathname === '/api/auth/register') {
          readBody((body: { shopName?: string; mobile?: string; password?: string }) => {
            if (!body?.shopName || !body?.mobile || !body?.password) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Shop Name, Mobile Number, and Password are required.' }));
              return;
            }
            const result = registerShopUser(body.shopName, body.mobile, body.password);
            res.statusCode = result.success ? 200 : 400;
            res.end(JSON.stringify(result));
          });
          return;
        }

        // 4. POST /api/auth/login (Login using Mobile Number and Password only - NO OTP)
        if (req.method === 'POST' && pathname === '/api/auth/login') {
          readBody((body: { mobile?: string; password?: string; email?: string }) => {
            const mobileInput = body.mobile || body.email;
            if (!mobileInput || !body.password) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Mobile number and password are required.' }));
              return;
            }
            const result = loginShopUser(mobileInput, body.password);
            res.statusCode = result.success ? 200 : 400;
            res.end(JSON.stringify(result));
          });
          return;
        }

        // 4. GET /api/status
        if (req.method === 'GET' && pathname === '/api/status') {
          const current = getShopData();
          res.statusCode = 200;
          res.end(JSON.stringify({
            status: 'online',
            shopName: current.shopSettings.shopName,
            lastUpdated: current.lastUpdated,
            totalTransactions: current.transactions.length,
          }));
          return;
        }

        // 5. POST /api/backup/import
        if (req.method === 'POST' && pathname === '/api/backup/import') {
          readBody((body: { backup: AppDataPayload }) => {
            if (!body || !body.backup || !body.backup.shopSettings) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid backup structure' }));
              return;
            }
            saveShopData(body.backup);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, message: 'Backup successfully restored' }));
          });
          return;
        }

        // 6. POST /api/reset
        if (req.method === 'POST' && pathname === '/api/reset') {
          readBody((body: { mode?: 'clean' | 'demo' }) => {
            const current = getShopData();
            const resetData = body?.mode === 'demo'
              ? generateInitialData()
              : generateCleanShopData(current?.shopSettings);
            saveShopData(resetData);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, data: resetData }));
          });
          return;
        }

        // 7. POST /api/auth/send-registration-otp
        if (req.method === 'POST' && pathname === '/api/auth/send-registration-otp') {
          readBody(async (body: { phone?: string; name?: string }) => {
            if (!body?.phone) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Mobile number is required' }));
              return;
            }
            try {
              const result = await sendRegistrationOtp(body.phone, body.name);
              res.statusCode = result.success ? 200 : (result.error === 'RESEND_COOLDOWN' ? 429 : 400);
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // 8. POST /api/auth/verify-registration-otp
        if (req.method === 'POST' && pathname === '/api/auth/verify-registration-otp') {
          readBody(async (body: { phone?: string; otp?: string; name?: string; password?: string }) => {
            if (!body?.phone || !body?.otp) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Phone and OTP are required' }));
              return;
            }
            try {
              const result = await verifyRegistrationOtp(body.phone, body.otp, body.name, body.password);
              res.statusCode = result.success ? 200 : 400;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // 9. POST /api/sms/send-khata-transaction
        if (req.method === 'POST' && pathname === '/api/sms/send-khata-transaction') {
          readBody(async (body: any) => {
            if (!body?.entryId || !body?.partyMobile) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Missing required Khata transaction details' }));
              return;
            }
            try {
              const result = await sendKhataTransactionSms(body);
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // 10. GET /api/sms/logs
        if (req.method === 'GET' && pathname === '/api/sms/logs') {
          const current = getShopData();
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, logs: current.smsLogs || [] }));
          return;
        }

        // 11. POST /api/sms/retry
        if (req.method === 'POST' && pathname === '/api/sms/retry') {
          readBody(async (body: { logId?: string }) => {
            if (!body?.logId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Missing logId' }));
              return;
            }
            try {
              const result = await retrySmsDelivery(body.logId);
              res.statusCode = result.success ? 200 : 400;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // 12. POST /api/sms/test
        if (req.method === 'POST' && pathname === '/api/sms/test') {
          readBody(async (body: { phone?: string; message?: string; customSettings?: Partial<SmsSettings> }) => {
            if (!body?.phone || !body?.message) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Phone and test message are required' }));
              return;
            }
            try {
              const sendRes = await sendSmsDirect(body.phone, body.message, body.customSettings);
              const logEntry = recordSmsLog({
                recipientName: 'Test SMS Recipient',
                recipientPhone: body.phone,
                type: 'test',
                message: body.message,
                status: sendRes.status,
                gateway: sendRes.gateway,
                error: sendRes.error,
              });
              res.statusCode = sendRes.success ? 200 : 400;
              res.end(JSON.stringify({ ...sendRes, log: logEntry }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // 13. POST /api/sms/settings
        if (req.method === 'POST' && pathname === '/api/sms/settings') {
          readBody((body: { smsSettings?: SmsSettings }) => {
            if (!body?.smsSettings) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing smsSettings' }));
              return;
            }
            const current = getShopData();
            current.shopSettings = {
              ...current.shopSettings,
              smsSettings: body.smsSettings,
            };
            saveShopData(current);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, smsSettings: current.shopSettings.smsSettings }));
          });
          return;
        }

        // 14. POST /api/sim-sms/create (Website: shopkeeper confirms customer due entry)
        if (req.method === 'POST' && pathname === '/api/sim-sms/create') {
          readBody((body: any) => {
            const uid = extractUserId(body);
            if (!body?.customerName || !body?.customerMobile || body?.dueAmount === undefined) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Customer Name, Customer Mobile, and Due Amount are required' }));
              return;
            }
            try {
              const result = createSimSmsRequest({
                userId: uid,
                partyId: body.partyId,
                entryId: body.entryId,
                customerName: body.customerName,
                customerMobile: body.customerMobile,
                shopName: body.shopName,
                dueAmount: Number(body.dueAmount) || 0,
                remainingBalance: body.remainingBalance !== undefined ? Number(body.remainingBalance) : undefined,
                transactionType: body.transactionType || 'Due',
                dateTime: body.dateTime || new Date().toISOString(),
                language: body.language || 'bn',
                message: body.message,
              });
              res.statusCode = result.success ? 200 : 400;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // 15. GET /api/sim-sms/pending (Android App polls or receives pending SMS requests)
        if (req.method === 'GET' && pathname === '/api/sim-sms/pending') {
          const uid = extractUserId();
          const requests = getSimSmsRequests(uid);
          const pending = requests.filter(r => r.status === 'Pending' || r.status === 'Approved');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, count: pending.length, requests: pending }));
          return;
        }

        // 16. GET /api/sim-sms/all (Website & Android App: Full history)
        if (req.method === 'GET' && pathname === '/api/sim-sms/all') {
          const uid = extractUserId();
          const requests = getSimSmsRequests(uid);
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, count: requests.length, requests }));
          return;
        }

        // 17. POST /api/sim-sms/status (Android App updates status: Approved, Sending, Sent, Failed)
        if (req.method === 'POST' && pathname === '/api/sim-sms/status') {
          readBody((body: any) => {
            const uid = extractUserId(body);
            if (!body?.requestId || !body?.status) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'requestId and status are required' }));
              return;
            }
            try {
              const result = updateSimSmsStatus({
                requestId: body.requestId,
                status: body.status,
                userId: uid,
                sentAt: body.sentAt,
                failedReason: body.failedReason,
                simSlot: body.simSlot,
                editedMessage: body.editedMessage,
              });
              res.statusCode = result.success ? 200 : 400;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // 18. POST /api/sim-sms/delete
        if (req.method === 'POST' && pathname === '/api/sim-sms/delete') {
          readBody((body: { requestId?: string }) => {
            const uid = extractUserId(body);
            if (!body?.requestId) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'requestId is required' }));
              return;
            }
            const deleted = deleteSimSmsRequest(body.requestId, uid);
            res.statusCode = 200;
            res.end(JSON.stringify({ success: deleted }));
          });
          return;
        }

        // 19. GET /api/download-android-project (Download full Android Studio Kotlin source code)
        if ((req.method === 'GET' || req.method === 'HEAD') && pathname === '/api/download-android-project') {
          try {
            const zipPath = path.resolve(process.cwd(), 'public', 'radhamadhab-sms-sender-android-project.zip');
            if (fs.existsSync(zipPath)) {
              const fileBuffer = fs.readFileSync(zipPath);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/zip');
              res.setHeader('Content-Disposition', 'attachment; filename="radhamadhab-sms-sender-android-project.zip"');
              res.setHeader('Content-Length', fileBuffer.length.toString());
              res.end(fileBuffer);
              return;
            } else {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Android project zip not found' }));
              return;
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to download Android project: ' + err.message }));
            return;
          }
        }

        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'API route not found' }));
      });
    },
  };
}
