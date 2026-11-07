import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  ArrowRightLeft,
  Smartphone,
  Copy,
  Printer,
  FileText,
  Camera,
  Building2,
  Wallet,
  Check,
  CreditCard,
  User,
  Phone,
  Tag,
  Clock,
  Calendar,
  Layers,
  Scan,
  UserCheck,
  Ticket,
  Zap,
  Award,
  Sparkles,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../context/LanguageContext';
import { getTodayDateString, getCurrentTimeString, DEFAULT_EXPENSE_CATEGORIES } from '../../data/defaults';
import { TransactionType, PaymentMethod } from '../../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: string | null;
  initialCategory?: string | null;
  initialTransferDirection?: 'cash_to_bank' | 'bank_to_cash' | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  initialType,
  initialCategory,
  initialTransferDirection,
}) => {
  const { categories, addTransaction, shopSettings } = useShop();
  const { t, language } = useLanguage();

  // Mode tabs: 'service' | 'quick_cash' | 'recharge' | 'money_transfer' | 'bank_transfer' | 'expense'
  const [activeTabMode, setActiveTabMode] = useState<string>('service');

  // Form states
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<string>('cat-xerox');
  const [serviceName, setServiceName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [note, setNote] = useState('');

  // Quick cash mode sub-type: 'cash_in' | 'cash_out' | 'bank_in' | 'bank_out'
  const [quickCashType, setQuickCashType] = useState<TransactionType>('cash_in');

  // Recharge specific
  const [rechargeOperator, setRechargeOperator] = useState('Jio');
  const [rechargeProfit, setRechargeProfit] = useState<number | ''>(10);

  // Money transfer specific
  const [receiverName, setReceiverName] = useState('');
  const [receiverAccount, setReceiverAccount] = useState('');
  const [serviceCharge, setServiceCharge] = useState<number | ''>(25);

  // Bank transfer specific
  const [bankTransferDirection, setBankTransferDirection] = useState<'cash_to_bank' | 'bank_to_cash'>('cash_to_bank');

  // Expense specific
  const [expenseCat, setExpenseCat] = useState('exp-shop');

  // Success and Error toast
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setSuccessMsg('');
      setErrorMsg('');
      setAmount('');
      setCustomerName('');
      setCustomerMobile('');
      setReferenceNumber('');
      setNote('');

      if (initialTransferDirection) {
        setActiveTabMode('bank_transfer');
        setBankTransferDirection(initialTransferDirection);
        setCategory('cat-banking');
        setServiceName(
          initialTransferDirection === 'cash_to_bank'
            ? (language === 'en' ? 'Cash to Bank Deposit' : 'নগদ টাকা ব্যাংকে জমা')
            : (language === 'en' ? 'Bank to Cash Withdrawal' : 'ব্যাংক থেকে নগদ উত্তোলন')
        );
      } else if (initialType === 'recharge') {
        setActiveTabMode('recharge');
        setCategory('cat-recharge');
        setServiceName(language === 'en' ? 'Mobile Recharge' : 'মোবাইল রিচার্জ');
        setRechargeProfit(10);
      } else if (initialType === 'money_transfer') {
        setActiveTabMode('money_transfer');
        setCategory('cat-money-transfer');
        setServiceName(language === 'en' ? 'Money Transfer (DMT)' : 'মানি ট্রান্সফার');
        setServiceCharge(25);
      } else if (initialType === 'bank_transfer' || initialType === 'bank') {
        setActiveTabMode('bank_transfer');
        setCategory('cat-banking');
        setServiceName(language === 'en' ? 'Cash-Bank Transfer' : 'ক্যাশ-ব্যাংক ট্রান্সফার');
      } else if (initialType === 'expense') {
        setActiveTabMode('expense');
        setCategory('exp-shop');
        setServiceName(language === 'en' ? 'Shop Expense' : 'দোকানের খরচ');
      } else if (initialType === 'cash_in') {
        setActiveTabMode('quick_cash');
        setQuickCashType('cash_in');
        setPaymentMethod('cash');
        setCategory('cat-other');
        setServiceName(language === 'en' ? 'Cash Received' : 'টাকা এসেছে (নগদ জমা)');
      } else if (initialType === 'cash_out') {
        setActiveTabMode('quick_cash');
        setQuickCashType('cash_out');
        setPaymentMethod('cash');
        setCategory('cat-other');
        setServiceName(language === 'en' ? 'Cash Paid Out' : 'টাকা গেছে (নগদ খরচ)');
      } else if (initialCategory) {
        setActiveTabMode('service');
        setCategory(initialCategory);
        const catObj = categories.find(c => c.id === initialCategory);
        if (catObj) {
          getDefaultServiceNameForCategory(catObj.id, catObj.name, catObj.nameBn);
        } else {
          setServiceName(language === 'en' ? 'Service' : 'সার্ভিস');
        }
      } else {
        setActiveTabMode('service');
        setCategory('cat-xerox');
        setServiceName(language === 'en' ? 'Xerox Copy' : 'জেরক্স কপি');
      }
    }
  }, [isOpen, initialType, initialCategory, initialTransferDirection, categories, language]);

  const getDefaultServiceNameForCategory = (catId: string, nameEn: string, nameBn: string) => {
    switch (catId) {
      case 'cat-xerox':
        setServiceName(language === 'en' ? 'Xerox Copy (B/W)' : 'জেরক্স কপি');
        break;
      case 'cat-print':
        setServiceName(language === 'en' ? 'Document Printout' : 'ডকুমেন্ট প্রিন্ট');
        break;
      case 'cat-photo':
        setServiceName(language === 'en' ? 'Photo Print (Studio)' : 'ফটো প্রিন্ট');
        break;
      case 'cat-passport-photo':
        setServiceName(language === 'en' ? 'Passport Photo (8 Copies)' : 'পাসপোর্ট ছবি (৮ কপি)');
        break;
      case 'cat-online-form':
        setServiceName(language === 'en' ? 'Online Form Fillup & Print' : 'অনলাইন ফর্ম ফিলাপ');
        break;
      case 'cat-banking':
        setServiceName(language === 'en' ? 'AEPS Cash Withdrawal' : 'AEPS টাকা তোলা');
        break;
      case 'cat-ticket':
        setServiceName(language === 'en' ? 'Train / Bus Ticket Booking' : 'টিকিট বুকিং');
        break;
      case 'cat-lamination':
        setServiceName(language === 'en' ? 'Certificate Lamination' : 'সার্টিফিকেট লেমিনেশন');
        break;
      case 'cat-scan':
        setServiceName(language === 'en' ? 'Document Scanning' : 'ডকুমেন্ট স্ক্যান');
        break;
      case 'cat-pancard':
        setServiceName(language === 'en' ? 'New PAN Card Application' : 'নতুন প্যান কার্ড আবেদন');
        break;
      case 'cat-aadhaar-voter':
        setServiceName(language === 'en' ? 'Aadhaar / Voter Card Service' : 'আধার ও ভোটার সেবা');
        break;
      case 'cat-electricity-bill':
        setServiceName(language === 'en' ? 'WBSEDCL Electricity Bill Pay' : 'বিদ্যুৎ বিল পেমেন্ট');
        break;
      case 'cat-pvc-card':
        setServiceName(language === 'en' ? 'PVC Smart Card Print' : 'পিভিসি স্মার্ট কার্ড');
        break;
      case 'cat-certificates':
        setServiceName(language === 'en' ? 'Caste / Income Certificate Apply' : 'সার্টিফিকেট আবেদন');
        break;
      default:
        setServiceName(language === 'en' ? nameEn : nameBn);
    }
  };

  if (!isOpen) return null;

  const handleSelectCategory = (catId: string) => {
    setCategory(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat) {
      if (catId === 'cat-recharge') {
        setActiveTabMode('recharge');
        setServiceName(language === 'en' ? 'Mobile Recharge' : 'মোবাইল রিচার্জ');
        return;
      }
      if (catId === 'cat-money-transfer') {
        setActiveTabMode('money_transfer');
        setServiceName(language === 'en' ? 'Money Transfer (DMT)' : 'মানি ট্রান্সফার');
        return;
      }
      getDefaultServiceNameForCategory(cat.id, cat.name, cat.nameBn);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg(language === 'en' ? 'Please enter a valid amount (greater than ₹0)' : 'সঠিক টাকার অঙ্ক লিখুন (০ টাকার বেশি)');
      return;
    }

    let finalType: TransactionType = 'service_income';
    let finalService = serviceName.trim() || (language === 'en' ? 'Service' : 'সার্ভিস');
    let finalCat = category;

    if (activeTabMode === 'recharge') {
      finalType = 'recharge';
      finalCat = 'cat-recharge';
      finalService = `${rechargeOperator} Recharge ${customerMobile ? `(${customerMobile})` : ''}`.trim();
    } else if (activeTabMode === 'money_transfer') {
      finalType = 'money_transfer';
      finalCat = 'cat-money-transfer';
      finalService = `Money Transfer: ${receiverName ? receiverName + ' - ' : ''}₹${numericAmount}`;
    } else if (activeTabMode === 'bank_transfer') {
      finalType = bankTransferDirection;
      finalCat = 'cat-banking';
      finalService = bankTransferDirection === 'cash_to_bank'
        ? (language === 'en' ? 'Cash to Bank Deposit' : 'নগদ টাকা ব্যাংকে জমা')
        : (language === 'en' ? 'Bank to Cash Withdrawal' : 'ব্যাংক থেকে নগদ উত্তোলন');
    } else if (activeTabMode === 'expense') {
      finalType = 'expense';
      finalCat = expenseCat;
      const expObj = DEFAULT_EXPENSE_CATEGORIES.find(e => e.id === expenseCat);
      finalService = serviceName.trim() || (language === 'en' ? (expObj ? expObj.name : 'Expense') : (expObj ? expObj.nameBn : 'দোকানের খরচ'));
    } else if (activeTabMode === 'quick_cash') {
      finalType = quickCashType;
      finalCat = 'cat-other';
      finalService = serviceName.trim() || (
        quickCashType === 'cash_in'
          ? (language === 'en' ? 'Cash Received' : 'টাকা এসেছে (নগদ জমা)')
          : quickCashType === 'cash_out'
          ? (language === 'en' ? 'Cash Paid Out' : 'টাকা গেছে (নগদ খরচ)')
          : quickCashType === 'bank_in'
          ? (language === 'en' ? 'Bank In (UPI/Deposit)' : 'ব্যাংকে জমা')
          : (language === 'en' ? 'Bank Out (UPI/Withdrawal)' : 'ব্যাংক থেকে খরচ')
      );
    }

    addTransaction({
      date,
      time,
      type: finalType,
      category: finalCat,
      serviceName: finalService,
      amount: numericAmount,
      paymentMethod,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      referenceNumber: referenceNumber.trim(),
      note: note.trim(),
      rechargeOperator: activeTabMode === 'recharge' ? rechargeOperator : undefined,
      rechargeProfit: activeTabMode === 'recharge' ? (rechargeProfit !== '' ? Number(rechargeProfit) : 0) : undefined,
      receiverName: activeTabMode === 'money_transfer' ? receiverName.trim() : undefined,
      receiverAccount: activeTabMode === 'money_transfer' ? receiverAccount.trim() : undefined,
      serviceCharge: activeTabMode === 'money_transfer' ? (serviceCharge !== '' ? Number(serviceCharge) : 0) : undefined,
      expenseCategory: activeTabMode === 'expense' ? expenseCat : undefined,
    });

    setSuccessMsg(language === 'en' ? 'Transaction recorded successfully!' : 'লেনদেন সফলভাবে লিপিবদ্ধ হয়েছে!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 600);
  };

  const quickAmounts = [10, 20, 50, 100, 200, 500, 1000, 2000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t.newTransactionTitle}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  {date}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {shopSettings.shopName
                  ? `${shopSettings.shopName} • ${language === 'en' ? 'Accounting Ledger' : 'হিসাব খাতা'}`
                  : (language === 'en' ? 'Shop Accounting Ledger' : 'দোকানের হিসাব খাতা')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (All 6 Tabs) */}
        <div className="bg-slate-950/70 p-2 border-b border-slate-800 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'service', label: t.tabService, icon: FileText, color: 'text-blue-400' },
            { id: 'recharge', label: t.tabRecharge, icon: Smartphone, color: 'text-violet-400' },
            { id: 'money_transfer', label: t.tabMoneyTransfer, icon: ArrowRightLeft, color: 'text-amber-400' },
            { id: 'bank_transfer', label: t.tabBankTransfer, icon: Building2, color: 'text-teal-400' },
            { id: 'expense', label: t.tabExpense, icon: Minus, color: 'text-rose-400' },
            { id: 'quick_cash', label: t.tabQuickCash, icon: Plus, color: 'text-emerald-400' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTabMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTabMode(tab.id);
                  if (tab.id === 'recharge') setServiceName(language === 'en' ? 'Mobile Recharge' : 'মোবাইল রিচার্জ');
                  if (tab.id === 'money_transfer') setServiceName(language === 'en' ? 'Money Transfer (DMT)' : 'মানি ট্রান্সফার');
                  if (tab.id === 'bank_transfer') setServiceName(language === 'en' ? 'Cash-Bank Transfer' : 'ক্যাশ-ব্যাংক ট্রান্সফার');
                  if (tab.id === 'expense') setServiceName(language === 'en' ? 'Shop Expense' : 'দোকানের খরচ');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-sm font-medium animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-sm font-medium">
              <Check className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Amount Input */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                {t.amountLabel}
              </label>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="bg-transparent border-b border-slate-700 text-slate-300 text-xs py-0.5 px-1 focus:outline-none"
                />
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-2xl font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                autoFocus
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-2xl font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400">{t.quickButtons}</span>
              {quickAmounts.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(prev => (Number(prev) || 0) + val)}
                  className="px-2 py-0.5 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-xs font-mono text-slate-200 hover:text-white transition-colors cursor-pointer"
                >
                  +{val}
                </button>
              ))}
              {amount !== '' && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="text-[11px] text-rose-400 hover:underline ml-auto cursor-pointer"
                >
                  {t.clear}
                </button>
              )}
            </div>
          </div>

          {/* 1. Service Mode: All Categories Selection */}
          {activeTabMode === 'service' && (
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-400" /> {t.serviceCategory}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-800 rounded-xl bg-slate-950/40">
                {categories.map(c => {
                  const isSelected = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCategory(c.id)}
                      className={`p-2 rounded-xl border text-left transition-all flex flex-col items-start gap-0.5 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/30 border-blue-500 text-blue-200 ring-2 ring-blue-500/40'
                          : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold truncate w-full">
                        {language === 'en' ? c.name : c.nameBn}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate w-full">
                        {language === 'en' ? c.nameBn : c.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Service description item */}
              <div className="pt-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {t.serviceDescription}
                </label>
                <input
                  type="text"
                  placeholder={
                    language === 'en'
                      ? 'e.g. 5 Xerox Copies, Urgent Passport Photo, Swasthya Sathi Application'
                      : 'যেমন: ৫ কপি জেরক্স, পাসপোর্ট ছবি, আধার সংশোধন'
                  }
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* 2. Recharge Specific Fields */}
          {activeTabMode === 'recharge' && (
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> {t.tabRecharge}
              </div>

              {/* Operator Select */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">{t.operator}</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['Jio', 'Airtel', 'Vi', 'BSNL', 'Tata Play', 'Airtel DTH'].map(op => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setRechargeOperator(op)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        rechargeOperator === op
                          ? 'bg-violet-600 text-white shadow-md ring-2 ring-violet-400/40'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.customerMobile} *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="98XXXXXXXX"
                    value={customerMobile}
                    onChange={e => setCustomerMobile(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {t.profitCommission}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={rechargeProfit}
                    onChange={e => setRechargeProfit(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Money Transfer Specific Fields */}
          {activeTabMode === 'money_transfer' && (
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4" /> {t.tabMoneyTransfer}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.receiverName} *</label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'en' ? 'Account Holder Name' : 'যার একাউন্টে টাকা যাবে'}
                    value={receiverName}
                    onChange={e => setReceiverName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.receiverAccount}</label>
                  <input
                    type="text"
                    placeholder="SBI / PNB / UPI ID"
                    value={receiverAccount}
                    onChange={e => setReceiverAccount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.serviceCharge}</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="25"
                    value={serviceCharge}
                    onChange={e => setServiceCharge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">{t.refNumber}</label>
                  <input
                    type="text"
                    placeholder="IMPS12345678"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Bank Transfer Mode (Double-entry Internal Transfer) */}
          {activeTabMode === 'bank_transfer' && (
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> {t.tabBankTransfer}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBankTransferDirection('cash_to_bank');
                    setServiceName(language === 'en' ? 'Cash to Bank Deposit' : 'নগদ টাকা ব্যাংকে জমা');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    bankTransferDirection === 'cash_to_bank'
                      ? 'bg-teal-500/25 border-teal-500 text-teal-300 ring-2 ring-teal-500/40 shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                    <span>{t.quickCashToBank}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    {language === 'en' ? 'Cash decreases, Bank increases' : 'ক্যাশ বক্স কমবে, ব্যাংক ব্যালেন্স বাড়বে'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBankTransferDirection('bank_to_cash');
                    setServiceName(language === 'en' ? 'Bank to Cash Withdrawal' : 'ব্যাংক থেকে নগদ উত্তোলন');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    bankTransferDirection === 'bank_to_cash'
                      ? 'bg-blue-500/25 border-blue-500 text-blue-300 ring-2 ring-blue-500/40 shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>{t.quickBankToCash}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    {language === 'en' ? 'Bank decreases, Cash increases' : 'ব্যাংক ব্যালেন্স কমবে, ক্যাশ বক্স বাড়বে'}
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 5. Expense Specific Mode */}
          {activeTabMode === 'expense' && (
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Minus className="w-4 h-4" /> {t.expenseCategory}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DEFAULT_EXPENSE_CATEGORIES.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setExpenseCat(e.id);
                      setServiceName(language === 'en' ? e.name : e.nameBn);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer ${
                      expenseCat === e.id
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>{language === 'en' ? e.name : e.nameBn}</div>
                    <div className="text-[10px] text-slate-400">{language === 'en' ? e.nameBn : e.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. Quick Cash Direct Cash/Bank Mode */}
          {activeTabMode === 'quick_cash' && (
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> {t.tabQuickCash}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'cash_in', label: language === 'en' ? '+ Cash In' : '+ ক্যাশ জমা', sub: 'Cash Received', color: 'border-emerald-500 text-emerald-300 bg-emerald-500/20' },
                  { id: 'cash_out', label: language === 'en' ? '- Cash Out' : '- ক্যাশ খরচ', sub: 'Cash Paid Out', color: 'border-rose-500 text-rose-300 bg-rose-500/20' },
                  { id: 'bank_in', label: language === 'en' ? '+ Bank In' : '+ ব্যাংক জমা', sub: 'UPI / Bank Deposit', color: 'border-blue-500 text-blue-300 bg-blue-500/20' },
                  { id: 'bank_out', label: language === 'en' ? '- Bank Out' : '- ব্যাংক খরচ', sub: 'UPI / Bank Withdrawal', color: 'border-amber-500 text-amber-300 bg-amber-500/20' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setQuickCashType(item.id as TransactionType);
                      if (item.id === 'cash_in' || item.id === 'cash_out') setPaymentMethod('cash');
                      else setPaymentMethod('bank');
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      quickCashType === item.id
                        ? `${item.color} ring-2 ring-amber-400 font-bold`
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] opacity-75">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method Selector (hidden for bank_transfer double-entry) */}
          {activeTabMode !== 'bank_transfer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {t.paymentMethod}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>{t.cash}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'bank'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>{t.bank}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/25 ring-2 ring-purple-400/40'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{t.upi}</span>
                </button>
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {t.customerName}
              </label>
              <input
                type="text"
                placeholder={language === 'en' ? 'Customer Name' : 'গ্রাহকের নাম'}
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {t.customerMobile}
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                value={customerMobile}
                onChange={e => setCustomerMobile(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Reference & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.refNumber}
              </label>
              <input
                type="text"
                placeholder={language === 'en' ? 'Receipt or Txn ID' : 'রসিদ নং বা ট্রানজ্যাকশন আইডি'}
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                {t.note}
              </label>
              <input
                type="text"
                placeholder={language === 'en' ? 'Additional notes / details' : 'অতিরিক্ত বিবরণ'}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date Picker Footer Row */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.date}:</span>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{language === 'en' ? 'Create & Save Entry' : 'লেনদেন তৈরি ও সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
