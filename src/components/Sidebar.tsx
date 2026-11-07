import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Smartphone,
  ArrowRightLeft,
  ShoppingBag,
  BarChart3,
  Settings,
  PlusCircle,
  Wallet,
  Building2,
  TrendingUp,
  Plus,
  History,
  LogOut,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../lib/accounting';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const {
    todaySummary,
    openAddModal,
    receipts,
    openReceiptHistoryModal,
    openGenerateReceiptModal,
    khataParties,
    pendingSimSmsCount,
  } = useShop();
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    {
      id: 'android-app',
      label: language === 'en' ? '📱 Android SIM App' : '📱 অ্যান্ড্রয়েড সিম অ্যাপ',
      icon: Smartphone,
      badge: pendingSimSmsCount > 0 ? pendingSimSmsCount : undefined,
    },
    { id: 'transactions', label: t.navTransactions, icon: Receipt },
    { id: 'khata', label: t.navKhata, icon: Users, badge: khataParties.length },
    { id: 'recharge', label: t.navRecharge, icon: Smartphone },
    { id: 'money-transfer', label: t.navMoneyTransfer, icon: ArrowRightLeft },
    { id: 'expenses', label: t.navExpenses, icon: ShoppingBag },
    { id: 'reports', label: t.navReports, icon: BarChart3 },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Quick Action Large Button */}
      <button
        type="button"
        onClick={() => openAddModal()}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-transform active:scale-95 mb-6 cursor-pointer"
      >
        <PlusCircle className="w-5 h-5 text-slate-950" />
        <span className="text-base tracking-wide font-extrabold">{language === 'en' ? '+ Create New Entry' : '+ নতুন লেনদেন তৈরি'}</span>
      </button>

      {/* Navigation List */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                  : 'text-white/90 hover:text-white hover:bg-slate-800 font-semibold'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
              <span className="truncate flex-1 text-left">{item.label}</span>
              {typeof (item as any).badge === 'number' && (item as any).badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {(item as any).badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Dedicated Receipt History & Generator buttons */}
        <div className="pt-2 mt-2 border-t border-slate-800 space-y-1">
          <button
            type="button"
            onClick={openReceiptHistoryModal}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>{language === 'en' ? 'Receipt History' : 'রসিদ ইতিহাস'}</span>
            </div>
            {receipts && receipts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                {receipts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => openGenerateReceiptModal()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Generate Receipt' : '+ রসিদ তৈরি করুন'}</span>
          </button>
        </div>
      </nav>

      {/* Bottom Mini Balances Widget */}
      <div className="mt-auto pt-4 border-t border-slate-800 space-y-2.5">
        <div className="text-xs font-bold uppercase text-slate-200 tracking-wider flex items-center justify-between">
          <span>{t.currentCash} &amp; {t.currentBank}</span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        </div>

        <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700/80 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" /> {t.cash}:
            </span>
            <span className="font-mono text-xs font-black text-emerald-300">
              {formatCurrency(todaySummary.closingCash)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> {t.bank}:
            </span>
            <span className="font-mono text-xs font-black text-blue-300">
              {formatCurrency(todaySummary.closingBank)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
            <span className="text-slate-200 font-semibold">{t.todayNetProfit}:</span>
            <span className={`font-mono font-black ${todaySummary.todayNetProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              {formatCurrency(todaySummary.todayNetProfit, true)}
            </span>
          </div>
        </div>

        {/* Logged in User & Logout button */}
        <div className="pt-2 flex items-center justify-between bg-slate-950 rounded-xl p-2.5 border border-slate-800">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-extrabold text-white truncate">
              {user?.shopName || 'My Shop'}
            </div>
            <div className="text-xs text-slate-300 font-mono font-medium">
              {user?.phone ? `+91 ${user.phone}` : 'Connected'}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-rose-500/30 transition-colors cursor-pointer shrink-0"
            title={language === 'en' ? 'Logout securely' : 'লগআউট করুন'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
