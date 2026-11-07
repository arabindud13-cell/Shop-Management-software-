import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  Users,
  CheckCircle2,
  Plus,
  Minus,
  Copy,
  Printer,
  Smartphone,
  Camera,
  FileText,
  ArrowRightLeft,
  MoreHorizontal,
  Clock,
  Receipt,
  Eye,
  Edit2,
  AlertCircle,
  Sparkles,
  Ticket,
  Layers,
  Scan,
  UserCheck,
  CreditCard,
  Zap,
  Award,
  FileCheck,
  ArrowRight,
  ShoppingBag,
  BarChart3,
  Sun,
  Moon,
  History,
  User,
  Phone,
  Calendar,
  Trash2,
  X,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../lib/accounting';
import { getTodayDateString } from '../data/defaults';
import { Transaction } from '../types';
import { EditTransactionModal } from '../components/modals/EditTransactionModal';
import { ShopCalculator } from '../components/ShopCalculator';

interface DashboardViewProps {
  onOpenOpeningBalance: () => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenOpeningBalance,
  setActiveTab,
}) => {
  const { user } = useAuth();
  const {
    todaySummary,
    transactions,
    categories,
    dailyBalances,
    openAddModal,
    shopSettings,
    receipts,
    openReceiptModal,
    deleteReceipt,
    openReceiptModalForTransaction,
    openGenerateReceiptModal,
    openReceiptHistoryModal,
    khataParties,
    totalYouWillGet,
    totalYouWillGive,
    totalCustomerDue,
    totalCustomerPaid,
  } = useShop();
  const { t, language } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [dashboardTab, setDashboardTab] = useState<'ledger' | 'receipts'>('ledger');
  const [deletingReceiptId, setDeletingReceiptId] = useState<string | null>(null);
  const [selectedEditTxn, setSelectedEditTxn] = useState<Transaction | null>(null);
  const [actionCategoryFilter, setActionCategoryFilter] = useState<'all' | 'services' | 'banking' | 'online_bills'>('all');

  const todayStr = getTodayDateString();
  const hasOpeningSet = Boolean(dailyBalances[todayStr]);

  // Today's transactions
  const todayTransactions = transactions.filter(txn => txn.date === todayStr);

  // Complete list of all 22 quick action options including all rest options
  const allQuickActionButtons = [
    {
      id: 'quick-income',
      group: 'banking',
      label: t.quickCashIn,
      sub: t.quickCashInSub,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-white',
      borderColor: 'border-emerald-500/30',
      icon: Plus,
      onClick: () => openAddModal('cash_in'),
    },
    {
      id: 'quick-expense',
      group: 'banking',
      label: t.quickCashOut,
      sub: t.quickCashOutSub,
      color: 'from-rose-500 to-red-600',
      textColor: 'text-white',
      borderColor: 'border-rose-500/30',
      icon: Minus,
      onClick: () => openAddModal('cash_out'),
    },
    {
      id: 'quick-xerox',
      group: 'services',
      label: t.quickXerox,
      sub: t.quickXeroxSub,
      color: 'from-blue-600 to-indigo-700',
      textColor: 'text-white',
      borderColor: 'border-blue-500/30',
      icon: Copy,
      onClick: () => openAddModal('service', 'cat-xerox'),
    },
    {
      id: 'quick-print',
      group: 'services',
      label: t.quickPrint,
      sub: t.quickPrintSub,
      color: 'from-indigo-600 to-blue-700',
      textColor: 'text-white',
      borderColor: 'border-indigo-500/30',
      icon: Printer,
      onClick: () => openAddModal('service', 'cat-print'),
    },
    {
      id: 'quick-recharge',
      group: 'online_bills',
      label: t.quickRecharge,
      sub: t.quickRechargeSub,
      color: 'from-violet-600 to-purple-700',
      textColor: 'text-white',
      borderColor: 'border-violet-500/30',
      icon: Smartphone,
      onClick: () => openAddModal('recharge'),
    },
    {
      id: 'quick-photo',
      group: 'services',
      label: t.quickPhoto,
      sub: t.quickPhotoSub,
      color: 'from-cyan-600 to-teal-700',
      textColor: 'text-white',
      borderColor: 'border-cyan-500/30',
      icon: Camera,
      onClick: () => openAddModal('service', 'cat-photo'),
    },
    {
      id: 'quick-passport-photo',
      group: 'services',
      label: t.quickPassportPhoto,
      sub: t.quickPassportPhotoSub,
      color: 'from-pink-600 to-rose-700',
      textColor: 'text-white',
      borderColor: 'border-pink-500/30',
      icon: UserCheck,
      onClick: () => openAddModal('service', 'cat-passport-photo'),
    },
    {
      id: 'quick-form',
      group: 'online_bills',
      label: t.quickOnlineForm,
      sub: t.quickOnlineFormSub,
      color: 'from-emerald-600 to-green-700',
      textColor: 'text-white',
      borderColor: 'border-emerald-500/30',
      icon: FileText,
      onClick: () => openAddModal('service', 'cat-online-form'),
    },
    {
      id: 'quick-dmt',
      group: 'banking',
      label: t.quickMoneyTransfer,
      sub: t.quickMoneyTransferSub,
      color: 'from-amber-600 to-orange-700',
      textColor: 'text-white',
      borderColor: 'border-amber-500/30',
      icon: ArrowRightLeft,
      onClick: () => openAddModal('money_transfer'),
    },
    {
      id: 'quick-banking',
      group: 'banking',
      label: t.quickBanking,
      sub: t.quickBankingSub,
      color: 'from-teal-600 to-cyan-700',
      textColor: 'text-white',
      borderColor: 'border-teal-500/30',
      icon: Building2,
      onClick: () => openAddModal('service', 'cat-banking'),
    },
    {
      id: 'quick-ticket',
      group: 'services',
      label: t.quickTicket,
      sub: t.quickTicketSub,
      color: 'from-orange-600 to-amber-700',
      textColor: 'text-white',
      borderColor: 'border-orange-500/30',
      icon: Ticket,
      onClick: () => openAddModal('service', 'cat-ticket'),
    },
    {
      id: 'quick-lamination',
      group: 'services',
      label: t.quickLamination,
      sub: t.quickLaminationSub,
      color: 'from-purple-600 to-indigo-700',
      textColor: 'text-white',
      borderColor: 'border-purple-500/30',
      icon: Layers,
      onClick: () => openAddModal('service', 'cat-lamination'),
    },
    {
      id: 'quick-scan',
      group: 'services',
      label: t.quickScan,
      sub: t.quickScanSub,
      color: 'from-sky-600 to-blue-700',
      textColor: 'text-white',
      borderColor: 'border-sky-500/30',
      icon: Scan,
      onClick: () => openAddModal('service', 'cat-scan'),
    },
    {
      id: 'quick-pancard',
      group: 'online_bills',
      label: t.quickPanCard,
      sub: t.quickPanCardSub,
      color: 'from-amber-500 to-yellow-600',
      textColor: 'text-slate-950 font-bold',
      borderColor: 'border-amber-400',
      icon: CreditCard,
      onClick: () => openAddModal('service', 'cat-pancard'),
    },
    {
      id: 'quick-aadhaar',
      group: 'online_bills',
      label: t.quickAadhaar,
      sub: t.quickAadhaarSub,
      color: 'from-emerald-700 to-teal-800',
      textColor: 'text-white',
      borderColor: 'border-emerald-600',
      icon: FileCheck,
      onClick: () => openAddModal('service', 'cat-aadhaar-voter'),
    },
    {
      id: 'quick-electricity',
      group: 'online_bills',
      label: t.quickElectricity,
      sub: t.quickElectricitySub,
      color: 'from-yellow-600 to-amber-700',
      textColor: 'text-white',
      borderColor: 'border-yellow-500/30',
      icon: Zap,
      onClick: () => openAddModal('service', 'cat-electricity-bill'),
    },
    {
      id: 'quick-pvc-card',
      group: 'services',
      label: t.quickPvcCard,
      sub: t.quickPvcCardSub,
      color: 'from-blue-700 to-indigo-800',
      textColor: 'text-white',
      borderColor: 'border-blue-600',
      icon: CreditCard,
      onClick: () => openAddModal('service', 'cat-pvc-card'),
    },
    {
      id: 'quick-certificates',
      group: 'online_bills',
      label: t.quickCertificates,
      sub: t.quickCertificatesSub,
      color: 'from-cyan-700 to-blue-800',
      textColor: 'text-white',
      borderColor: 'border-cyan-600',
      icon: Award,
      onClick: () => openAddModal('service', 'cat-certificates'),
    },
    {
      id: 'quick-cash-to-bank',
      group: 'banking',
      label: t.quickCashToBank,
      sub: t.quickCashToBankSub,
      color: 'from-teal-700 to-emerald-800',
      textColor: 'text-white',
      borderColor: 'border-teal-600',
      icon: ArrowRightLeft,
      onClick: () => openAddModal('bank_transfer', undefined, 'cash_to_bank'),
    },
    {
      id: 'quick-bank-to-cash',
      group: 'banking',
      label: t.quickBankToCash,
      sub: t.quickBankToCashSub,
      color: 'from-blue-800 to-indigo-900',
      textColor: 'text-white',
      borderColor: 'border-blue-700',
      icon: Building2,
      onClick: () => openAddModal('bank_transfer', undefined, 'bank_to_cash'),
    },
    {
      id: 'quick-shop-expense',
      group: 'banking',
      label: language === 'en' ? 'Shop Expense' : 'দোকানের খরচ',
      sub: language === 'en' ? 'Bills & Costs' : 'বিল ও বিবিধ খরচ',
      color: 'from-rose-600 to-pink-800',
      textColor: 'text-white',
      borderColor: 'border-rose-600',
      icon: Minus,
      onClick: () => openAddModal('expense'),
    },
    {
      id: 'quick-other',
      group: 'services',
      label: t.quickOther,
      sub: t.quickOtherSub,
      color: 'from-slate-700 to-slate-800',
      textColor: 'text-white',
      borderColor: 'border-slate-600',
      icon: MoreHorizontal,
      onClick: () => openAddModal('service', 'cat-other'),
    },
  ];

  const filteredQuickActions = allQuickActionButtons.filter(btn => {
    if (actionCategoryFilter === 'all') return true;
    return btn.group === actionCategoryFilter;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Prominent Shop Name Banner at Top */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {language === 'en' ? 'Shop Accounting & Transaction System' : 'দোকানের ক্যাশ ও ব্যাংক হিসাব খাতা'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-300 tracking-tight mt-1.5 drop-shadow-sm">
            {user?.shopName || shopSettings.shopName || (language === 'bn' ? 'রাধা মাধব অনলাইন সেন্টার' : 'Radhamadhab Online Center')}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-1.5 leading-relaxed">
            {language === 'en'
              ? 'Xerox • Printing • Photo • Online Form • Mobile Recharge • Money Transfer • AEPS Banking'
              : 'জেরক্স • প্রিন্ট • ফটো • অনলাইন ফর্ম • মোবাইল রিচার্জ • মানি ট্রান্সফার • ব্যাংকিং সেবা'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
          {/* Dark / Light Mode Toggle in Dashboard */}
          <button
            type="button"
            onClick={toggleTheme}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title={
              theme === 'dark'
                ? language === 'en' ? 'Switch to Light Mode' : 'লাইট মোডে পরিবর্তন করুন'
                : language === 'en' ? 'Switch to Dark Mode' : 'ডার্ক মোডে পরিবর্তন করুন'
            }
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-white font-bold">{language === 'en' ? 'Light' : 'লাইট'}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-400" />
                <span className="text-white font-bold">{language === 'en' ? 'Dark' : 'ডার্ক'}</span>
              </>
            )}
          </button>

          {/* Create Customer Receipt */}
          <button
            type="button"
            onClick={() => openGenerateReceiptModal()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title={language === 'en' ? 'Create Customer Receipt' : 'গ্রাহক রসিদ তৈরি করুন'}
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span className="font-bold">{language === 'en' ? '+ Create Receipt' : '+ রসিদ তৈরি'}</span>
          </button>

          {/* Receipt History */}
          <button
            type="button"
            onClick={openReceiptHistoryModal}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title={language === 'en' ? 'Saved Receipt History' : 'সংরক্ষিত রসিদ তালিকা'}
          >
            <History className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline font-bold">{language === 'en' ? 'Receipts' : 'রসিদ'}</span>
            {receipts && receipts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                {receipts.length}
              </span>
            )}
          </button>

          <button
            onClick={onOpenOpeningBalance}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
              hasOpeningSet
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse font-extrabold'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>{hasOpeningSet ? t.openingBalanceSet : t.setOpeningBalance}</span>
          </button>

          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 border border-blue-400/50 flex items-center gap-1.5 cursor-pointer ring-1 ring-blue-400/60"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{language === 'en' ? '+ Create Entry' : '+ নতুন লেনদেন'}</span>
          </button>
        </div>
      </div>

      {/* Missing Opening Balance Warning Banner */}
      {!hasOpeningSet && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-200 shadow-lg">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">
                {language === 'en' ? "Today's Opening Balance Not Set!" : 'আজকের প্রারম্ভিক ব্যালেন্স সেট করা হয়নি!'}
              </div>
              <div className="text-xs text-amber-300">
                {language === 'en'
                  ? 'Record morning cash drawer and bank opening balance for accurate daily accounting.'
                  : 'সঠিক ক্যাশ ও ব্যাংক হিসাব রাখার জন্য প্রতিদিন সকালের ওপেনিং ব্যালেন্স দিয়ে শুরু করুন।'}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenOpeningBalance}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
          >
            {t.setOpeningBalance}
          </button>
        </div>
      )}

      {/* 8 Prominent Dashboard Cards with Calculator Beside */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Money Calculation Cards (8 cols on desktop) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
          {/* 1. Opening Cash */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-md relative overflow-hidden transition-all">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
              <span className="uppercase tracking-wider font-extrabold">{t.openingCash}</span>
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-white truncate drop-shadow-sm">
              {formatCurrency(todaySummary.openingCash)}
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-300 flex items-center gap-1">
              <span>{language === 'en' ? 'Morning drawer cash' : 'সকালের ক্যাশ বক্স'}</span>
            </div>
          </div>

          {/* 2. Current Cash */}
          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border-2 border-emerald-500/60 rounded-2xl p-4 shadow-md relative overflow-hidden ring-1 ring-emerald-500/30">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-1.5">
              <span className="uppercase tracking-wider font-extrabold">{t.currentCash}</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-900/60 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-emerald-300" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-emerald-400 truncate drop-shadow-sm">
              {formatCurrency(todaySummary.closingCash)}
            </div>
            <div className="mt-2 text-xs font-bold text-emerald-200 flex items-center gap-1">
              <span>{language === 'en' ? 'Cash in drawer' : 'হাতে থাকা ক্যাশ'}</span>
            </div>
          </div>

          {/* 3. Opening Bank */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-md relative overflow-hidden transition-all">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
              <span className="uppercase tracking-wider font-extrabold">{t.openingBank}</span>
              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-white truncate drop-shadow-sm">
              {formatCurrency(todaySummary.openingBank)}
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-300 flex items-center gap-1">
              <span>{language === 'en' ? 'Morning bank' : 'সকালের ব্যাংক'}</span>
            </div>
          </div>

          {/* 4. Current Bank */}
          <div className="bg-gradient-to-br from-blue-950/60 to-slate-900 border-2 border-blue-500/60 rounded-2xl p-4 shadow-md relative overflow-hidden ring-1 ring-blue-500/30">
            <div className="flex items-center justify-between text-xs font-bold text-blue-300 mb-1.5">
              <span className="uppercase tracking-wider font-extrabold">{t.currentBank}</span>
              <div className="w-6 h-6 rounded-lg bg-blue-900/60 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-blue-300" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-blue-400 truncate drop-shadow-sm">
              {formatCurrency(todaySummary.closingBank)}
            </div>
            <div className="mt-2 text-xs font-bold text-blue-200 flex items-center gap-1">
              <span>{language === 'en' ? 'Bank & UPI' : 'ব্যাংক ও UPI'}</span>
            </div>
          </div>

          {/* 5. Today's Income */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
              <span className="uppercase tracking-wider font-extrabold">{t.todayIncome}</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-900/40 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-emerald-400 truncate drop-shadow-sm">
              {formatCurrency(todaySummary.todayIncome)}
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-300 flex items-center gap-1">
              <span>{language === 'en' ? 'Services + Recharges' : 'সার্ভিস + রিচার্জ'}</span>
            </div>
          </div>

          {/* 6. Today's Expense */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
              <span className="uppercase tracking-wider font-extrabold">{t.todayExpense}</span>
              <div className="w-6 h-6 rounded-lg bg-rose-900/40 flex items-center justify-center">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-rose-400 truncate drop-shadow-sm">
              {formatCurrency(todaySummary.todayExpense)}
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-300 flex items-center gap-1">
              <span>{language === 'en' ? 'Shop expenses' : 'দোকানের খরচ'}</span>
            </div>
          </div>

          {/* 7. Today's Net Income / Profit */}
          <div className={`rounded-2xl p-4 shadow-md border-2 ${
            todaySummary.todayNetProfit >= 0
              ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-500/60'
              : 'bg-gradient-to-br from-rose-950/60 to-slate-900 border-rose-500/60'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1.5">
              <span className="uppercase tracking-wider font-black text-slate-100">{t.todayNetProfit}</span>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                todaySummary.todayNetProfit >= 0 ? 'bg-emerald-900/50' : 'bg-rose-900/50'
              }`}>
                <TrendingUp className={`w-3.5 h-3.5 ${todaySummary.todayNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
              </div>
            </div>
            <div className={`font-mono text-xl sm:text-2xl font-black truncate drop-shadow-sm ${
              todaySummary.todayNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatCurrency(todaySummary.todayNetProfit, true)}
            </div>
            <div className={`mt-2 text-xs font-bold ${
              todaySummary.todayNetProfit >= 0 ? 'text-emerald-200' : 'text-rose-200'
            }`}>
              {todaySummary.todayNetProfit >= 0
                ? (language === 'en' ? 'Net profit earned' : 'আজকের নিট লাভ')
                : (language === 'en' ? 'Expenses higher' : 'আজকের নিট ঘাটতি')}
            </div>
          </div>

          {/* 8. Total Transactions */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
              <span className="uppercase tracking-wider font-extrabold">{t.totalTransactions}</span>
              <div className="w-6 h-6 rounded-lg bg-amber-900/40 flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-white truncate drop-shadow-sm">
              {todaySummary.transactionCount} <span className="text-sm font-bold text-slate-300">{language === 'en' ? 'txns' : 'টি'}</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-300 flex items-center gap-1">
              <span>{language === 'en' ? 'Entries recorded' : 'মোট এন্ট্রি সংখ্যা'}</span>
            </div>
          </div>
        </div>

        {/* Beside Calculator (4 cols on desktop) */}
        <div className="lg:col-span-4 w-full">
          <ShopCalculator
            className="w-full"
            onUseAmount={(amt) => openAddModal('cash_in')}
          />
        </div>
      </div>

      {/* Digital Khata Book (Udhar Ledger) Overview Card */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {language === 'en' ? 'Digital Khata Book' : 'ডিজিটাল খাতা বুক (বাকি ও উধার)'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-500/40">
                  {khataParties.length} {language === 'en' ? 'Accounts' : 'খতিয়ান'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-300 mt-0.5">
                {language === 'en'
                  ? 'Customer debts, supplier credits & automatic WhatsApp reminders'
                  : 'কাস্টমারদের বাকি, মহাজনদের পাওনা ও হোয়াটসঅ্যাপ তাগাদা খতিয়ান'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('khata')}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <span>{language === 'en' ? 'Open Khata Book →' : 'খাতা বুক খুলুন →'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5">
          {/* Total Due (Credit) */}
          <div
            onClick={() => setActiveTab('khata')}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/40 hover:border-rose-500/80 transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-1 text-xs font-black text-rose-400 uppercase tracking-wider mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
              <span>{language === 'en' ? 'Total Due' : 'মোট বাকি (Due)'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono drop-shadow-sm">
              {formatCurrency(totalCustomerDue)}
            </div>
            <div className="text-xs font-semibold text-slate-300 mt-1">
              {language === 'en' ? 'Goods given on credit' : 'মোট বাকি মাল দেওয়া'}
            </div>
          </div>

          {/* Total Paid (Jama) */}
          <div
            onClick={() => setActiveTab('khata')}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 hover:border-emerald-500/80 transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-1 text-xs font-black text-emerald-400 uppercase tracking-wider mb-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'en' ? 'Total Paid' : 'মোট জমা (Paid)'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono drop-shadow-sm">
              {formatCurrency(totalCustomerPaid)}
            </div>
            <div className="text-xs font-semibold text-slate-300 mt-1">
              {language === 'en' ? 'Collected from customers' : 'গ্রাহকদের মোট জমা'}
            </div>
          </div>

          {/* Net You Will Get */}
          <div
            onClick={() => setActiveTab('khata')}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/40 hover:border-amber-500/80 transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-1 text-xs font-black text-amber-300 uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'You Will Get' : 'পাবেন (Net Due)'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono drop-shadow-sm">
              {formatCurrency(totalYouWillGet)}
            </div>
            <div className="text-xs font-semibold text-slate-300 mt-1">
              {khataParties.filter(p => p.currentBalance > 0).length} {language === 'en' ? 'customers owe' : 'জনের কাছে বাকি'}
            </div>
          </div>

          {/* Total You Will Give */}
          <div
            onClick={() => setActiveTab('khata')}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 hover:border-indigo-500/80 transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-1 text-xs font-black text-indigo-300 uppercase tracking-wider mb-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'en' ? 'You Will Give' : 'দেবেন (Payable)'}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-300 font-mono drop-shadow-sm">
              {formatCurrency(totalYouWillGive)}
            </div>
            <div className="text-xs font-semibold text-slate-300 mt-1">
              {khataParties.filter(p => p.currentBalance < 0).length} {language === 'en' ? 'suppliers' : 'মহাজন দেনা'}
            </div>
          </div>
        </div>
      </div>

      {/* Portal Quick Shortcuts (Recharge, Transfer, Expense, Reports) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('recharge')}
          className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-violet-500/60 rounded-2xl text-left transition-all group cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Smartphone className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-300 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-2.5 font-bold text-xs sm:text-sm text-white group-hover:text-violet-300">
            {language === 'en' ? 'Recharge Portal' : 'রিচার্জ পোর্টাল'}
          </div>
          <div className="text-xs font-medium text-slate-300 mt-0.5">
            {language === 'en' ? 'Mobile & DTH history' : 'সকল রিচার্জ হিসাব'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('money-transfer')}
          className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/60 rounded-2xl text-left transition-all group cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-2.5 font-bold text-xs sm:text-sm text-white group-hover:text-amber-300">
            {language === 'en' ? 'Money Transfer (DMT)' : 'মানি ট্রান্সফার'}
          </div>
          <div className="text-xs font-medium text-slate-300 mt-0.5">
            {language === 'en' ? 'Remittance ledger' : 'টাকা পাঠানো ও কমিশন'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/60 rounded-2xl text-left transition-all group cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-300 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-2.5 font-bold text-xs sm:text-sm text-white group-hover:text-rose-300">
            {language === 'en' ? 'Shop Expenses' : 'দোকানের খরচ'}
          </div>
          <div className="text-xs font-medium text-slate-300 mt-0.5">
            {language === 'en' ? 'Bills, paper, tea' : 'বিল ও স্টেশনারি খরচ'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/60 rounded-2xl text-left transition-all group cursor-pointer shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-2.5 font-bold text-xs sm:text-sm text-white group-hover:text-blue-300">
            {language === 'en' ? 'Audit Reports' : 'হিসেব ও রিপোর্ট'}
          </div>
          <div className="text-xs font-medium text-slate-300 mt-0.5">
            {language === 'en' ? 'Cash & bank audit' : 'ক্যাশ ও ব্যাংক রিকনসিলিয়েশন'}
          </div>
        </button>
      </div>

      {/* Complete Quick Action Buttons Grid (All 22 Options) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{language === 'en' ? 'Quick Actions (All Options Working)' : 'দ্রুত লেনদেন বাটন (সকল অপশন সক্রিয়)'}</span>
          </h2>

          {/* Action Filter Pills */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActionCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                actionCategoryFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-200 hover:text-white bg-slate-800/60'
              }`}
            >
              {language === 'en' ? 'All (22)' : 'সব (২২)'}
            </button>
            <button
              type="button"
              onClick={() => setActionCategoryFilter('services')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                actionCategoryFilter === 'services' ? 'bg-blue-600 text-white font-black' : 'text-slate-200 hover:text-white bg-slate-800/60'
              }`}
            >
              {language === 'en' ? 'Services' : 'সার্ভিস'}
            </button>
            <button
              type="button"
              onClick={() => setActionCategoryFilter('banking')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                actionCategoryFilter === 'banking' ? 'bg-emerald-600 text-white font-black' : 'text-slate-200 hover:text-white bg-slate-800/60'
              }`}
            >
              {language === 'en' ? 'Cash & Bank' : 'ক্যাশ ও ব্যাংক'}
            </button>
            <button
              type="button"
              onClick={() => setActionCategoryFilter('online_bills')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                actionCategoryFilter === 'online_bills' ? 'bg-purple-600 text-white font-black' : 'text-slate-200 hover:text-white bg-slate-800/60'
              }`}
            >
              {language === 'en' ? 'Forms & Bills' : 'ফর্ম ও বিল'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
          {filteredQuickActions.map(btn => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={btn.onClick}
                className={`p-3 rounded-2xl bg-gradient-to-br ${btn.color} ${btn.textColor} border ${btn.borderColor} shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-left flex flex-col justify-between min-h-[96px] group cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-black/30 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-white uppercase tracking-wider font-bold">
                    {language === 'en' ? 'NEW' : 'এন্ট্রি'}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="font-extrabold text-xs sm:text-sm leading-tight drop-shadow-sm truncate text-white">
                    {btn.label}
                  </div>
                  <div className="text-xs font-semibold text-white/95 drop-shadow-sm truncate mt-0.5">{btn.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Ledger & Saved Receipts Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-5 py-3.5 bg-slate-800/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Segmented Tab Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl flex items-center border border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setDashboardTab('ledger')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  dashboardTab === 'ledger'
                    ? 'bg-blue-600 text-white shadow-sm font-black'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-300" />
                <span>{language === 'en' ? "Today's Live Ledger" : 'আজকের খাতা'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  dashboardTab === 'ledger' ? 'bg-blue-950 text-white border border-blue-400/40' : 'bg-slate-800 text-slate-200'
                }`}>
                  {todayTransactions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDashboardTab('receipts')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  dashboardTab === 'receipts'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-amber-900" />
                <span>{language === 'en' ? 'Saved Receipts' : 'সংরক্ষিত রসিদ'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  dashboardTab === 'receipts' ? 'bg-amber-600/40 text-slate-950' : 'bg-slate-800 text-amber-300'
                }`}>
                  {receipts.length}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dashboardTab === 'ledger' ? (
              <button
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-bold text-blue-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/30"
              >
                <span>{t.viewAll}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openGenerateReceiptModal()}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span>{language === 'en' ? 'New Receipt' : 'নতুন রসিদ'}</span>
                </button>
                <button
                  type="button"
                  onClick={openReceiptHistoryModal}
                  className="text-xs font-bold text-amber-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Full History' : 'সকল রসিদ'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {dashboardTab === 'ledger' && (
          todayTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-300 space-y-2">
            <Receipt className="w-12 h-12 mx-auto text-slate-500 opacity-80" />
            <p className="text-sm font-bold text-white">{t.noTransactionsToday}</p>
            <p className="text-xs text-slate-300 font-medium">{t.startAddingPrompt}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {todayTransactions.slice(0, 10).map(txnItem => {
              const isIncome = ['service_income', 'cash_in', 'bank_in', 'recharge', 'money_transfer'].includes(txnItem.type);
              const isExpense = ['expense', 'cash_out', 'bank_out'].includes(txnItem.type);
              const isTransfer = ['cash_to_bank', 'bank_to_cash'].includes(txnItem.type);

              return (
                <div
                  key={txnItem.id}
                  className="px-4 py-3 sm:px-5 flex items-center justify-between hover:bg-slate-800/60 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isExpense
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    }`}>
                      {isIncome ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : isExpense ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowRightLeft className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold text-xs sm:text-sm text-white truncate flex items-center gap-2">
                        <span>{txnItem.serviceName}</span>
                        {txnItem.customerName && (
                          <span className="hidden sm:inline text-xs text-slate-200 font-semibold">
                            • {txnItem.customerName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5 font-mono">
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {txnItem.time}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="capitalize uppercase px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-200 font-bold border border-slate-700">
                          {txnItem.paymentMethod}
                        </span>
                        {txnItem.rechargeProfit ? (
                          <span className="text-emerald-300 font-bold">
                            +{formatCurrency(txnItem.rechargeProfit)} {language === 'en' ? 'profit' : 'লাভ'}
                          </span>
                        ) : null}
                        {txnItem.serviceCharge ? (
                          <span className="text-emerald-300 font-bold">
                            +{formatCurrency(txnItem.serviceCharge)} {language === 'en' ? 'fee' : 'কমিশন'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className={`font-mono font-black text-sm sm:text-base ${
                        isIncome ? 'text-emerald-400' : isExpense ? 'text-rose-400' : 'text-teal-300'
                      }`}>
                        {isIncome ? '+' : isExpense ? '-' : '⇄'}
                        {formatCurrency(txnItem.amount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openReceiptModalForTransaction(txnItem)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-700 transition-colors cursor-pointer"
                        title={language === 'en' ? 'Print / Show Receipt (Auto-save)' : 'রসিদ দেখুন ও প্রিন্ট করুন'}
                      >
                        <Receipt className="w-4 h-4 text-amber-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedEditTxn(txnItem)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-blue-300 hover:bg-slate-700 transition-colors cursor-pointer"
                        title={t.actionEdit}
                      >
                        <Edit2 className="w-4 h-4 text-slate-300" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Tab 2: Saved Receipts History in Dashboard */}
      {dashboardTab === 'receipts' && (
        receipts.length === 0 ? (
          <div className="p-8 text-center text-slate-300 space-y-3">
            <Receipt className="w-12 h-12 mx-auto text-amber-400/80" />
            <p className="text-sm font-bold text-white">
              {language === 'en' ? 'No saved customer receipts yet' : 'এখনো কোন রসিদ সংরক্ষণ করা হয়নি'}
            </p>
            <p className="text-xs text-slate-300 font-medium">
              {language === 'en'
                ? 'Generate customer receipts to print or save them to history'
                : 'গ্রাহকের রসিদ তৈরি করে প্রিন্ট করুন এবং এখানে সংরক্ষিত থাকবে'}
            </p>
            <button
              type="button"
              onClick={() => openGenerateReceiptModal()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Generate First Receipt' : 'প্রথম রসিদ তৈরি করুন'}</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {receipts.slice(0, 10).map(r => (
              <div
                key={r.id}
                className="px-4 py-3 sm:px-5 flex flex-wrap sm:flex-nowrap items-center justify-between hover:bg-slate-800/60 transition-colors gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-xs text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-md">
                      {r.receiptNumber}
                    </span>
                    <span className="text-xs text-slate-300 flex items-center gap-1 font-mono font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {r.date} {r.time}
                    </span>
                    <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                      {r.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white flex items-center gap-1 text-sm">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      {r.customerName}
                    </span>
                    {r.customerMobile && (
                      <span className="text-xs text-slate-200 font-mono font-medium flex items-center gap-1 bg-slate-800/80 px-1.5 py-0.5 rounded">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        {r.customerMobile}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-300 font-medium truncate max-w-md">
                    {r.items.map(item => `${item.name} (x${item.qty})`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className="font-mono font-black text-base text-emerald-400">
                      {formatCurrency(r.totalAmount)}
                    </div>
                    <div className="text-[11px] text-emerald-300 font-bold font-mono bg-emerald-500/20 px-1.5 py-0.2 rounded inline-block">
                      ✓ PAID
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openReceiptModal(r)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      title={language === 'en' ? 'Show & Print Receipt' : 'রসিদ দেখুন ও প্রিন্ট করুন'}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{language === 'en' ? 'Show' : 'দেখুন'}</span>
                    </button>

                    {deletingReceiptId === r.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteReceipt(r.id);
                            setDeletingReceiptId(null);
                          }}
                          className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                        >
                          {language === 'en' ? 'Yes' : 'হ্যাঁ'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingReceiptId(null)}
                          className="p-1 rounded bg-slate-800 text-slate-200 hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingReceiptId(r.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      </div>



      <EditTransactionModal
        transaction={selectedEditTxn}
        isOpen={Boolean(selectedEditTxn)}
        onClose={() => setSelectedEditTxn(null)}
      />
    </div>
  );
};
