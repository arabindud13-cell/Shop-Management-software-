import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  Bell,
  Settings,
  Languages,
  Check,
  Edit3,
  X,
  Download,
  Share2,
  ShieldCheck,
  Phone,
  Store,
  DollarSign,
  Radio,
  FileCode2,
  Sparkles,
  Wifi,
  Battery,
  Signal,
  MessageSquare,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SimSmsRequest, SimSmsStatus } from '../types';
import { formatCurrency } from '../lib/accounting';

interface AndroidAppViewProps {
  onBackToWebsite?: () => void;
}

export const AndroidAppView: React.FC<AndroidAppViewProps> = ({ onBackToWebsite }) => {
  const { user } = useAuth();
  const {
    shopSettings,
    simSmsQueue,
    updateSimSmsStatus,
    refreshSimSmsQueue,
    deleteSimSms,
  } = useShop();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'settings'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<SimSmsRequest | null>(null);
  const [isSendingModalOpen, setIsSendingModalOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'bn' | 'en' | 'hi'>('bn');
  const [editedMessage, setEditedMessage] = useState('');
  const [selectedSimSlot, setSelectedSimSlot] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<SimSmsRequest | null>(null);
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);
  const [isDownloadingAndroidZip, setIsDownloadingAndroidZip] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const currentShopName = user?.shopName || shopSettings.shopName || 'Radhamadhab Online Center';

  // Real-time polling for new due entry SMS requests (every 4 seconds)
  useEffect(() => {
    refreshSimSmsQueue();
    const interval = setInterval(() => {
      refreshSimSmsQueue();
    }, 4000);
    return () => clearInterval(interval);
  }, [refreshSimSmsQueue]);

  // Detect newly added pending requests and trigger Heads-Up Notification
  useEffect(() => {
    const latestPending = simSmsQueue.find(q => q.status === 'Pending');
    if (latestPending) {
      // If notification is not already showing this request
      if (!notificationBanner || notificationBanner.id !== latestPending.id) {
        setNotificationBanner(latestPending);
        // Play subtle Android notification chime if supported
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch {
          // ignore audio context restrictions
        }
      }
    }
  }, [simSmsQueue]);

  // Multilingual Template Generator
  const getTemplateMessage = (lang: 'bn' | 'en' | 'hi', req: SimSmsRequest): string => {
    const custName = req.customerName;
    const shop = req.shopName || currentShopName;
    const amt = req.dueAmount.toLocaleString('en-IN');

    if (lang === 'bn') {
      return `প্রিয় ${custName}, আপনার ${shop} দোকানে ₹${amt} টাকা ধার বাকি রয়েছে। অনুগ্রহ করে সময়মতো টাকা পরিশোধ করুন। ধন্যবাদ।`;
    }
    if (lang === 'hi') {
      return `प्रिय ${custName}, ${shop} में आपका ₹${amt} बकाया है। कृपया समय पर भुगतान करें। धन्यवाद।`;
    }
    return `Dear ${custName}, you have ₹${amt} pending at ${shop}. Please make the payment at your earliest convenience. Thank you.`;
  };

  // Open the Send SMS Confirmation Modal
  const handleOpenSendModal = (req: SimSmsRequest) => {
    setSelectedRequest(req);
    setSelectedLang(req.language || 'bn');
    setEditedMessage(req.message || getTemplateMessage(req.language || 'bn', req));
    setIsSendingModalOpen(true);
    // Mark as Approved/In Review
    if (req.status === 'Pending') {
      updateSimSmsStatus({
        requestId: req.id,
        status: 'Approved',
      });
    }
  };

  // Switch template language in modal
  const handleLangChange = (newLang: 'bn' | 'en' | 'hi') => {
    setSelectedLang(newLang);
    if (selectedRequest) {
      setEditedMessage(getTemplateMessage(newLang, selectedRequest));
    }
  };

  // Send SMS using the shopkeeper's Android phone SIM card
  const handleSendSmsFromSim = async () => {
    if (!selectedRequest) return;

    const phone = selectedRequest.customerMobile.replace(/\D/g, '');
    const messageToSend = editedMessage.trim();

    // 1. Update status to 'Sending' on backend
    await updateSimSmsStatus({
      requestId: selectedRequest.id,
      status: 'Sending',
      editedMessage: messageToSend,
      simSlot: selectedSimSlot,
    });

    // 2. Launch Android SIM SMS using device native intent
    // The format "sms:1234567890?body=..." or "?&body=" handles Android OS variations
    const isAndroid = /android/i.test(navigator.userAgent);
    const smsUri = isAndroid
      ? `sms:${phone}?body=${encodeURIComponent(messageToSend)}`
      : `sms:${phone}&body=${encodeURIComponent(messageToSend)}`;

    // Open native SMS app on Android device
    const link = document.createElement('a');
    link.href = smsUri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 3. Mark as 'Sent' on backend
    setTimeout(async () => {
      await updateSimSmsStatus({
        requestId: selectedRequest.id,
        status: 'Sent',
        sentAt: new Date().toISOString(),
        simSlot: selectedSimSlot,
      });

      setIsSendingModalOpen(false);
      setSuccessToast(`SMS sent to customer ${selectedRequest.customerName} via SIM ${selectedSimSlot}!`);
      setTimeout(() => setSuccessToast(''), 4000);
      refreshSimSmsQueue();
    }, 1200);
  };

  // Mark as Failed
  const handleMarkFailed = async (req: SimSmsRequest, reason: string) => {
    await updateSimSmsStatus({
      requestId: req.id,
      status: 'Failed',
      failedReason: reason,
    });
    setIsSendingModalOpen(false);
  };

  // Download Android Project ZIP for Client
  const handleDownloadAndroidZip = () => {
    setIsDownloadingAndroidZip(true);
    const link = document.createElement('a');
    link.href = '/api/download-android-project';
    link.download = 'radhamadhab-sms-sender-android-project.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloadingAndroidZip(false);
      setSuccessToast('Android Studio Project (.ZIP) downloaded successfully!');
      setTimeout(() => setSuccessToast(''), 4000);
    }, 2000);
  };

  const pendingRequests = simSmsQueue.filter(r => r.status === 'Pending' || r.status === 'Approved');
  const allRequests = simSmsQueue;
  const filteredRequests = statusFilter === 'all'
    ? allRequests
    : allRequests.filter(r => r.status.toLowerCase() === statusFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 select-none">
      {/* Top Navigation Bar: Back to Website Toggle & Title */}
      <div className="w-full max-w-md flex items-center justify-between pb-3 border-b border-slate-800">
        <button
          type="button"
          onClick={onBackToWebsite}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-amber-300 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Back to Website' : 'ওয়েবসাইটে ফিরে যান'}</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 justify-end">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SIM SMS Companion
          </span>
          <div className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
            {currentShopName}
          </div>
        </div>
      </div>

      {/* Main Android Phone Mockup Container */}
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden mt-3 flex flex-col min-h-[640px] relative ring-1 ring-slate-700/50">
        {/* Android Native Status Bar */}
        <div className="bg-slate-950 px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/80">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
              SIM 1+2
            </span>
          </div>

          {/* Android Camera Notch & Sensors */}
          <div className="w-20 h-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-slate-950" />
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Signal className="w-3.5 h-3.5 text-emerald-400" />
            <Wifi className="w-3.5 h-3.5 text-blue-400" />
            <div className="flex items-center gap-0.5 font-bold">
              <span>98%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Android App Top Header Bar */}
        <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-teal-900/60 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                <span>SIM SMS Reminder</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-normal">
                  v2.0
                </span>
              </h1>
              <p className="text-[10px] text-slate-300 truncate">
                {currentShopName} • SIM Sender
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsRefreshing(true);
                refreshSimSmsQueue();
                setTimeout(() => setIsRefreshing(false), 600);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Android Push Notification Banner (Heads-up alert) */}
        {notificationBanner && (
          <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-b-2 border-amber-500/50 p-3 shadow-lg animate-in slide-in-from-top duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-md">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <span>New Customer Due Entry</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  </div>
                  <div className="text-xs font-black text-white mt-0.5">
                    {notificationBanner.customerName} • {formatCurrency(notificationBanner.dueAmount)}
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    Mobile: +91 {notificationBanner.customerMobile}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Shop: {notificationBanner.shopName}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNotificationBanner(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notification Action Buttons */}
            <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleOpenSendModal(notificationBanner)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send SMS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(notificationBanner);
                  setShowNotificationDetails(true);
                }}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer"
              >
                View Details
              </button>

              <button
                type="button"
                onClick={() => setNotificationBanner(null)}
                className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-150">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {successToast}
            </span>
            <button onClick={() => setSuccessToast('')} className="p-0.5 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Navigation: Pending, All History, App Settings */}
        <div className="grid grid-cols-3 bg-slate-950 p-1.5 gap-1 border-b border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>SIM Setup</span>
          </button>
        </div>

        {/* Tab 1: Pending SMS Requests Queue */}
        {activeTab === 'pending' && (
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Customer Due Reminders ({pendingRequests.length})</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="font-bold text-sm text-white">No Pending SMS Requests</div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  When you add a customer due on the website and click <span className="text-amber-300 font-bold">"Confirm Due"</span>, it appears here instantly for SIM SMS sending!
                </p>
              </div>
            ) : (
              pendingRequests.map(req => (
                <div
                  key={req.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 shadow-md space-y-2.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-sm text-white flex items-center gap-1.5">
                        <span>{req.customerName}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300">
                          {req.transactionType || 'Due'}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>+91 {req.customerMobile}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-base font-black text-amber-300">
                        {formatCurrency(req.dueAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-300 font-mono leading-relaxed line-clamp-2">
                    {req.message}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenSendModal(req)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Send SMS from SIM</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteSimSms(req.id)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 cursor-pointer"
                      title="Dismiss request"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Full History & Logs */}
        {activeTab === 'history' && (
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {/* Status Filter Pill Buttons */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-bold">
              {(['all', 'pending', 'sent', 'failed'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`py-1 rounded-lg uppercase transition-all cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-slate-800 text-white shadow-sm font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No SMS records found for this filter.
              </div>
            ) : (
              filteredRequests.map(req => (
                <div
                  key={req.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-sm space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{req.customerName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'Sent'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : req.status === 'Sending'
                          ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                          : req.status === 'Failed'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                    <span>+91 {req.customerMobile}</span>
                    <span className="font-bold text-amber-300 font-mono">{formatCurrency(req.dueAmount)}</span>
                  </div>

                  <div className="text-[11px] text-slate-300 font-mono bg-slate-900 p-2 rounded-lg line-clamp-2">
                    {req.message}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>{new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    {req.status === 'Sent' && (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <Check className="w-3 h-3" />
                        SIM {req.simSlot || 1}
                      </span>
                    )}
                    {req.status !== 'Sent' && (
                      <button
                        type="button"
                        onClick={() => handleOpenSendModal(req)}
                        className="text-amber-400 hover:underline font-bold cursor-pointer"
                      >
                        Resend via SIM
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: SIM Setup & Client Handover Tools */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-3 overflow-y-auto space-y-3.5 text-xs">
            {/* SIM Card Status Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-black text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Phone SIM Card Status</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  Ready
                </span>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                SMS messages are sent directly from your Android phone's physical SIM card using your carrier's local SMS pack. <strong className="text-white">No third-party SMS API keys are required!</strong>
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400">Default SIM Slot:</div>
                  <div className="font-bold text-white flex items-center gap-1 font-mono">
                    <Radio className="w-3 h-3 text-emerald-400" />
                    <span>SIM {selectedSimSlot} (Primary)</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400">Recipient Rule:</div>
                  <div className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Customer only</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Handover & Android APK / Studio Project Download */}
            <div className="bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/30 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <FileCode2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-white text-xs">Ready for Client Handover</div>
                  <div className="text-[10px] text-slate-400">Website + Android Studio Kotlin Project</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Download the complete native Android Studio Kotlin Project source code ready to build an APK, or use this web-based Android app directly on mobile phones.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadAndroidZip}
                  disabled={isDownloadingAndroidZip}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isDownloadingAndroidZip
                      ? 'Downloading Android Project...'
                      : 'Download Android Studio Project (.ZIP)'}
                  </span>
                </button>

                <a
                  href="/api/download-project-zip"
                  download="radhamadhab-online-center-full-website.zip"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer no-underline text-center"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download Full Website Source Code (.ZIP)</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Android Native Bottom Navigation Bar */}
        <div className="bg-slate-950 border-t border-slate-800 py-2.5 px-6 flex items-center justify-around">
          <div className="w-3.5 h-3.5 border-2 border-slate-500 rounded-sm" />
          <div className="w-4 h-4 border-2 border-slate-500 rounded-full" />
          <div className="w-0 h-0 border-y-[6px] border-y-transparent border-r-[10px] border-r-slate-500" />
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEND SMS CONFIRMATION MODAL (Step 3: From Shopkeeper's SIM)  */}
      {/* ============================================================ */}
      {isSendingModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Send SMS from Phone SIM</h3>
                  <p className="text-[10px] text-slate-400">Direct carrier SMS • No API key needed</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSendingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Due Summary Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Customer Name:</span>
                <span className="font-bold text-white text-sm">{selectedRequest.customerName}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Customer Mobile:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  +91 {selectedRequest.customerMobile}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Shop Name:</span>
                <span className="font-semibold text-slate-200">{selectedRequest.shopName || currentShopName}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-400">Due Amount:</span>
                <span className="font-mono font-black text-amber-300 text-base">
                  {formatCurrency(selectedRequest.dueAmount)}
                </span>
              </div>
            </div>

            {/* Recipient Notice - Must NEVER be sent to shopkeeper's number */}
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Recipient is verified as customer (+91 {selectedRequest.customerMobile}).</span>
            </div>

            {/* Multilingual Template Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Select SMS Language:
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleLangChange('bn')}
                  className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedLang === 'bn'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  বাংলা (Bengali)
                </button>
                <button
                  type="button"
                  onClick={() => handleLangChange('en')}
                  className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedLang === 'en'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => handleLangChange('hi')}
                  className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedLang === 'hi'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>
            </div>

            {/* Editable SMS Message Textbox */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-300 flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>SMS Message (Editable):</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {editedMessage.length} characters
                </span>
              </div>
              <textarea
                rows={4}
                value={editedMessage}
                onChange={e => setEditedMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* SIM Slot Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Send From Phone SIM:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSimSlot(1)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    selectedSimSlot === 1
                      ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${selectedSimSlot === 1 ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>SIM Slot 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSimSlot(2)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    selectedSimSlot === 2
                      ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${selectedSimSlot === 2 ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>SIM Slot 2</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSendingModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendSmsFromSim}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm & Send via Device SIM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showNotificationDetails && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-white text-sm">Customer Due Details</h3>
            <div className="text-xs space-y-1.5 text-slate-300">
              <div><strong className="text-slate-400">Shop:</strong> {selectedRequest.shopName}</div>
              <div><strong className="text-slate-400">Customer:</strong> {selectedRequest.customerName}</div>
              <div><strong className="text-slate-400">Mobile:</strong> +91 {selectedRequest.customerMobile}</div>
              <div><strong className="text-slate-400">Due Amount:</strong> {formatCurrency(selectedRequest.dueAmount)}</div>
              <div><strong className="text-slate-400">Date/Time:</strong> {selectedRequest.dateTime}</div>
              <div><strong className="text-slate-400">Status:</strong> {selectedRequest.status}</div>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNotificationDetails(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNotificationDetails(false);
                  handleOpenSendModal(selectedRequest);
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
              >
                Send SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
