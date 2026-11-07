import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Plus,
  TrendingUp,
  Receipt,
  Search,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../lib/accounting';
import { Transaction, PaymentMethod } from '../types';
import { getTodayDateString, getCurrentTimeString } from '../data/defaults';
import { ViewReceiptModal } from '../components/modals/ViewReceiptModal';
import { EditTransactionModal } from '../components/modals/EditTransactionModal';

export const RechargeView: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction } = useShop();
  const { t, language } = useLanguage();

  // New Recharge Form State
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState<number | ''>('');
  const [rechargeDate, setRechargeDate] = useState(getTodayDateString());
  const [operator, setOperator] = useState('Jio');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [profit, setProfit] = useState<number | ''>(10);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [note, setNote] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');

  // Modals
  const [viewTxn, setViewTxn] = useState<Transaction | null>(null);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState('');

  // Filter all recharge transactions
  const rechargeTransactions = useMemo(() => {
    return transactions.filter(t => t.type === 'recharge' || t.category === 'cat-recharge');
  }, [transactions]);

  // Filtered list
  const filteredList = useMemo(() => {
    if (!search.trim()) return rechargeTransactions;
    const q = search.toLowerCase().trim();
    return rechargeTransactions.filter(
      t =>
        t.customerMobile?.includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        t.rechargeOperator?.toLowerCase().includes(q) ||
        t.referenceNumber?.toLowerCase().includes(q)
    );
  }, [rechargeTransactions, search]);

  // Aggregate Stats
  const stats = useMemo(() => {
    let totalAmt = 0;
    let totalProfit = 0;

    for (const t of rechargeTransactions) {
      totalAmt += Number(t.amount) || 0;
      totalProfit += Number(t.rechargeProfit) || 0;
    }

    return {
      totalRecharge: totalAmt,
      totalProfit,
      count: rechargeTransactions.length,
    };
  }, [rechargeTransactions]);

  const handleQuickRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    const amt = Number(rechargeAmount);
    if (!amt || amt <= 0) {
      setErrorNotice(language === 'en' ? 'Please enter a valid recharge amount' : 'সঠিক রিচার্জের অঙ্ক লিখুন');
      return;
    }

    addTransaction({
      date: rechargeDate || getTodayDateString(),
      time: getCurrentTimeString(),
      type: 'recharge',
      category: 'cat-recharge',
      serviceName: `${operator} Recharge (${mobileNumber || (language === 'en' ? 'Customer' : 'গ্রাহক')})`,
      amount: amt,
      paymentMethod,
      customerName: customerName.trim(),
      customerMobile: mobileNumber.trim(),
      rechargeOperator: operator,
      rechargeProfit: profit !== '' ? Number(profit) : 0,
      referenceNumber: referenceNumber.trim(),
      note: note.trim(),
    });

    setSuccessNotice(`₹${amt} ${operator} ${language === 'en' ? 'recharge recorded successfully!' : 'রিচার্জ সফলভাবে জমা হয়েছে!'}`);
    setMobileNumber('');
    setCustomerName('');
    setRechargeAmount('');
    setReferenceNumber('');
    setNote('');

    setTimeout(() => setSuccessNotice(''), 3000);
  };

  const operators = ['Jio', 'Airtel', 'Vi', 'BSNL', 'Tata Play / DTH', 'Airtel DTH'];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 3 Prominent Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Recharge Volume */}
        <div className="bg-gradient-to-br from-violet-950/40 to-slate-900 border border-violet-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-violet-400 mb-1">
            <span>{t.totalRechargeVolume}</span>
            <Smartphone className="w-4 h-4 text-violet-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white">
            {formatCurrency(stats.totalRecharge)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">{language === 'en' ? 'Total volume processed' : 'সর্বমোট গ্রাহক রিচার্জ'}</div>
        </div>

        {/* Total Profit */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span>{t.rechargeProfit}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-400">
            {formatCurrency(stats.totalProfit, true)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">{language === 'en' ? 'Net commission earned' : 'মোট অর্জিত দোকান কমিশন'}</div>
        </div>

        {/* Count */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.rechargeCount}</span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white">
            {stats.count} <span className="text-xs font-normal text-slate-400">{language === 'en' ? 'transactions' : 'টি ট্রানজ্যাকশন'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">{language === 'en' ? 'Completed recharges' : 'সফল রিচার্জ রেকর্ড'}</div>
        </div>
      </div>

      {/* Quick Recharge Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{language === 'en' ? 'New Mobile & DTH Recharge Entry' : 'নতুন মোবাইল / DTH রিচার্জ এন্ট্রি'}</h3>
              <p className="text-xs text-slate-400">{language === 'en' ? 'Track commission and balance automatically' : 'কমিশন ও পেমেন্ট হিসেব স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে'}</p>
            </div>
          </div>
        </div>

        {errorNotice && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-medium animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleQuickRecharge} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.operator}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {operators.map(op => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setOperator(op)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                    operator === op
                      ? 'bg-violet-600 text-white border-violet-500 shadow-md ring-2 ring-violet-400/40'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.customerMobile} *</label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="98XXXXXXXX"
                value={mobileNumber}
                onChange={e => setMobileNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{language === 'en' ? 'Amount (₹) *' : 'রিচার্জের অঙ্ক (Amount ₹) *'}</label>
              <input
                type="number"
                min="10"
                step="any"
                required
                placeholder="299"
                value={rechargeAmount}
                onChange={e => setRechargeAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {/* Quick Plan Chips */}
              <div className="flex items-center gap-1 flex-wrap mt-1.5">
                {[19, 29, 199, 239, 299, 349, 666, 2999].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setRechargeAmount(p)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-violet-300 border border-slate-700 cursor-pointer"
                  >
                    ₹{p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.profitCommission}</label>
              <input
                type="number"
                min="0"
                placeholder="10"
                value={profit}
                onChange={e => setProfit(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.paymentMethod}</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="cash">{t.cash}</option>
                <option value="upi">{t.upi}</option>
                <option value="bank">{t.bank}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.date}</label>
              <input
                type="date"
                value={rechargeDate}
                onChange={e => setRechargeDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.customerName}</label>
              <input
                type="text"
                placeholder={language === 'en' ? 'Customer Name' : 'গ্রাহকের নাম'}
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.refNumber}</label>
              <input
                type="text"
                placeholder="JIO-123456"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.note}</label>
              <input
                type="text"
                placeholder={language === 'en' ? 'e.g. 1.5GB/day 28-day pack' : 'যেমন: ১.৫ GB/দিন প্যাক'}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{language === 'en' ? '+ Create Recharge Entry' : '+ নতুন রিচার্জ এন্ট্রি তৈরি'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Recharge History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-800/80 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-violet-400" />
            <span>{t.rechargeHistory} ({filteredList.length})</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search mobile or customer...' : 'মোবাইল বা নাম খুঁজুন...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {language === 'en' ? 'No recharge records found.' : 'কোনো রিচার্জ রেকর্ড পাওয়া যায়নি।'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5">{t.date}</th>
                  <th className="px-4 py-2.5">{t.operator}</th>
                  <th className="px-4 py-2.5">{language === 'en' ? 'Mobile & Customer' : 'মোবাইল ও গ্রাহক'}</th>
                  <th className="px-4 py-2.5 text-right">{language === 'en' ? 'Amount (₹)' : 'রিচার্জ অঙ্ক'}</th>
                  <th className="px-4 py-2.5 text-right">{language === 'en' ? 'Profit' : 'লাভ / কমিশন'}</th>
                  <th className="px-4 py-2.5 text-center">{language === 'en' ? 'Method' : 'পদ্ধতি'}</th>
                  <th className="px-4 py-2.5 text-right">{language === 'en' ? 'Action' : 'অ্যাকশন'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredList.map(tItem => (
                  <tr key={tItem.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-slate-300">
                      {tItem.date} <span className="text-[10px] text-slate-500">({tItem.time})</span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold text-[10px]">
                        {tItem.rechargeOperator || 'Recharge'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-200">
                        {tItem.customerMobile || '—'}
                      </div>
                      {tItem.customerName && (
                        <div className="text-[10px] text-slate-400">{tItem.customerName}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap font-mono font-bold text-white text-sm">
                      {formatCurrency(tItem.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap font-mono font-bold text-emerald-400">
                      +{formatCurrency(tItem.rechargeProfit || 0)}
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <span className="uppercase text-[10px] text-slate-400 font-semibold">
                        {tItem.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewTxn(tItem)}
                          className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                          title={t.actionReceipt}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditTxn(tItem)}
                          className="p-1 rounded text-slate-400 hover:text-blue-400 cursor-pointer"
                          title={t.actionEdit}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirmId === tItem.id ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                deleteTransaction(tItem.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-500"
                            >
                              {language === 'en' ? 'Yes' : 'হ্যাঁ'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(tItem.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                            title={t.actionDelete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewTxn && (
        <ViewReceiptModal
          transaction={viewTxn}
          isOpen={Boolean(viewTxn)}
          onClose={() => setViewTxn(null)}
        />
      )}

      {editTxn && (
        <EditTransactionModal
          transaction={editTxn}
          isOpen={Boolean(editTxn)}
          onClose={() => setEditTxn(null)}
        />
      )}
    </div>
  );
};
