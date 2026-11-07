import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  MapPin,
  Calendar,
  MessageCircle,
  FileText,
  Printer,
  Trash2,
  X,
  Building2,
  UserCheck,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Edit2,
  CreditCard,
  Copy,
  Check,
  Share2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { KhataParty, KhataEntry } from '../types';
import { formatCurrency } from '../lib/accounting';
import { getTodayDateString } from '../data/defaults';

interface KhataBookViewProps {
  onOpenAndroidApp?: () => void;
}

export const KhataBookView: React.FC<KhataBookViewProps> = ({ onOpenAndroidApp }) => {
  const { user } = useAuth();
  const {
    khataParties,
    khataEntries,
    smsLogs,
    simSmsQueue,
    pendingSimSmsCount,
    createSimSms,
    updateSimSmsStatus,
    retrySms,
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
    shopSettings,
  } = useShop();

  const { language } = useLanguage();
  const [dueConfirmedToast, setDueConfirmedToast] = useState('');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState<'all' | 'customer' | 'supplier' | 'due'>('all');

  // Modals state
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<KhataParty | null>(null);

  const [activeEntryParty, setActiveEntryParty] = useState<KhataParty | null>(null);
  const [activeEntryType, setActiveEntryType] = useState<'you_gave' | 'you_got'>('you_gave');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  const [activeStatementParty, setActiveStatementParty] = useState<KhataParty | null>(null);
  const [activeReminderParty, setActiveReminderParty] = useState<KhataParty | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Form states for Party
  const [partyName, setPartyName] = useState('');
  const [partyMobile, setPartyMobile] = useState('');
  const [partyType, setPartyType] = useState<'customer' | 'supplier'>('customer');
  const [partyDate, setPartyDate] = useState(getTodayDateString());
  const [partyAddress, setPartyAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingBalanceDirection, setOpeningBalanceDirection] = useState<'you_will_get' | 'you_will_give'>('you_will_get');

  // Form states for Entry
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDate, setEntryDate] = useState(getTodayDateString());
  const [entryNote, setEntryNote] = useState('');
  const [entryBillNumber, setEntryBillNumber] = useState('');
  const [entryDueDate, setEntryDueDate] = useState('');
  const [entryPaymentMethod, setEntryPaymentMethod] = useState<'cash' | 'upi' | 'bank'>('cash');

  // Filtered parties
  const filteredParties = useMemo(() => {
    return khataParties.filter(party => {
      // Type filter
      if (partyTypeFilter === 'customer' && party.type !== 'customer') return false;
      if (partyTypeFilter === 'supplier' && party.type !== 'supplier') return false;
      if (partyTypeFilter === 'due' && party.currentBalance === 0) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = party.name.toLowerCase().includes(q);
        const matchPhone = party.mobile.toLowerCase().includes(q);
        const matchAddr = party.address ? party.address.toLowerCase().includes(q) : false;
        if (!matchName && !matchPhone && !matchAddr) return false;
      }
      return true;
    });
  }, [khataParties, partyTypeFilter, searchTerm]);

  // Open modal helpers
  const handleOpenAddParty = (type: 'customer' | 'supplier' = 'customer') => {
    setEditingParty(null);
    setPartyName('');
    setPartyMobile('');
    setPartyType(type);
    setPartyDate(getTodayDateString());
    setPartyAddress('');
    setOpeningBalance('');
    setOpeningBalanceDirection(type === 'customer' ? 'you_will_get' : 'you_will_give');
    setIsAddPartyModalOpen(true);
  };

  const handleOpenEditParty = (party: KhataParty) => {
    setEditingParty(party);
    setPartyName(party.name);
    setPartyMobile(party.mobile);
    setPartyType(party.type);
    setPartyDate(party.date || party.createdAt.slice(0, 10) || getTodayDateString());
    setPartyAddress(party.address || '');
    setOpeningBalance('');
    setIsAddPartyModalOpen(true);
  };

  const handleSaveParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) return;

    if (editingParty) {
      updateKhataParty(editingParty.id, {
        name: partyName.trim(),
        mobile: partyMobile.trim(),
        type: partyType,
        date: partyDate,
        address: partyAddress.trim() || undefined,
      });
    } else {
      // Check if opening balance is provided
      const initialAmt = parseFloat(openingBalance);
      let initialEntry: { amount: number; type: 'you_gave' | 'you_got'; date: string; note?: string } | undefined;

      if (initialAmt && initialAmt > 0) {
        const isCustomer = partyType === 'customer';
        const entryType =
          openingBalanceDirection === 'you_will_get'
            ? isCustomer
              ? 'you_gave'
              : 'you_gave'
            : isCustomer
            ? 'you_got'
            : 'you_got';

        initialEntry = {
          amount: initialAmt,
          type: entryType,
          date: partyDate,
          note: language === 'en' ? 'Opening Balance' : 'প্রারম্ভিক বকেয়া (Opening Balance)',
        };
      }

      // Add atomically in single call
      addKhataParty(
        {
          name: partyName.trim(),
          mobile: partyMobile.trim(),
          type: partyType,
          date: partyDate,
          address: partyAddress.trim() || undefined,
        },
        initialEntry
      );
    }

    setIsAddPartyModalOpen(false);
  };

  const handleOpenAddEntry = (party: KhataParty, type: 'you_gave' | 'you_got') => {
    setActiveEntryParty(party);
    setActiveEntryType(type);
    setEntryAmount('');
    setEntryDate(getTodayDateString());
    setEntryNote('');
    setEntryBillNumber('');
    setEntryDueDate('');
    setEntryPaymentMethod('cash');
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntryParty) return;
    const amt = parseFloat(entryAmount);
    if (!amt || amt <= 0) return;

    const newEntryId = addKhataEntry({
      partyId: activeEntryParty.id,
      type: activeEntryType,
      amount: amt,
      date: entryDate,
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      note: entryNote.trim() || undefined,
      billNumber: entryBillNumber.trim() || undefined,
      dueDate: entryDueDate || undefined,
      paymentMethod: entryPaymentMethod,
    });

    // Create Pending SIM SMS request for the Shopkeeper's Android App (No API keys required)
    if (activeEntryParty.mobile) {
      const remainingBal = activeEntryType === 'you_gave'
        ? (Number(activeEntryParty.currentBalance) || 0) + amt
        : Math.max(0, (Number(activeEntryParty.currentBalance) || 0) - amt);

      createSimSms({
        partyId: activeEntryParty.id,
        entryId: newEntryId,
        customerName: activeEntryParty.name,
        customerMobile: activeEntryParty.mobile,
        shopName: user?.shopName || shopSettings.shopName,
        dueAmount: amt,
        remainingBalance: remainingBal,
        transactionType: activeEntryType === 'you_gave' ? 'Due' : 'Payment',
        dateTime: `${entryDate} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        language: 'bn',
      });

      setDueConfirmedToast(
        language === 'en'
          ? `Due Confirmed! SIM SMS notification sent to Shopkeeper Android App for ${activeEntryParty.name} (+91 ${activeEntryParty.mobile}).`
          : `বাকি কনফার্ম হয়েছে! ${activeEntryParty.name}-এর (+91 ${activeEntryParty.mobile}) জন্য দোকানদার অ্যান্ড্রয়েড ফোনে নোটিফিকেশন পাঠানো হয়েছে।`
      );
      setTimeout(() => setDueConfirmedToast(''), 6000);
    }

    setIsEntryModalOpen(false);
  };

  // Helper to construct WhatsApp reminder message & links
  const getPartyReminderDetails = (party: KhataParty) => {
    const cleanPhone = party.mobile.replace(/\D/g, '');
    const phoneToUse = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const balanceAbs = Math.abs(party.currentBalance);
    const balanceFormatted = formatCurrency(balanceAbs);
    const partyEntries = getPartyEntries(party.id);
    const totalGave = partyEntries.filter(e => e.type === 'you_gave').reduce((sum, e) => sum + e.amount, 0);
    const totalGot = partyEntries.filter(e => e.type === 'you_got').reduce((sum, e) => sum + e.amount, 0);

    let message = '';
    if (party.currentBalance > 0) {
      message =
        language === 'en'
          ? `Namaskar ${party.name} ji,\n\nThis is a friendly reminder from ${shopSettings.shopName}.\n\n• Total Due (মোট বাকি): ${formatCurrency(totalGave)}\n• Total Paid (মোট জমা): ${formatCurrency(totalGot)}\n• Net Pending Due (বকেয়া পাওনা): ${balanceFormatted}\n\nPlease pay at our shop or via UPI ID: ${shopSettings.upiId || 'shop UPI'}.\n\nThank you!`
          : `নমস্কার ${party.name} মহাশয়/মহাশয়া,\n\n${shopSettings.shopName}-এর পক্ষ থেকে বিনীত স্মরণপত্র:\n\n• মোট বাকি হিসাব: ${formatCurrency(totalGave)}\n• মোট জমা দেওয়া: ${formatCurrency(totalGot)}\n• অবশিষ্ট বাকি পাওনা: ${balanceFormatted}\n\nঅনুগ্রহ করে দোকানে এসে অথবা UPI মাধ্যমে পরিশোধ করুন (UPI: ${shopSettings.upiId || 'shop UPI'})।\n\nধন্যবাদ!`;
    } else if (party.currentBalance < 0) {
      message =
        language === 'en'
          ? `Namaskar ${party.name} ji, regarding ledger with ${shopSettings.shopName}: balance payable to you is ${balanceFormatted}. Total Received: ${formatCurrency(totalGot)}, Total Paid: ${formatCurrency(totalGave)}. Thank you!`
          : `নমস্কার ${party.name} মহাশয়, ${shopSettings.shopName}-এর খতিয়ান অনুযায়ী আপনার প্রাপ্য রয়েছে ${balanceFormatted}। মোট জমা: ${formatCurrency(totalGot)}, মোট পরিষদ: ${formatCurrency(totalGave)}। হিসাব মিলিয়ে নেবেন। ধন্যবাদ!`;
    } else {
      message =
        language === 'en'
          ? `Namaskar ${party.name} ji, your account balance with ${shopSettings.shopName} is fully settled (₹0). Total transactions: ${partyEntries.length}. Thank you for doing business with us!`
          : `নমস্কার ${party.name} মহাশয়, ${shopSettings.shopName}-এ আপনার সমস্ত হিসাব পরিশোধিত (₹০)। আমাদের সাথে লেনদেন করার জন্য অসংখ্য ধন্যবাদ!`;
    }

    const encoded = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneToUse}&text=${encoded}`;
    const waWebUrl = `https://web.whatsapp.com/send?phone=${phoneToUse}&text=${encoded}`;
    const smsUrl = `sms:${phoneToUse}?body=${encoded}`;

    return {
      phoneToUse,
      message,
      waUrl,
      waWebUrl,
      smsUrl,
      totalGave,
      totalGot,
      balanceAbs,
      balanceFormatted,
    };
  };

  const handleCopyMessage = (msg: string) => {
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  const handleNativeShare = async (party: KhataParty) => {
    const details = getPartyReminderDetails(party);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${shopSettings.shopName} - Khata Statement`,
          text: details.message,
        });
      } catch (e) {
        // user cancelled or share unsupported
      }
    } else {
      handleCopyMessage(details.message);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Users className="w-5 h-5 text-white" />
              </span>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {language === 'en' ? 'Digital Khata Book' : 'ডিজিটাল খাতা বুক (বাকি ও উধার খতিয়ান)'}
                </h1>
                <p className="text-xs text-white/80 font-medium">
                  {language === 'en'
                    ? 'Total Due, Total Paid, customer credit ledger, SIM SMS reminders & printable statements'
                    : 'গ্রাহকদের মোট বাকি, মোট জমা, মহাজনদের দেনা-পাওনা ও মোবাইল সিম SMS তাগাদা খতিয়ান'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleOpenAddParty('customer')}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>{language === 'en' ? '+ Add Customer' : '+ গ্রাহক যোগ করুন'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddParty('supplier')}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs md:text-sm flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-white" />
              <span>{language === 'en' ? '+ Add Supplier' : '+ মহাজন যোগ করুন'}</span>
            </button>
          </div>
        </div>

        {/* 4 Prominent Summary Cards (Total Due, Total Paid, Net Receivable, Net Payable) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Customer Credit / Total Due (মোট বাকি ধার) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                {language === 'en' ? 'Total Due (Credit)' : 'মোট বাকি (Total Due)'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight">
              {formatCurrency(totalCustomerDue)}
            </div>
            <p className="text-[11px] text-white/70 mt-1">
              {language === 'en' ? 'Total goods/services given on credit' : 'গ্রাহকদের দেওয়া মোট বাকি মাল ও সার্ভিস'}
            </p>
          </div>

          {/* 2. Total Customer Paid (মোট জমা / আদায়) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                {language === 'en' ? 'Total Paid (Jama)' : 'মোট জমা (Total Paid)'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {formatCurrency(totalCustomerPaid)}
            </div>
            <p className="text-[11px] text-white/70 mt-1">
              {language === 'en' ? 'Total payments collected from customers' : 'গ্রাহকদের কাছ থেকে মোট জমা বা আদায়'}
            </p>
          </div>

          {/* 3. Net You Will Get (বর্তমান মোট পাবেন) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-lg relative overflow-hidden ring-1 ring-amber-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                {language === 'en' ? 'Net You Will Get' : 'বর্তমান পাবেন (Net Due)'}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                {khataParties.filter(p => p.currentBalance > 0).length} {language === 'en' ? 'due' : 'জন'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
              {formatCurrency(totalYouWillGet)}
            </div>
            <p className="text-[11px] text-white/70 mt-1">
              {language === 'en' ? 'Net pending customer balance' : 'বর্তমান অবশিষ্ট বাকি পাওনা'}
            </p>
          </div>

          {/* 4. Total You Will Give (মহাজনদের দেনা) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                {language === 'en' ? 'Total You Will Give' : 'মহাজন দেনা (Supplier)'}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                {khataParties.filter(p => p.currentBalance < 0).length} {language === 'en' ? 'parties' : 'জন'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-300 font-mono tracking-tight">
              {formatCurrency(totalYouWillGive)}
            </div>
            <p className="text-[11px] text-white/70 mt-1">
              {language === 'en' ? 'Payable to dealers & suppliers' : 'ডিলার বা মহাজনদের মোট পাওনা'}
            </p>
          </div>
        </div>
      </div>

      {/* Toast Alert for Due Confirmation & SIM SMS Queue */}
      {dueConfirmedToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-300">{dueConfirmedToast}</p>
              <p className="text-xs text-white/70">
                {language === 'en'
                  ? 'Request waiting in Android App for instant 1-tap SIM card SMS sending.'
                  : 'অ্যান্ড্রয়েড অ্যাপে পেন্ডিং রয়েছে, ১-ট্যাপে নিজের সিম কার্ড দিয়ে SMS পাঠিয়ে দিন।'}
              </p>
            </div>
          </div>
          {onOpenAndroidApp && (
            <button
              type="button"
              onClick={onOpenAndroidApp}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shrink-0 shadow-lg cursor-pointer"
            >
              <span>📱 {language === 'en' ? 'Open Android SIM App' : 'অ্যান্ড্রয়েড অ্যাপ খুলুন'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Android SIM SMS Companion Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                {language === 'en' ? 'Android Phone SIM SMS System' : 'মোবাইল সিম কার্ড SMS সিস্টেম (Android App)'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {language === 'en' ? 'Zero API Keys • 100% Free' : 'ফ্রি সিম SMS'}
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              {language === 'en'
                ? 'Send due reminder SMS to customers directly from your Android phone SIM card. Pending requests:'
                : 'ওয়েবসাইটে বাকি লিখে "Confirm Due" চাপলে দোকানদারের অ্যান্ড্রয়েড ফোনে নোটিফিকেশন যায় এবং সিম দিয়ে SMS পাঠানো হয়:'}{' '}
              <span className="font-bold text-amber-300 font-mono">{pendingSimSmsCount} {language === 'en' ? 'pending' : 'টি পেন্ডিং'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenAndroidApp && (
            <button
              type="button"
              onClick={onOpenAndroidApp}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <span>📱 {language === 'en' ? 'Open Android App' : 'অ্যান্ড্রয়েড অ্যাপে যান'}</span>
              {pendingSimSmsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {pendingSimSmsCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 md:p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setPartyTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                partyTypeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-white/90 hover:bg-slate-750'
              }`}
            >
              {language === 'en' ? 'All Accounts' : 'সকল খাতা'} ({khataParties.length})
            </button>

            <button
              type="button"
              onClick={() => setPartyTypeFilter('customer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                partyTypeFilter === 'customer'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-white/90 hover:bg-slate-750'
              }`}
            >
              {language === 'en' ? 'Customers' : 'গ্রাহক (Customers)'} (
              {khataParties.filter(p => p.type === 'customer').length})
            </button>

            <button
              type="button"
              onClick={() => setPartyTypeFilter('supplier')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                partyTypeFilter === 'supplier'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800 text-white/90 hover:bg-slate-750'
              }`}
            >
              {language === 'en' ? 'Suppliers' : 'মহাজন (Suppliers)'} (
              {khataParties.filter(p => p.type === 'supplier').length})
            </button>

            <button
              type="button"
              onClick={() => setPartyTypeFilter('due')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                partyTypeFilter === 'due'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-800 text-white/90 hover:bg-slate-750'
              }`}
            >
              {language === 'en' ? 'Pending Due Only' : 'বকেয়া খাতা (Due)'} (
              {khataParties.filter(p => p.currentBalance !== 0).length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={language === 'en' ? 'Search by name, mobile, address...' : 'নাম, মোবাইল বা ঠিকানা দিয়ে খুঁজুন...'}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs md:text-sm text-white placeholder-white/50 focus:outline-none focus:border-blue-500 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Party Cards List */}
      {filteredParties.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <Users className="w-7 h-7 text-white/70" />
          </div>
          <h3 className="text-base font-bold text-white">
            {searchTerm
              ? language === 'en'
                ? 'No matching parties found'
                : 'কোনো খাতা বা পার্টি পাওয়া যায়নি'
              : language === 'en'
              ? 'No parties in this category'
              : 'এই ক্যাটাগরিতে কোনো খাতা নেই'}
          </h3>
          <p className="text-xs text-white/70 max-w-sm mx-auto">
            {language === 'en'
              ? 'Add a customer or supplier to track total due, total paid, and send WhatsApp reminders.'
              : 'গ্রাহক বা সাপ্লায়ারের নাম যোগ করে মোট বাকি ও মোট জমা হিসাব রাখা শুরু করুন।'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleOpenAddParty('customer')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? '+ Add Customer' : '+ গ্রাহক যোগ করুন'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddParty('supplier')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>{language === 'en' ? '+ Add Supplier' : '+ মহাজন যোগ করুন'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParties.map(party => {
            const isCustomer = party.type === 'customer';
            const entries = getPartyEntries(party.id);
            const totalGave = entries.filter(e => e.type === 'you_gave').reduce((sum, e) => sum + e.amount, 0);
            const totalGot = entries.filter(e => e.type === 'you_got').reduce((sum, e) => sum + e.amount, 0);
            const balanceAbs = Math.abs(party.currentBalance);
            const partyDateDisplay = party.date || (party.createdAt ? party.createdAt.slice(0, 10) : getTodayDateString());
            const lastEntry = entries.length > 0 ? entries[0] : null;

            return (
              <div
                key={party.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-lg relative group"
              >
                {/* Party Header Info */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base text-white shadow-md ${
                          isCustomer
                            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                            : 'bg-gradient-to-tr from-amber-600 to-orange-600'
                        }`}
                      >
                        {party.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base leading-tight">{party.name}</h3>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCustomer
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isCustomer
                              ? language === 'en'
                                ? 'Customer'
                                : 'গ্রাহক'
                              : language === 'en'
                              ? 'Supplier'
                              : 'মহাজন'}
                          </span>
                        </div>
                        {party.mobile && (
                          <div className="flex items-center gap-1.5 text-xs text-white/70 mt-0.5">
                            <Phone className="w-3 h-3 text-white/60" />
                            <span>{party.mobile}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-white/60 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 text-white/50" />
                            <span>{partyDateDisplay}</span>
                          </span>
                          {party.address && (
                            <span className="flex items-center gap-1">
                              • <MapPin className="w-2.5 h-2.5 text-white/50" />
                              <span className="truncate max-w-[120px]">{party.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditParty(party)}
                        className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title={language === 'en' ? 'Edit Details' : 'তথ্য এডিট'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              language === 'en'
                                ? `Are you sure you want to delete ${party.name}? All transaction history for this party will be deleted.`
                                : `আপনি কি নিশ্চিত যে ${party.name}-এর সম্পূর্ণ খাতা ও লেনদেন ডিলিট করতে চান?`
                            )
                          ) {
                            deleteKhataParty(party.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title={language === 'en' ? 'Delete Party' : 'মুছে ফেলুন'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Complete Breakdown Display: Total Due, Total Paid, Net Balance */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 my-3 space-y-2">
                    {/* Total Due & Total Paid Ribbon */}
                    <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800/80">
                      <div>
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                          {isCustomer
                            ? language === 'en'
                              ? 'Total Due (বাকি)'
                              : 'মোট বাকি (Due)'
                            : language === 'en'
                            ? 'Total Paid (পরিশোধ)'
                            : 'মোট পরিশোধ (Paid)'}
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-white">
                          {formatCurrency(totalGave)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          {isCustomer
                            ? language === 'en'
                              ? 'Total Paid (জমা)'
                              : 'মোট জমা (Paid)'
                            : language === 'en'
                            ? 'Total Bills (চালান)'
                            : 'মোট মাল ক্রয় (Bills)'}
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-white">
                          {formatCurrency(totalGot)}
                        </span>
                      </div>
                    </div>

                    {/* Net Balance Row */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div>
                        <span className="text-xs font-semibold text-white/80 block">
                          {party.currentBalance > 0
                            ? isCustomer
                              ? language === 'en'
                                ? 'Net Due to Collect (পাবেন)'
                                : 'পাবেন (Net Due)'
                              : language === 'en'
                              ? 'Advance to Supplier (পাবেন)'
                              : 'অগ্রিম দেওয়া (পাবেন)'
                            : party.currentBalance < 0
                            ? isCustomer
                              ? language === 'en'
                                ? 'Customer Advance (দেবেন)'
                                : 'অগ্রিম জমা (দেবেন)'
                              : language === 'en'
                              ? 'Payable to Supplier (দেবেন)'
                              : 'দেবেন (Payable)'
                            : language === 'en'
                            ? 'Settled (পরিশোধিত)'
                            : 'পরিশোধিত (Settled)'}
                        </span>
                        <span className="text-[10px] text-white/50">
                          {entries.length} {language === 'en' ? 'entries' : 'টি এন্ট্রি'}
                          {lastEntry && ` • ${language === 'en' ? 'Last:' : 'শেষ:'} ${lastEntry.date}`}
                        </span>
                      </div>

                      <span
                        className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                          party.currentBalance > 0
                            ? 'text-emerald-400'
                            : party.currentBalance < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {formatCurrency(balanceAbs)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Grid: Gave, Got, Send WhatsApp / Reminder, Statement */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2">
                    {/* You Gave (Red) */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddEntry(party, 'you_gave')}
                      className="py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                      <span>{language === 'en' ? 'You Gave' : 'দিলাম (উধার)'}</span>
                    </button>

                    {/* You Got (Green) */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddEntry(party, 'you_got')}
                      className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'en' ? 'You Got' : 'পেলাম (জমা)'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Send Reminder / Customer Sent */}
                    <button
                      type="button"
                      onClick={() => {
                        setCopiedSuccess(false);
                        setActiveReminderParty(party);
                      }}
                      className="py-1.5 px-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'en' ? 'Send Reminder' : 'তাগাদা পাঠান'}</span>
                    </button>

                    {/* View Statement */}
                    <button
                      type="button"
                      onClick={() => setActiveStatementParty(party)}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-[11px] border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>{language === 'en' ? 'Statement' : 'স্টেটমেন্ট'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL 1: ADD / EDIT PARTY ================= */}
      {isAddPartyModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsAddPartyModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-black text-white">
                  {editingParty
                    ? language === 'en'
                      ? 'Edit Party Details'
                      : 'খাতার তথ্য পরিবর্তন'
                    : partyType === 'customer'
                    ? language === 'en'
                      ? 'Add New Customer'
                      : 'নতুন গ্রাহক যোগ করুন'
                    : language === 'en'
                    ? 'Add New Supplier'
                    : 'নতুন মহাজন যোগ করুন'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPartyModalOpen(false)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParty} className="space-y-4">
              {/* Party Type Selector (Only when adding) */}
              {!editingParty && (
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5 uppercase tracking-wider">
                    {language === 'en' ? 'Party Type *' : 'খাতার ধরন *'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPartyType('customer');
                        setOpeningBalanceDirection('you_will_get');
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        partyType === 'customer'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-950 text-white/80 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{language === 'en' ? 'Customer (গ্রাহক)' : 'গ্রাহক (Customer)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPartyType('supplier');
                        setOpeningBalanceDirection('you_will_give');
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        partyType === 'supplier'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                          : 'bg-slate-950 text-white/80 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>{language === 'en' ? 'Supplier (মহাজন)' : 'মহাজন (Supplier)'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  {language === 'en' ? 'Full Name *' : 'নাম (Name) *'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={partyName}
                  onChange={e => setPartyName(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Sujit Patra' : 'যেমন: সুজিত পাত্র'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              {/* Mobile Number & Date in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mobile */}
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    {language === 'en' ? 'Mobile Number' : 'মোবাইল নম্বর'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/50">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={partyMobile}
                      onChange={e => setPartyMobile(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit number"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500 font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Customer Account Date */}
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    {language === 'en' ? 'Date (তারিখ) *' : 'তারিখ (Date) *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={partyDate}
                    onChange={e => setPartyDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Address / Location */}
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  {language === 'en' ? 'Address / Village (Optional)' : 'ঠিকানা বা গ্রাম (ঐচ্ছিক)'}
                </label>
                <input
                  type="text"
                  value={partyAddress}
                  onChange={e => setPartyAddress(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Radhamadhabpur, Block-II' : 'যেমন: রাধামাধবপুর'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Opening Balance (Only for new party) */}
              {!editingParty && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-white">
                      {language === 'en' ? 'Previous / Opening Balance' : 'পূর্ববর্তী বকেয়া / বাকি (যদি থাকে)'}
                    </label>
                    <span className="text-[10px] text-white/50">Optional</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOpeningBalanceDirection('you_will_get')}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        openingBalanceDirection === 'you_will_get'
                          ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                          : 'bg-slate-900 text-white/60 border-slate-700'
                      }`}
                    >
                      {language === 'en' ? 'You Will Get (পাবেন)' : 'পাবেন (You Will Get)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpeningBalanceDirection('you_will_give')}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        openingBalanceDirection === 'you_will_give'
                          ? 'bg-rose-600/30 text-rose-300 border-rose-500'
                          : 'bg-slate-900 text-white/60 border-slate-700'
                      }`}
                    >
                      {language === 'en' ? 'You Will Give (দেবেন)' : 'দেবেন (You Will Give)'}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/50">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={openingBalance}
                      onChange={e => setOpeningBalance(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddPartyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {editingParty
                    ? language === 'en'
                      ? 'Update Details'
                      : 'তথ্য আপডেট'
                    : language === 'en'
                    ? '+ Save Customer'
                    : '+ গ্রাহক সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD KHATA ENTRY (YOU GAVE / YOU GOT) ================= */}
      {isEntryModalOpen && activeEntryParty && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsEntryModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      activeEntryType === 'you_gave' ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                  <h2 className="text-lg font-black text-white">
                    {activeEntryType === 'you_gave'
                      ? language === 'en'
                        ? 'You Gave (দিলাম / উধার)'
                        : 'দিলাম (You Gave)'
                      : language === 'en'
                      ? 'You Got (পেলাম / জমা)'
                      : 'পেলাম (You Got)'}
                  </h2>
                </div>
                <p className="text-xs text-white/70 font-semibold mt-0.5">
                  {language === 'en' ? 'Party:' : 'খাতার নাম:'}{' '}
                  <span className="text-white font-bold">{activeEntryParty.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEntryModalOpen(false)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              {/* Type toggle buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveEntryType('you_gave')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeEntryType === 'you_gave'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-slate-950 text-white/70 border border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{language === 'en' ? 'You Gave (Red)' : 'দিলাম (উধার / ক্রেডিট)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEntryType('you_got')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeEntryType === 'you_got'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-950 text-white/70 border border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>{language === 'en' ? 'You Got (Green)' : 'পেলাম (পেমেন্ট / জমা)'}</span>
                </button>
              </div>

              {/* Big Amount Input */}
              <div>
                <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">
                  {language === 'en' ? 'Amount (₹) *' : 'টাকার পরিমাণ (₹) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-black text-white/60">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    autoFocus
                    value={entryAmount}
                    onChange={e => setEntryAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl pl-9 pr-4 py-3 text-2xl font-black text-white placeholder-white/40 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Date & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    {language === 'en' ? 'Transaction Date *' : 'লেনদেনের তারিখ *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    {language === 'en' ? 'Due Date (Optional)' : 'পরিশোধের শেষ তারিখ'}
                  </label>
                  <input
                    type="date"
                    value={entryDueDate}
                    onChange={e => setEntryDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Note / Details */}
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  {language === 'en' ? 'Items / Note / Reason' : 'বিবরণ / মালের বিবরণ / নোট'}
                </label>
                <input
                  type="text"
                  value={entryNote}
                  onChange={e => setEntryNote(e.target.value)}
                  placeholder={
                    activeEntryType === 'you_gave'
                      ? language === 'en'
                        ? 'e.g. 5 Xerox, Online Form & Laminate'
                        : 'যেমন: ৫ পাতা জেরক্স ও ফর্ম ফিলাপ'
                      : language === 'en'
                      ? 'e.g. Cash received by hand'
                      : 'যেমন: নগদে জমা পেয়েছি'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Bill No & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    {language === 'en' ? 'Bill / Invoice No.' : 'বিল / চালান নম্বর'}
                  </label>
                  <input
                    type="text"
                    value={entryBillNumber}
                    onChange={e => setEntryBillNumber(e.target.value)}
                    placeholder="INV-001"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    {language === 'en' ? 'Payment Method' : 'পেমেন্ট মাধ্যম'}
                  </label>
                  <select
                    value={entryPaymentMethod}
                    onChange={e => setEntryPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="cash">{language === 'en' ? 'Cash (নগদ)' : 'নগদ ক্যাশ'}</option>
                    <option value="upi">{language === 'en' ? 'UPI (PhonePe/GPay)' : 'UPI পেমেন্ট'}</option>
                    <option value="bank">{language === 'en' ? 'Bank Transfer' : 'ব্যাংক ট্রান্সফার'}</option>
                  </select>
                </div>
              </div>

              {/* Automatic SIM SMS Notification Indicator & Preview (Zero API Keys) */}
              {activeEntryParty.mobile && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'en' ? 'Free Phone SIM SMS (No API Key)' : 'ফ্রি মোবাইল সিম SMS (API Key লাগবে না)'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                      {language === 'en' ? 'Direct Carrier SIM' : 'মোবাইল সিম যুক্ত'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal">
                    {language === 'en'
                      ? `When you click "${activeEntryType === 'you_gave' ? 'Confirm Due' : 'Confirm Payment'}", this transaction is saved and an SMS notification is instantly pushed to your Shopkeeper Android App to send to +91 ${activeEntryParty.mobile} via your SIM card.`
                      : `"${activeEntryType === 'you_gave' ? 'Confirm Due' : 'Confirm Payment'}" বোতামে চাপলেই লেনদেনটি সেভ হবে এবং দোকানদারের অ্যান্ড্রয়েড ফোনে গ্রাহকের (+91 ${activeEntryParty.mobile}) নম্বরে সিম দিয়ে SMS পাঠানোর নোটিফিকেশন যাবে।`}
                  </p>

                  {/* Live SMS Preview */}
                  {parseFloat(entryAmount) > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-300 font-mono leading-relaxed select-all">
                      {activeEntryType === 'you_got'
                        ? `Dear ${activeEntryParty.name}, we have received your payment of ₹${parseFloat(entryAmount).toLocaleString('en-IN')}. Your remaining due balance is ₹${Math.max(0, activeEntryParty.currentBalance - parseFloat(entryAmount)).toLocaleString('en-IN')}. Thank you for your payment. – ${user?.shopName || shopSettings.shopName}`
                        : `Dear ${activeEntryParty.name}, ₹${parseFloat(entryAmount).toLocaleString('en-IN')} has been added to your account. Your updated balance is ₹${Math.max(0, activeEntryParty.currentBalance + parseFloat(entryAmount)).toLocaleString('en-IN')}. Please check your account details. – ${user?.shopName || shopSettings.shopName}`}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl font-black text-xs text-white shadow-xl active:scale-95 transition-all cursor-pointer flex items-center gap-2 ${
                    activeEntryType === 'you_gave'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {activeEntryType === 'you_gave'
                      ? language === 'en'
                        ? 'Confirm Due'
                        : 'Confirm Due (বাকি নিশ্চিত করুন)'
                      : language === 'en'
                      ? 'Confirm Payment'
                      : 'Confirm Payment (পেমেন্ট নিশ্চিত করুন)'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: SEND REMINDER & STATEMENT (CUSTOMER SENT) ================= */}
      {activeReminderParty && (() => {
        const details = getPartyReminderDetails(activeReminderParty);
        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150 overflow-y-auto"
            onClick={() => setActiveReminderParty(null)}
          >
            <div
              className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 md:p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white">
                      {language === 'en' ? 'Send Reminder & Statement' : 'তাগাদা ও রসিদ পাঠান'}
                    </h2>
                    <p className="text-xs text-white/70">
                      {activeReminderParty.name} {activeReminderParty.mobile && `• +91 ${activeReminderParty.mobile}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReminderParty(null)}
                  className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Outstanding Summary Cards */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                <div>
                  <span className="text-[10px] font-bold text-rose-400 block uppercase">
                    {language === 'en' ? 'Total Due' : 'মোট বাকি'}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white font-mono">
                    {formatCurrency(details.totalGave)}
                  </span>
                </div>
                <div className="border-x border-slate-800">
                  <span className="text-[10px] font-bold text-emerald-400 block uppercase">
                    {language === 'en' ? 'Total Paid' : 'মোট জমা'}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white font-mono">
                    {formatCurrency(details.totalGot)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 block uppercase">
                    {language === 'en' ? 'Pending Due' : 'অবশিষ্ট বাকি'}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                    {details.balanceFormatted}
                  </span>
                </div>
              </div>

              {/* Message Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>{language === 'en' ? 'Message to Send:' : 'মেসেজ প্রিভিউ:'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(details.message)}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSuccess ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {language === 'en' ? 'Copied!' : 'কপি হয়েছে!'}
                      </span>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{language === 'en' ? 'Copy Text' : 'টেক্সট কপি'}</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white/90 font-mono whitespace-pre-wrap leading-relaxed select-all">
                  {details.message}
                </div>
              </div>

              {/* Action Buttons: Direct WhatsApp Link, SMS, Copy, Share */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {/* 1. Direct Clickable WhatsApp Anchor Link (Never blocked by popup blockers!) */}
                {activeReminderParty.mobile ? (
                  <a
                    href={details.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all text-center no-underline"
                  >
                    <MessageCircle className="w-5 h-5 text-white" />
                    <span>{language === 'en' ? 'Send WhatsApp Message' : 'হোয়াটসঅ্যাপে মেসেজ পাঠান'}</span>
                    <ExternalLink className="w-4 h-4 text-emerald-200" />
                  </a>
                ) : (
                  <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {language === 'en'
                        ? 'No mobile number set for this party. Please edit party and add mobile number.'
                        : 'এই খাতার কোনো মোবাইল নম্বর দেওয়া নেই। অনুগ্রহ করে এডিট করে মোবাইল নম্বর দিন।'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {/* SMS Link */}
                  {activeReminderParty.mobile && (
                    <a
                      href={details.smsUrl}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center no-underline"
                    >
                      <Send className="w-3.5 h-3.5 text-blue-400" />
                      <span>{language === 'en' ? 'Send Normal SMS' : 'স্বাভাবিক SMS পাঠান'}</span>
                    </a>
                  )}

                  {/* Share via Native drawer */}
                  <button
                    type="button"
                    onClick={() => handleNativeShare(activeReminderParty)}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'en' ? 'Share Statement' : 'শেয়ার করুন'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL 4: PARTY STATEMENT & TRANSACTION HISTORY ================= */}
      {activeStatementParty && (() => {
        const entries = getPartyEntries(activeStatementParty.id);
        const totalGave = entries.filter(e => e.type === 'you_gave').reduce((sum, e) => sum + e.amount, 0);
        const totalGot = entries.filter(e => e.type === 'you_got').reduce((sum, e) => sum + e.amount, 0);
        const balanceAbs = Math.abs(activeStatementParty.currentBalance);

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150 overflow-y-auto"
            onClick={() => setActiveStatementParty(null)}
          >
            <div
              className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-4 md:p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-800 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg md:text-xl font-black text-white">
                      {language === 'en' ? 'Account Statement & Ledger' : 'খতিয়ান স্টেটমেন্ট ও লেজার'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                    <span className="font-bold text-white text-sm">{activeStatementParty.name}</span>
                    {activeStatementParty.mobile && <span>• +91 {activeStatementParty.mobile}</span>}
                    {activeStatementParty.date && <span>• Started: {activeStatementParty.date}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>{language === 'en' ? 'Print' : 'প্রিন্ট'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStatementParty(null)}
                    className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Statement Summary Ribbon */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 shrink-0">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                    {language === 'en' ? 'Total Due (দিলাম)' : 'মোট বাকি (Total Due)'}
                  </span>
                  <span className="text-sm md:text-base font-black text-white font-mono">
                    {formatCurrency(totalGave)}
                  </span>
                </div>
                <div className="text-center border-x border-slate-800">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    {language === 'en' ? 'Total Paid (পেলাম)' : 'মোট জমা (Total Paid)'}
                  </span>
                  <span className="text-sm md:text-base font-black text-white font-mono">
                    {formatCurrency(totalGot)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    {activeStatementParty.currentBalance >= 0
                      ? language === 'en'
                        ? 'Net You Will Get'
                        : 'অবশিষ্ট পাবেন'
                      : language === 'en'
                      ? 'Net You Will Give'
                      : 'অবশিষ্ট দেবেন'}
                  </span>
                  <span
                    className={`text-sm md:text-base font-black font-mono ${
                      activeStatementParty.currentBalance > 0
                        ? 'text-emerald-400'
                        : activeStatementParty.currentBalance < 0
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {formatCurrency(balanceAbs)}
                  </span>
                </div>
              </div>

              {/* Transaction Ledger Table */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {entries.length === 0 ? (
                  <div className="p-8 text-center text-white/60 text-xs">
                    {language === 'en' ? 'No transactions recorded yet.' : 'এখনো কোনো লেনদেন রেকর্ড করা হয়নি।'}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {entries.map(entry => {
                      const isGave = entry.type === 'you_gave';
                      return (
                        <div
                          key={entry.id}
                          className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:bg-slate-950 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isGave ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {isGave ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <ArrowDownLeft className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  {isGave
                                    ? language === 'en'
                                      ? 'You Gave (দিলাম)'
                                      : 'দিলাম (উধার / বাকি)'
                                    : language === 'en'
                                    ? 'You Got (পেলাম)'
                                    : 'পেলাম (জমা / পরিশোধ)'}
                                </span>
                                {entry.billNumber && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-white/70 font-mono">
                                    #{entry.billNumber}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-white/60 uppercase">
                                  {entry.paymentMethod}
                                </span>
                              </div>
                              <div className="text-[11px] text-white/60 mt-0.5 flex flex-wrap items-center gap-2">
                                <span className="font-mono">
                                  {entry.date} {entry.time}
                                </span>
                                {entry.note && <span className="font-medium text-white/80">• {entry.note}</span>}

                                {/* SMS Status Tag */}
                                {(() => {
                                  const entrySms = (smsLogs || []).find(l => l.transactionId === entry.id);
                                  if (!entrySms) return null;
                                  if (entrySms.status === 'delivered' || entrySms.status === 'sent') {
                                    return (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        <span>SMS Sent</span>
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                                      <AlertCircle className="w-2.5 h-2.5" />
                                      <span>Failed</span>
                                      <button
                                        type="button"
                                        onClick={() => retrySms(entrySms.id)}
                                        className="ml-1 text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                                      >
                                        Retry
                                      </button>
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`text-sm md:text-base font-black font-mono ${
                                isGave ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {isGave ? '+' : '-'}
                              {formatCurrency(entry.amount)}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    language === 'en'
                                      ? 'Are you sure you want to delete this entry?'
                                      : 'আপনি কি নিশ্চিত যে এই এন্ট্রিটি মুছে ফেলতে চান?'
                                  )
                                ) {
                                  deleteKhataEntry(entry.id);
                                }
                              }}
                              className="p-1 rounded text-white/40 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Actions at bottom of statement */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveReminderParty(activeStatementParty);
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{language === 'en' ? 'Send Reminder' : 'তাগাদা পাঠান'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenAddEntry(activeStatementParty, 'you_gave');
                    }}
                    className="py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold cursor-pointer"
                  >
                    {language === 'en' ? '+ You Gave' : '+ দিলাম'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenAddEntry(activeStatementParty, 'you_got');
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold cursor-pointer"
                  >
                    {language === 'en' ? '+ You Got' : '+ পেলাম'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
