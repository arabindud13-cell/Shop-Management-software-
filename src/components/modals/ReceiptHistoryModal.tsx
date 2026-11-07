import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Receipt,
  Printer,
  Trash2,
  Calendar,
  User,
  Phone,
  Plus,
  FileText,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../context/LanguageContext';
import { GeneratedReceipt } from '../../types';
import { formatCurrency } from '../../lib/accounting';
import { getTodayDateString } from '../../data/defaults';

interface ReceiptHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptHistoryModal: React.FC<ReceiptHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { receipts, deleteReceipt, openReceiptModal, openGenerateReceiptModal } = useShop();
  const { t, language } = useLanguage();

  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState<'all' | 'today'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = getTodayDateString();

  const filteredReceipts = useMemo(() => {
    return receipts
      .filter(r => {
        if (filterDate === 'today' && r.date !== today) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase().trim();
        return (
          r.receiptNumber.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerMobile.includes(q) ||
          r.date.includes(q) ||
          r.items.some(item => item.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [receipts, search, filterDate, today]);

  const totalRevenue = useMemo(() => {
    return filteredReceipts.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
  }, [filteredReceipts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl max-w-4xl w-full space-y-4 my-auto animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {language === 'en' ? 'Saved Receipt History' : 'সংরক্ষিত রসিদ ইতিহাস (Receipt History)'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'en'
                  ? 'All generated and printed customer receipts are stored here'
                  : 'সমস্ত তৈরি ও প্রিন্ট করা গ্রাহক রসিদ এখানে সংরক্ষিত আছে'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                openGenerateReceiptModal();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'New Receipt' : 'নতুন রসিদ'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                language === 'en'
                  ? 'Search by Receipt No, Customer, Mobile...'
                  : 'রসিদ নং, গ্রাহক বা মোবাইল দিয়ে খুঁজুন...'
              }
              className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-950/70 border border-slate-800 p-0.5 rounded-lg flex items-center text-xs">
              <button
                type="button"
                onClick={() => setFilterDate('all')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  filterDate === 'all'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'en' ? 'All Time' : 'সকল'}
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('today')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  filterDate === 'today'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'en' ? 'Today' : 'আজ'}
              </button>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-normal">
                {language === 'en' ? 'Total:' : 'মোট:'}
              </span>
              <span className="font-mono font-bold text-amber-300">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>
        </div>

        {/* Receipt List Table / Cards */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredReceipts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <Receipt className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
              <p className="text-xs font-medium">
                {language === 'en'
                  ? 'No saved receipts found. Click "+ New Receipt" to generate one!'
                  : 'কোন রসিদ পাওয়া যায়নি। "+ নতুন রসিদ" এ ক্লিক করে রসিদ তৈরি করুন!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReceipts.map(r => (
                <div
                  key={r.id}
                  className="bg-slate-950/70 hover:bg-slate-800/40 border border-slate-800/90 rounded-xl p-3 sm:p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-colors group"
                >
                  {/* Left: Meta & Customer */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        {r.receiptNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {r.date} {r.time}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                        {r.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-white flex items-center gap-1">
                        <User className="w-3 h-3 text-blue-400" />
                        {r.customerName}
                      </span>
                      {r.customerMobile && (
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          {r.customerMobile}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 truncate max-w-md">
                      {r.items.map(item => `${item.name} (x${item.qty})`).join(', ')}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-white">
                        {formatCurrency(r.totalAmount)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        {r.paymentStatus === 'paid' ? (language === 'en' ? 'PAID' : 'পরিশোধিত') : 'DUE'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openReceiptModal(r)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title={language === 'en' ? 'View & Reprint Receipt' : 'রসিদ দেখুন ও প্রিন্ট করুন'}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Show Receipt' : 'রসিদ দেখুন'}</span>
                      </button>

                      {deletingId === r.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              deleteReceipt(r.id);
                              setDeletingId(null);
                            }}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold"
                          >
                            {language === 'en' ? 'Delete' : 'মুছুন'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(r.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            {language === 'en'
              ? `Showing ${filteredReceipts.length} receipt(s)`
              : `${filteredReceipts.length} টি রসিদ প্রদর্শিত`}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
          >
            {language === 'en' ? 'Close' : 'বন্ধ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
