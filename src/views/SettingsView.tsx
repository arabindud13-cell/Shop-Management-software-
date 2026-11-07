import React, { useState, useRef } from 'react';
import {
  Settings,
  Store,
  Tags,
  Database,
  Download,
  Upload,
  LogOut,
  Check,
  Plus,
  Trash2,
  FileSpreadsheet,
  Languages,
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  X,
  Loader2,
  Sun,
  Moon,
  History,
  Receipt,
  FolderArchive,
  FileCode2,
  PackageCheck,
  Phone,
  MessageSquare,
  KeyRound,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Filter,
  Eye,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { exportDataAsJSON, exportTransactionsAsCSV, parseBackupFile } from '../lib/backup';
import { ApiClient } from '../lib/apiClient';
import { AppDataPayload } from '../types';

export const SettingsView: React.FC = () => {
  const {
    shopSettings,
    updateShopSettings,
    categories,
    addCategory,
    deleteCategory,
    transactions,
    receipts,
    smsLogs,
    retrySms,
    updateSmsSettings,
    restoreBackup,
    resetShopData,
    openReceiptHistoryModal,
    openGenerateReceiptModal,
  } = useShop();

  const { user, logout, updateProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme, toggleTheme } = useTheme();

  // Settings Form States
  const [shopName, setShopName] = useState(shopSettings.shopName || user?.shopName || '');
  const [shopNameBn, setShopNameBn] = useState(shopSettings.shopNameBn || user?.shopName || '');
  const [ownerName, setOwnerName] = useState(shopSettings.ownerName || user?.name || user?.shopName || '');
  const [phone, setPhone] = useState(shopSettings.phone || user?.phone || '');
  const [email, setEmail] = useState(shopSettings.email || user?.email || '');
  const [address, setAddress] = useState(shopSettings.address || '');
  const [gstinOrReg, setGstinOrReg] = useState(shopSettings.gstinOrReg || '');
  const [receiptFooter, setReceiptFooter] = useState(shopSettings.receiptFooterMessage || '');
  const [upiId, setUpiId] = useState(shopSettings.upiId || '');

  // Automatically update form fields whenever shopSettings or logged-in user changes (e.g. after registration)
  React.useEffect(() => {
    const activeName = shopSettings.shopName || user?.shopName || '';
    setShopName(activeName);
    setShopNameBn(shopSettings.shopNameBn || activeName);
    setOwnerName(shopSettings.ownerName || user?.name || activeName);
    setPhone(shopSettings.phone || user?.phone || '');
    setEmail(shopSettings.email || user?.email || (user?.phone ? `${user.phone}@shop.local` : ''));
    setAddress(shopSettings.address || '');
    setGstinOrReg(shopSettings.gstinOrReg || '');
    setReceiptFooter(
      shopSettings.receiptFooterMessage || (activeName ? `Thank you for visiting ${activeName}! Please visit again.` : '')
    );
    setUpiId(shopSettings.upiId || '');
  }, [shopSettings, user?.shopName, user?.phone, user?.name, user?.email]);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameBn, setNewCatNameBn] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  // Notifications
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [backupNotice, setBackupNotice] = useState('');
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetMode, setResetMode] = useState<'clean' | 'demo'>('clean');
  const [isResetting, setIsResetting] = useState(false);

  // Restore Backup Modal State
  const [pendingRestoreData, setPendingRestoreData] = useState<AppDataPayload | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Category inline deletion
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // SMS Settings States
  const currentSmsConfig = shopSettings.smsSettings || {
    smsEnabled: true,
    smsLanguage: 'both',
    gatewayProvider: 'fast2sms',
    senderId: 'RDMCTR',
  };

  const [smsEnabled, setSmsEnabled] = useState(currentSmsConfig.smsEnabled ?? true);
  const [smsLanguage, setSmsLanguage] = useState<'en' | 'bn' | 'both'>(currentSmsConfig.smsLanguage || 'both');
  const [gatewayProvider, setGatewayProvider] = useState<'fast2sms' | 'twilio' | 'msg91'>(
    currentSmsConfig.gatewayProvider || 'fast2sms'
  );
  const [fast2smsApiKey, setFast2smsApiKey] = useState(currentSmsConfig.fast2smsApiKey || '');
  const [twilioAccountSid, setTwilioAccountSid] = useState(currentSmsConfig.twilioAccountSid || '');
  const [twilioAuthToken, setTwilioAuthToken] = useState(currentSmsConfig.twilioAuthToken || '');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState(currentSmsConfig.twilioPhoneNumber || '');
  const [msg91AuthKey, setMsg91AuthKey] = useState(currentSmsConfig.msg91AuthKey || '');
  const [senderId, setSenderId] = useState(currentSmsConfig.senderId || 'RDMCTR');
  const [smsSavedSuccess, setSmsSavedSuccess] = useState(false);

  // Test SMS state
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Radha Madhab Online Center: Test SMS gateway connection successful.');
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; gateway?: string } | null>(null);

  // SMS History Filter & Action States
  const [smsHistoryFilter, setSmsHistoryFilter] = useState<
    'all' | 'delivered' | 'failed' | 'payment_received' | 'payment_given' | 'otp_registration'
  >('all');
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [selectedLogDetail, setSelectedLogDetail] = useState<any | null>(null);

  const handleSaveSmsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSmsSettings({
      smsEnabled,
      smsLanguage,
      gatewayProvider,
      fast2smsApiKey: fast2smsApiKey.trim(),
      twilioAccountSid: twilioAccountSid.trim(),
      twilioAuthToken: twilioAuthToken.trim(),
      twilioPhoneNumber: twilioPhoneNumber.trim(),
      msg91AuthKey: msg91AuthKey.trim(),
      senderId: senderId.trim(),
    });
    setSmsSavedSuccess(true);
    setTimeout(() => setSmsSavedSuccess(false), 2500);
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;
    setIsTestingSms(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone.trim(),
          message: testMessage.trim(),
          customSettings: {
            gatewayProvider,
            fast2smsApiKey: fast2smsApiKey.trim(),
            twilioAccountSid: twilioAccountSid.trim(),
            twilioAuthToken: twilioAuthToken.trim(),
            twilioPhoneNumber: twilioPhoneNumber.trim(),
            msg91AuthKey: msg91AuthKey.trim(),
            senderId: senderId.trim(),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Test SMS delivered successfully via ${data.gateway}!`,
          gateway: data.gateway,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to deliver test SMS. Check gateway credentials.',
          gateway: data.gateway,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Network error sending test SMS: ' + err.message,
      });
    } finally {
      setIsTestingSms(false);
    }
  };

  const handleRetrySms = async (logId: string) => {
    setRetryingLogId(logId);
    await retrySms(logId);
    setRetryingLogId(null);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanShop = shopName.trim();
    const cleanPhone = phone.trim();

    updateShopSettings({
      shopName: cleanShop,
      shopNameBn: shopNameBn.trim() || cleanShop,
      ownerName: ownerName.trim() || cleanShop,
      phone: cleanPhone,
      email: email.trim(),
      address: address.trim(),
      gstinOrReg: gstinOrReg.trim(),
      receiptFooterMessage: receiptFooter.trim() || (cleanShop ? `Thank you for visiting ${cleanShop}! Please visit again.` : ''),
      upiId: upiId.trim(),
    });

    if (user && cleanShop) {
      updateProfile(cleanShop, cleanPhone);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameBn.trim()) return;

    addCategory({
      name: newCatName.trim() || newCatNameBn.trim(),
      nameBn: newCatNameBn.trim(),
      color: 'blue',
      isDefault: false,
    });

    setNewCatName('');
    setNewCatNameBn('');
    setShowAddCat(false);
  };

  const handleDownloadBackup = () => {
    const data = ApiClient.getLocalData();
    exportDataAsJSON(data, `radhamadhab_backup_${new Date().toISOString().split('T')[0]}.json`);
    setBackupNotice(language === 'en' ? 'Complete database backup JSON downloaded!' : 'সম্পূর্ণ ডাটাবেস JSON ব্যাকআপ ডাউনলোড হয়েছে!');
    setTimeout(() => setBackupNotice(''), 3000);
  };

  const handleDownloadAllCSV = () => {
    exportTransactionsAsCSV(transactions, `radhamadhab_all_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    setBackupNotice(language === 'en' ? 'All transactions downloaded in CSV format!' : 'সকল লেনদেন CSV ফাইলে ডাউনলোড হয়েছে!');
    setTimeout(() => setBackupNotice(''), 3000);
  };

  const handleDownloadZip = () => {
    setIsDownloadingZip(true);
    setBackupNotice(
      language === 'en'
        ? 'Generating and preparing full website ZIP archive...'
        : 'সম্পূর্ণ ওয়েবসাইট জিপ ফাইল প্রস্তুত ও ডাউনলোড হচ্ছে...'
    );

    // Create an anchor and trigger download
    const link = document.createElement('a');
    link.href = '/api/download-project-zip';
    link.download = 'radhamadhab-online-center-full-website.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloadingZip(false);
      setBackupNotice(
        language === 'en'
          ? 'Full website project ZIP downloaded successfully! Check your Downloads folder.'
          : 'ওয়েবসাইট জিপ ফাইল সফলভাবে ডাউনলোড হয়েছে! আপনার Downloads ফোল্ডার দেখুন।'
      );
      setTimeout(() => setBackupNotice(''), 5000);
    }, 2000);
  };

  const [isDownloadingAndroidZip, setIsDownloadingAndroidZip] = useState(false);

  const handleDownloadAndroidZip = () => {
    setIsDownloadingAndroidZip(true);
    setBackupNotice(
      language === 'en'
        ? 'Preparing Android Studio Mobile Companion App ZIP project...'
        : 'অ্যান্ড্রয়েড স্টুডিও মোবাইল অ্যাপ জিপ ফাইল প্রস্তুত হচ্ছে...'
    );

    const link = document.createElement('a');
    link.href = '/api/download-android-project';
    link.download = 'radhamadhab-sms-sender-android-project.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloadingAndroidZip(false);
      setBackupNotice(
        language === 'en'
          ? 'Android Studio Companion App ZIP downloaded! Ready for Android Studio.'
          : 'অ্যান্ড্রয়েড স্টুডিও প্রজেক্ট জিপ ডাউনলোড হয়েছে! Android Studio তে সরাসরি বিল্ড করা যাবে।'
      );
      setTimeout(() => setBackupNotice(''), 5000);
    }, 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseBackupFile(file);
      setPendingRestoreData(parsed);
    } catch (err: any) {
      setBackupNotice('Error: ' + (err?.message || 'Failed to parse backup file'));
      setTimeout(() => setBackupNotice(''), 4000);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return;
    setIsRestoring(true);
    try {
      await restoreBackup(pendingRestoreData);
      setBackupNotice(
        language === 'en'
          ? `Database restored successfully! (${pendingRestoreData.transactions?.length || 0} transactions)`
          : `ডাটাবেস সফলভাবে রিস্টোর হয়েছে! (${pendingRestoreData.transactions?.length || 0} টি লেনদেন)`
      );
      setTimeout(() => setBackupNotice(''), 5000);
      setPendingRestoreData(null);
    } catch (err: any) {
      setBackupNotice('Error: ' + (err?.message || 'Failed to restore backup'));
      setTimeout(() => setBackupNotice(''), 4000);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExecuteReset = async () => {
    setIsResetting(true);
    try {
      await resetShopData(resetMode);
      setBackupNotice(
        language === 'en'
          ? `Shop database successfully reset (${resetMode === 'clean' ? 'Clean Slate: 0 transactions' : 'Demo State with sample data'})!`
          : `দোকানের ডাটাবেস সফলভাবে রিসেট করা হয়েছে (${resetMode === 'clean' ? 'নতুন শুরু: ০ টি লেনদেন' : 'ডেমো ডেটা'})!`
      );
      setTimeout(() => setBackupNotice(''), 5000);
      setIsResetModalOpen(false);
    } catch (err: any) {
      setBackupNotice('Error: ' + (err?.message || 'Failed to reset database'));
      setTimeout(() => setBackupNotice(''), 4000);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{t.settingsTitle}</h2>
            <p className="text-xs text-slate-400">{t.settingsSubtitle}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t.logout}</span>
        </button>
      </div>

      {backupNotice && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-medium">
          <Check className="w-4 h-4 shrink-0" />
          <span>{backupNotice}</span>
        </div>
      )}

      {/* Language Preference Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-white font-bold text-sm">
          <Languages className="w-4 h-4 text-amber-400" />
          <span>{language === 'en' ? 'Language Setting (ভাষা নির্বাচন)' : 'ভাষা নির্বাচন (Language)'}</span>
        </div>
        <p className="text-xs text-slate-400">
          {language === 'en'
            ? 'Choose your preferred interface language across the entire application.'
            : 'অ্যাপ্লিকেশনটি সম্পূর্ণ ইংরেজিতে অথবা বাংলায় ব্যবহারের জন্য নির্বাচন করুন।'}
        </p>
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            English (All English)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('bn')}
            className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
              language === 'bn'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            বাংলা (Bengali)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('bi')}
            className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
              language === 'bi'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            Bilingual (EN + BN)
          </button>
        </div>
      </div>

      {/* Theme / Appearance Preference Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>{language === 'en' ? 'Appearance & Theme (থিম নির্বাচন)' : 'থিম ও ডিসপ্লে (Dark / Light Mode)'}</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {language === 'en'
            ? 'Switch between high-contrast Dark Mode (ideal for night/indoor desk work) and Light Mode (clean daylight display).'
            : 'আপনার পছন্দের জন্য ডার্ক মোড অথবা লাইট মোড নির্বাচন করুন।'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Dark Mode Option */}
          <div
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              theme === 'dark'
                ? 'bg-slate-950 border-blue-500 ring-2 ring-blue-500/30'
                : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Moon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  {language === 'en' ? 'Dark Mode' : 'ডার্ক মোড'}
                </span>
                {theme === 'dark' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'en' ? 'Deep slate background with glowing neon accents.' : 'গভীর স্লেট ব্যাকগ্রাউন্ড ও চোখে আরামদায়ক আলো।'}
              </p>
            </div>
          </div>

          {/* Light Mode Option */}
          <div
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              theme === 'light'
                ? 'bg-slate-100 border-amber-500 ring-2 ring-amber-500/30 text-slate-900'
                : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <Sun className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {language === 'en' ? 'Light Mode' : 'লাইট মোড'}
                </span>
                {theme === 'light' && <Check className="w-3.5 h-3.5 text-amber-500" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {language === 'en' ? 'Clean crisp white and slate cards with high contrast.' : 'উজ্জ্বল সাদা ও নরম স্লেট ব্যাকগ্রাউন্ড।'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Receipts Management Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>{language === 'en' ? 'Customer Receipts & History' : 'গ্রাহক রসিদ ও ইতিহাস ব্যবস্থাপনা'}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
            {receipts.length} {language === 'en' ? 'saved' : 'টি সংরক্ষিত'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {language === 'en'
            ? 'Generate new printable receipts or search, view, reprint, and manage all saved customer receipts.'
            : 'নতুন রসিদ তৈরি করুন অথবা পূর্বে সংরক্ষিত সমস্ত রসিদ দেখুন ও পুনরায় প্রিন্ট করুন।'}
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={openReceiptHistoryModal}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>{language === 'en' ? 'View Saved Receipts History' : 'সংরক্ষিত রসিদের তালিকা দেখুন'}</span>
            <span className="font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded text-[10px]">
              {receipts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => openGenerateReceiptModal()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? 'Generate New Receipt' : 'নতুন রসিদ তৈরি করুন'}</span>
          </button>
        </div>
      </div>

      {/* 1. Shop Profile Details Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-bold text-sm">
          <Store className="w-4 h-4 text-amber-400" />
          <span>{t.shopInfo}</span>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>{language === 'en' ? 'Shop settings saved successfully!' : 'দোকানের তথ্য সফলভাবে সংরক্ষিত হয়েছে!'}</span>
          </div>
        )}

        <form onSubmit={handleSaveShopSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.shopNameLabel}</label>
              <input
                type="text"
                required
                placeholder="Radhamadhab Online Center"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.shopNameBnLabel}</label>
              <input
                type="text"
                placeholder="রাধা মাধব অনলাইন সেন্টার"
                value={shopNameBn}
                onChange={e => setShopNameBn(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.ownerNameLabel}</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.phoneLabel}</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.addressLabel}</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.gstinLabel}</label>
              <input
                type="text"
                value={gstinOrReg}
                onChange={e => setGstinOrReg(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {language === 'en' ? 'Shop UPI ID (for QR & WhatsApp collection)' : 'দোকানের UPI ID (QR কোড ও পেমেন্ট কালেকশন)'}
              </label>
              <input
                type="text"
                placeholder="e.g. yourshop@upi"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t.receiptFooterLabel}</label>
              <input
                type="text"
                value={receiptFooter}
                onChange={e => setReceiptFooter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{t.saveSettings}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 2. AUTOMATIC PHONE SIM SMS NOTIFICATION (ZERO API KEYS REQUIRED)          */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Phone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {language === 'en'
                    ? 'Free Phone SIM SMS System (Android Companion App)'
                    : 'মোবাইল সিম কার্ড SMS সিস্টেম (Zero API Keys • 100% Free)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  DIRECT SIM ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'en'
                  ? 'Send customer due reminders directly from your own phone SIM card (Jio / Airtel / Vi / BSNL) with ZERO API gateway fees.'
                  : 'কোনো পেইড SMS গেটওয়ে বা API Key ছাড়াই দোকানদারের নিজস্ব মোবাইল সিম কার্ড দিয়ে গ্রাহকদের স্বয়ংক্রিয় SMS পাঠান।'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{language === 'en' ? 'No API Keys Needed' : 'API Key লাগবে না'}</span>
            </span>
          </div>
        </div>

        {/* Workflow Diagram Banner */}
        <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
            {language === 'en' ? 'How the System Works:' : 'সিস্টেমটি যেভাবে কাজ করে:'}
          </span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] font-bold text-blue-400 uppercase">Step 1: Website Due Entry</div>
              <p className="text-slate-300 text-[11px]">Shopkeeper records due and clicks <strong>"Confirm Due"</strong> on website.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] font-bold text-amber-400 uppercase">Step 2: Instant Push</div>
              <p className="text-slate-300 text-[11px]">System generates pending SMS request and notifies Shopkeeper Android App.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] font-bold text-emerald-400 uppercase">Step 3: Shopkeeper SIM Send</div>
              <p className="text-slate-300 text-[11px]">App prompts shopkeeper to tap <strong>"Send SMS"</strong> via SIM 1 or SIM 2.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] font-bold text-purple-400 uppercase">Step 4: Status Live Sync</div>
              <p className="text-slate-300 text-[11px]">SMS status updates to <strong>Sent</strong> with delivery log synced to website.</p>
            </div>
          </div>
        </div>

        {/* Multilingual Templates */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-amber-400" />
              <span>{language === 'en' ? 'Supported SMS Languages & Templates' : 'সাপোর্টেড SMS ভাষা ও টেমপ্লেট'}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Unicode (Bengali / English / Hindi)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Bengali */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">বাংলা (Bengali)</span>
                <span className="text-[10px] text-slate-400">ডিফল্ট</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed bg-slate-950 p-2 rounded border border-slate-850 select-all">
                "প্রিয় &#123;&#123;customer_name&#125;&#125;, আপনার &#123;&#123;shop_name&#125;&#125; দোকানে ₹&#123;&#123;due_amount&#125;&#125; টাকা ধার বাকি রয়েছে। অনুগ্রহ করে সময়মতো টাকা পরিশোধ করুন। ধন্যবাদ।"
              </p>
            </div>

            {/* English */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400">English</span>
                <span className="text-[10px] text-slate-400">Universal</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed bg-slate-950 p-2 rounded border border-slate-850 select-all">
                "Dear &#123;&#123;customer_name&#125;&#125;, you have ₹&#123;&#123;due_amount&#125;&#125; pending at &#123;&#123;shop_name&#125;&#125;. Please make the payment at your earliest convenience. Thank you."
              </p>
            </div>

            {/* Hindi */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400">हिन्दी (Hindi)</span>
                <span className="text-[10px] text-slate-400">Unicode</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed bg-slate-950 p-2 rounded border border-slate-850 select-all">
                "प्रिय &#123;&#123;customer_name&#125;&#125;, &#123;&#123;shop_name&#125;&#125; में आपका ₹&#123;&#123;due_amount&#125;&#125; बकाया है। कृपया समय पर भुगतान करें। धन्यवाद।"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SMS HISTORY & DELIVERY STATUS (WITH ONE-CLICK RETRY)                   */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {language === 'en' ? 'SMS History & Delivery Status' : 'SMS ইতিহাস ও ডেলিভারি স্ট্যাটাস'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 font-mono">
                  {(smsLogs || []).length} logs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'en'
                  ? 'Complete history of all customer transaction notices, balance reminders, and OTP verifications with instant Retry.'
                  : 'সকল লেনদেন নিশ্চিতকরণ ও রসিদ এসএমএসের পূর্ণাঙ্গ তালিকা। কোনো SMS ফেইল হলে এক ক্লিকে পুনরায় পাঠানো যায়।'}
              </p>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: language === 'en' ? 'All' : 'সবগুলো' },
              { id: 'delivered', label: language === 'en' ? 'Delivered' : 'সফল (Delivered)' },
              { id: 'failed', label: language === 'en' ? 'Failed' : 'ব্যর্থ (Failed)' },
              { id: 'payment_received', label: language === 'en' ? 'Payment Got' : 'টাকা পেয়েছি' },
              { id: 'payment_given', label: language === 'en' ? 'Credit Given' : 'বাকি দিয়েছি' },
              { id: 'otp_registration', label: 'OTP' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSmsHistoryFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  smsHistoryFilter === f.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* SMS Logs Table */}
        {(() => {
          const filteredLogs = (smsLogs || []).filter(log => {
            if (smsHistoryFilter === 'delivered') return log.status === 'delivered' || log.status === 'sent';
            if (smsHistoryFilter === 'failed') return log.status === 'failed';
            if (smsHistoryFilter === 'payment_received') return log.type === 'payment_received';
            if (smsHistoryFilter === 'payment_given') return log.type === 'payment_given';
            if (smsHistoryFilter === 'otp_registration') return log.type === 'otp_registration';
            return true;
          });

          if (filteredLogs.length === 0) {
            return (
              <div className="p-8 text-center text-slate-500 text-xs">
                {language === 'en' ? 'No SMS records found matching filter.' : 'কোনো SMS রেকর্ড পাওয়া যায়নি।'}
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Message Preview</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredLogs.map(log => {
                    const isDelivered = log.status === 'delivered' || log.status === 'sent';
                    const isRetrying = retryingLogId === log.id;
                    const dateFormatted = new Date(log.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {dateFormatted}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-bold text-white">{log.recipientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">+91 {log.recipientPhone}</div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              log.type === 'payment_received'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : log.type === 'payment_given'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : log.type === 'otp_registration'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {log.type === 'payment_received'
                              ? 'Payment Got'
                              : log.type === 'payment_given'
                              ? 'Credit Given'
                              : log.type === 'otp_registration'
                              ? 'OTP Reg.'
                              : 'Test SMS'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-slate-300 text-[11px]" title={log.message}>
                          {log.message}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isDelivered ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{log.status === 'delivered' ? 'Delivered' : 'Sent'}</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold cursor-help"
                              title={log.error || 'Gateway delivery failed'}
                            >
                              <AlertCircle className="w-3 h-3" />
                              <span>Failed</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedLogDetail(log)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              title="View full SMS"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {!isDelivered && (
                              <button
                                type="button"
                                disabled={isRetrying}
                                onClick={() => handleRetrySms(log.id)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                              >
                                {isRetrying ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                                <span>Retry</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Modal for viewing full SMS details */}
        {selectedLogDetail && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setSelectedLogDetail(null)}
          >
            <div
              className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">SMS Message Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLogDetail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="font-bold text-white">
                    {selectedLogDetail.recipientName} (+91 {selectedLogDetail.recipientPhone})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gateway:</span>
                  <span className="font-mono text-emerald-400">{selectedLogDetail.gateway}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span
                    className={`font-bold ${
                      selectedLogDetail.status === 'delivered' || selectedLogDetail.status === 'sent'
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {selectedLogDetail.status.toUpperCase()}
                  </span>
                </div>
                {selectedLogDetail.error && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px]">
                    <strong>Gateway Error:</strong> {selectedLogDetail.error}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Full SMS Message Body:</label>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white leading-relaxed whitespace-pre-wrap select-all">
                    {selectedLogDetail.message}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                {selectedLogDetail.status === 'failed' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleRetrySms(selectedLogDetail.id);
                      setSelectedLogDetail(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry SMS Now</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLogDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Categories Management */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Tags className="w-4 h-4 text-blue-400" />
            <span>{t.categoriesManagement} ({categories.length})</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddCat(!showAddCat)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addCategory}</span>
          </button>
        </div>

        {/* Add new Category Form */}
        {showAddCat && (
          <form onSubmit={handleAddCategory} className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {language === 'en' ? 'Category Name (English) *' : 'ক্যাটাগরির নাম (বাংলায়) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Passport Apply, Train Ticket"
                  value={newCatNameBn}
                  onChange={e => setNewCatNameBn(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  {language === 'en' ? 'Alternative / Bengali Label' : 'English Name (ঐচ্ছিক)'}
                </label>
                <input
                  type="text"
                  placeholder="Passport Service"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddCat(false)}
                className="px-3 py-1 rounded text-xs text-slate-400 hover:text-white"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
              >
                {t.addCategory}
              </button>
            </div>
          </form>
        )}

        {/* Category List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {categories.map(cat => (
            <div
              key={cat.id}
              className="bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-xl flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-200 truncate">
                  {language === 'en' ? cat.name : cat.nameBn}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {language === 'en' ? cat.nameBn : cat.name}
                </div>
              </div>

              {!cat.isDefault && (
                deletingCatId === cat.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        deleteCategory(cat.id);
                        setDeletingCatId(null);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                    >
                      {language === 'en' ? 'Yes' : 'হ্যাঁ'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCatId(null)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletingCatId(cat.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Ready for Client Handover (Dual Website & Android App Package) */}
      <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900 to-purple-950/40 border-2 border-indigo-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 ring-1 ring-indigo-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <FolderArchive className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base sm:text-lg">
                  {language === 'en'
                    ? 'Client Handover Center — Website & Android App'
                    : 'ক্লায়েন্ট ডেলিভারি সেন্টার (Website & Android App Package)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  PRODUCTION READY
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {language === 'en'
                  ? 'Complete production source code package for both the Web application and the Companion Android SIM SMS Mobile App.'
                  : 'ক্লায়েন্টকে ডেলিভারি দেওয়ার জন্য সম্পূর্ণ ওয়েবসাইট ও অ্যান্ড্রয়েড মোবাইল অ্যাপের সোর্স কোড জিপ প্যাকেজ।'}
              </p>
            </div>
          </div>
        </div>

        {/* Dual Download Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Website Project ZIP */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/30 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <FileCode2 className="w-4 h-4" />
                  <span>{language === 'en' ? 'Website Version' : 'ওয়েবসাইট ভার্সন'}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  Full Stack React + Express
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {language === 'en'
                  ? 'Complete responsive web platform: Khata Book, DMT, Daily Expense, Calculator, Customer Due Confirm system.'
                  : 'সম্পূর্ণ ওয়েব প্ল্যাটফর্ম: ডিজিটাল খাতা, DMT হিসেব, ক্যালকুলেটর ও Confirm Due সিস্টেম।'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isDownloadingZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{language === 'en' ? 'Zipping Website...' : 'ওয়েবসাইট জিপ তৈরি হচ্ছে...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>{language === 'en' ? 'Download Full Website (.ZIP)' : 'সম্পূর্ণ ওয়েবসাইট জিপ (.ZIP)'}</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Android Studio Companion App ZIP */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span>{language === 'en' ? 'Android Mobile App Version' : 'অ্যান্ড্রয়েড মোবাইল অ্যাপ ভার্সন'}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Android Studio Kotlin
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {language === 'en'
                  ? 'Native Android app project to send SMS directly from the shopkeeper SIM card with zero gateway fees & multilingual templates.'
                  : 'দোকানদারের নিজস্ব ফোন সিম দিয়ে ফ্রি SMS পাঠানোর জন্য অ্যান্ড্রয়েড স্টুডিও কোটলিন প্রজেক্ট।'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadAndroidZip}
              disabled={isDownloadingAndroidZip}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isDownloadingAndroidZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{language === 'en' ? 'Packaging Android Project...' : 'অ্যান্ড্রয়েড প্রজেক্ট জিপ হচ্ছে...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>{language === 'en' ? 'Download Android App Project (.ZIP)' : 'অ্যান্ড্রয়েড অ্যাপ প্রজেক্ট (.ZIP)'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Handover Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 text-[11px]">
              {language === 'en' ? 'Dual Version: Ready for Web & Android' : 'ওয়েবসাইট ও অ্যান্ড্রয়েড অ্যাপ উভয়ই তৈরি'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 text-[11px]">
              {language === 'en' ? 'Zero SMS API Keys • Free SIM Sending' : 'জিরো API খরচ • ফ্রি ফোন সিম SMS'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-slate-300 text-[11px]">
              {language === 'en' ? 'Includes Documentation & Setup Guides' : 'সেটআপ ও ক্লায়েন্ট হ্যান্ডওভার গাইড অন্তর্ভুক্ত'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Database Backup & Restore */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-white font-bold text-sm">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>{t.databaseBackup}</span>
        </div>

        <p className="text-xs text-slate-400">
          {language === 'en'
            ? 'Backup all transactions, balances, and categories to your device, or restore from a previously saved JSON file.'
            : 'আপনার দোকানের সমস্ত লেনদেন, প্রারম্ভিক ব্যালেন্স ও ক্যাটাগরির ব্যাকআপ ফাইল নিজের ডিভাইসে সংরক্ষণ করুন।'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Download JSON */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left space-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <Download className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">JSON</span>
            </div>
            <div className="font-bold text-xs text-white">{t.downloadJSON}</div>
            <div className="text-[10px] text-slate-400">{language === 'en' ? 'Safe full backup file' : 'যেকোনো সময় রিস্টোর করার জন্য'}</div>
          </button>

          {/* Download CSV */}
          <button
            type="button"
            onClick={handleDownloadAllCSV}
            className="p-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left space-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">CSV</span>
            </div>
            <div className="font-bold text-xs text-white">{t.downloadCSV}</div>
            <div className="text-[10px] text-slate-400">{language === 'en' ? 'Open in Microsoft Excel' : 'সকল লেনদেনের স্প্রেডশিট'}</div>
          </button>

          {/* Restore Backup */}
          <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-left space-y-1 relative">
            <div className="flex items-center justify-between">
              <Upload className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">UPLOAD</span>
            </div>
            <div className="font-bold text-xs text-white">{t.restoreBackup}</div>
            <div className="text-[10px] text-slate-400">{language === 'en' ? 'Upload JSON backup' : 'JSON ব্যাকআপ ফাইল আপলোড করুন'}</div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* 4. Reset Option ("rest option") */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-rose-900/40">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{t.resetDatabase}</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {language === 'en' ? 'Danger Zone' : 'সতর্কতা অঞ্চল'}
          </span>
        </div>
        <p className="text-xs text-rose-300/80">
          {t.resetWarning}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-950/40 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.resetDatabase}</span>
          </button>
          <span className="text-[11px] text-slate-400">
            {language === 'en'
              ? `Currently ${transactions.length} transactions stored in database`
              : `বর্তমানে ডাটাবেসে ${transactions.length} টি লেনদেন সংরক্ষিত`}
          </span>
        </div>
      </div>

      {/* Reset Shop Database Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {language === 'en' ? 'Reset Shop Database' : 'দোকানের ডাটাবেস রিসেট'}
                  </h3>
                  <p className="text-[11px] text-rose-400/90 font-medium">
                    {language === 'en' ? 'Permanent Data Action' : 'স্থায়ী ডেটা রিসেট'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isResetting && setIsResetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Stats */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-around text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {language === 'en' ? 'Transactions' : 'মোট লেনদেন'}
                </span>
                <span className="font-bold text-rose-400 text-sm">{transactions.length}</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {language === 'en' ? 'Categories' : 'ক্যাটাগরি'}
                </span>
                <span className="font-bold text-slate-200 text-sm">{categories.length}</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {language === 'en' ? 'Shop' : 'দোকান'}
                </span>
                <span className="font-bold text-blue-400 text-xs truncate max-w-[90px] block" title={shopSettings.shopName}>
                  {shopSettings.shopName}
                </span>
              </div>
            </div>

            {/* Reset Mode Choices */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-300 block">
                {language === 'en' ? 'Select Reset Mode:' : 'রিসেটের ধরন নির্বাচন করুন:'}
              </label>

              {/* Mode 1: Clean Slate (0 transactions) */}
              <div
                onClick={() => setResetMode('clean')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  resetMode === 'clean'
                    ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/40'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="resetMode"
                    checked={resetMode === 'clean'}
                    onChange={() => setResetMode('clean')}
                    className="mt-0.5 text-blue-500 focus:ring-blue-500"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        {language === 'en' ? 'Clean Slate (0 Transactions)' : 'নতুন শুরু (০ টি লেনদেন)'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                        {language === 'en' ? 'Recommended for Real Shop' : 'বাস্তব ব্যবহারের জন্য'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {language === 'en'
                        ? 'Wipes all transactions to 0 and clears balances. Preserves your shop settings and service categories so you can start recording real customer entries.'
                        : 'সমস্ত লেনদেন মুছে ০ করে এবং ব্যালেন্স রিসেট করে। তবে দোকানের নাম ও সকল ক্যাটাগরি ঠিক থাকে যাতে আজ থেকে আসল হিসাব শুরু করতে পারেন।'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode 2: Factory Demo Data */}
              <div
                onClick={() => setResetMode('demo')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  resetMode === 'demo'
                    ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="resetMode"
                    checked={resetMode === 'demo'}
                    onChange={() => setResetMode('demo')}
                    className="mt-0.5 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        {language === 'en' ? 'Demo / Sample Data' : 'ডেমো নমুনা ডেটা'}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                        {language === 'en' ? 'For Testing' : 'পরীক্ষার জন্য'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {language === 'en'
                        ? 'Re-populates 5 starter demo transactions (Xerox, Print, Jio Recharge, DMT) and sample opening balances.'
                        : '৫টি নমুনা ডেমো লেনদেন (জেরক্স, প্রিন্ট, রিচার্জ, মানি ট্রান্সফার) এবং প্রাথমিক ব্যালেন্স পুনরায় যোগ করবে।'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                {t.close || (language === 'en' ? 'Cancel' : 'বাতিল')}
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleExecuteReset}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-rose-950/50 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'en' ? 'Resetting...' : 'রিসেট হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>{language === 'en' ? 'Confirm Reset Database' : 'নিশ্চিত রিসেট করুন'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Backup Confirmation Modal */}
      {pendingRestoreData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {language === 'en' ? 'Restore Database Backup' : 'ডাটাবেস ব্যাকআপ রিস্টোর'}
                  </h3>
                  <p className="text-[11px] text-amber-400/90 font-medium">
                    {language === 'en' ? 'File verified and ready' : 'ফাইল প্রস্তুত'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setPendingRestoreData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{language === 'en' ? 'Transactions in file:' : 'ফাইলে মোট লেনদেন:'}</span>
                <span className="font-bold text-white">{pendingRestoreData.transactions?.length || 0}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{language === 'en' ? 'Service Categories:' : 'সার্ভিস ক্যাটাগরি:'}</span>
                <span className="font-bold text-white">{pendingRestoreData.categories?.length || 0}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{language === 'en' ? 'Shop Name in file:' : 'ফাইলে দোকানের নাম:'}</span>
                <span className="font-bold text-white">{pendingRestoreData.shopSettings?.shopName || 'Radhamadhab Online Center'}</span>
              </div>
            </div>

            <p className="text-xs text-amber-300/80 leading-relaxed">
              {language === 'en'
                ? 'Warning: Restoring this backup will replace current database transactions with the data in this file. Are you sure you want to proceed?'
                : 'সতর্কতা: এই ব্যাকআপ ফাইলটি রিস্টোর করলে বর্তমান সমস্ত লেনদেন এই ফাইলের ডেটা দ্বারা প্রতিস্থাপিত হবে। আপনি কি নিশ্চিত?'}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setPendingRestoreData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-amber-950/50 cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'en' ? 'Restoring...' : 'রিস্টোর হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{language === 'en' ? 'Confirm & Restore' : 'নিশ্চিত রিস্টোর করুন'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
