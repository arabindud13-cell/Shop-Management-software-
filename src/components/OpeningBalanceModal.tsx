import React, { useState, useEffect } from 'react';
import { X, Calendar, Wallet, Building2, Check, AlertCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import { getTodayDateString } from '../data/defaults';
import { formatCurrency } from '../lib/accounting';

interface OpeningBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpeningBalanceModal: React.FC<OpeningBalanceModalProps> = ({ isOpen, onClose }) => {
  const { dailyBalances, setDailyOpeningBalance } = useShop();
  const { t, language } = useLanguage();

  const [date, setDate] = useState(getTodayDateString());
  const [openingCash, setOpeningCash] = useState<number | ''>('');
  const [openingBank, setOpeningBank] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = dailyBalances[date];
      if (existing) {
        setOpeningCash(existing.openingCash);
        setOpeningBank(existing.openingBank);
        setNote(existing.note || '');
      } else {
        const dates = Object.keys(dailyBalances).sort();
        const prevDates = dates.filter(d => d < date);
        const lastDate = prevDates[prevDates.length - 1];
        if (lastDate && dailyBalances[lastDate]) {
          setOpeningCash(dailyBalances[lastDate].openingCash);
          setOpeningBank(dailyBalances[lastDate].openingBank);
        } else {
          setOpeningCash(10000);
          setOpeningBank(25000);
        }
        setNote('');
      }
      setSaveSuccess(false);
    }
  }, [isOpen, date, dailyBalances]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cashVal = Number(openingCash) || 0;
    const bankVal = Number(openingBank) || 0;

    setDailyOpeningBalance(date, cashVal, bankVal, note);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  const isToday = date === getTodayDateString();
  const existingForDate = dailyBalances[date];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.openingBalanceTitle}</h2>
              <p className="text-xs text-slate-400">{t.openingBalanceDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {saveSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-emerald-300 text-sm font-medium">
              <Check className="w-5 h-5 shrink-0" />
              <span>{language === 'en' ? `Opening balance for ${date} saved!` : `${date} তারিখের প্রারম্ভিক ব্যালেন্স সংরক্ষিত হয়েছে!`}</span>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" /> {t.date}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isToday ? (
                <span className="px-2.5 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg">
                  {t.today}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setDate(getTodayDateString())}
                  className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg cursor-pointer"
                >
                  {language === 'en' ? 'Today' : 'আজকে'}
                </button>
              )}
            </div>
            {existingForDate && (
              <p className="mt-1 text-[11px] text-amber-400/90 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {language === 'en'
                  ? 'Opening balance already recorded for this date (you may edit).'
                  : 'এই তারিখের জন্য ইতিমধ্যে ব্যালেন্স সংরক্ষিত আছে (আপনি চাইলে সংশোধন করতে পারেন)।'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opening Cash Input */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2">
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> {t.openingCashLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-lg">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="10000"
                  value={openingCash}
                  onChange={e => setOpeningCash(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {[5000, 10000, 15000, 20000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setOpeningCash(val)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700/80 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    +₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Opening Bank Input */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2">
              <label className="block text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> {t.openingBankLabel}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-lg">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="25000"
                  value={openingBank}
                  onChange={e => setOpeningBank(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {[10000, 25000, 50000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setOpeningBank(val)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700/80 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    +₹{val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.remarks}
            </label>
            <input
              type="text"
              placeholder={language === 'en' ? 'e.g. Morning opening drawer cash & SBI account' : 'যেমন: সকাল ৯:০০ টার ক্যাশ বক্স ও SBI ব্যালেন্স'}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Total Preview */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">{t.totalOpening}:</span>
            <span className="font-mono font-bold text-amber-400 text-base">
              {formatCurrency((Number(openingCash) || 0) + (Number(openingBank) || 0))}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {t.saveBalance}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
