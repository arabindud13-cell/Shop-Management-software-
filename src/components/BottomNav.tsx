import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Plus,
  BarChart3,
  Settings,
  MoreHorizontal,
  Smartphone,
  ArrowRightLeft,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { openAddModal, openReceiptHistoryModal, openGenerateReceiptModal, receipts } = useShop();
  const { t, language } = useLanguage();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const moreItems = [
    { id: 'android-app', label: language === 'en' ? '📱 Android SIM App' : '📱 অ্যান্ড্রয়েড সিম অ্যাপ', icon: Smartphone, color: 'text-emerald-400' },
    { id: 'recharge', label: t.navRecharge, icon: Smartphone, color: 'text-violet-400' },
    { id: 'money-transfer', label: t.navMoneyTransfer, icon: ArrowRightLeft, color: 'text-amber-400' },
    { id: 'expenses', label: t.navExpenses, icon: ShoppingBag, color: 'text-rose-400' },
    { id: 'reports', label: t.navReports, icon: BarChart3, color: 'text-blue-400' },
    { id: 'settings', label: t.navSettings, icon: Settings, color: 'text-slate-400' },
  ];

  return (
    <>
      {/* More Options Popup for Mobile */}
      {showMoreMenu && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end p-3 pb-20 animate-in fade-in duration-150"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl p-4 space-y-3 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                {language === 'en' ? 'More Shop Portals' : 'দোকানের অন্যান্য পোর্টাল'}
              </span>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {moreItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowMoreMenu(false);
                    }}
                    className={`p-3 rounded-2xl flex items-center gap-2.5 text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:bg-slate-750'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Receipt History & Generator */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  openReceiptHistoryModal();
                }}
                className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:bg-slate-750 flex items-center gap-2 text-xs font-semibold cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-amber-400" />
                <span className="truncate">{language === 'en' ? 'Receipts' : 'রসিদ ইতিহাস'}</span>
                {receipts && receipts.length > 0 && (
                  <span className="ml-auto px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                    {receipts.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  openGenerateReceiptModal();
                }}
                className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 flex items-center gap-2 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span className="truncate">{language === 'en' ? 'New Receipt' : 'নতুন রসিদ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 shadow-2xl safe-area-bottom">
        <div className="flex items-center justify-around">
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-blue-300 font-black' : 'text-slate-200 hover:text-white font-semibold'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] truncate max-w-[65px]">{t.navDashboard}</span>
          </button>

          {/* Transactions */}
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'transactions' ? 'text-blue-300 font-black' : 'text-slate-200 hover:text-white font-semibold'
            }`}
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] truncate max-w-[65px]">{t.navTransactions.split(' ')[0]}</span>
          </button>

          {/* Big Add Button */}
          <button
            type="button"
            onClick={() => openAddModal()}
            className="-mt-5 w-13 h-13 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-600 text-slate-950 flex items-center justify-center shadow-xl shadow-orange-500/40 ring-4 ring-slate-950 active:scale-90 transition-transform cursor-pointer"
            aria-label={t.newEntryBtn}
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>

          {/* Khata Book Shortcut */}
          <button
            type="button"
            onClick={() => setActiveTab('khata')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'khata' ? 'text-emerald-300 font-black' : 'text-slate-200 hover:text-white font-semibold'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] truncate max-w-[65px]">
              {language === 'en' ? 'Khata' : 'খাতাবুক'}
            </span>
          </button>

          {/* More Menu */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              showMoreMenu || ['money-transfer', 'expenses', 'reports', 'settings'].includes(activeTab)
                ? 'text-amber-300 font-black'
                : 'text-slate-200 hover:text-white font-semibold'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] truncate max-w-[65px]">
              {language === 'en' ? 'More...' : 'আরও...'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};
