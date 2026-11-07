import React, { useState, useMemo } from 'react';
import {
  ArrowRightLeft,
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

export const MoneyTransferView: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction } = useShop();
  const { t, language } = useLanguage();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [transferDate, setTransferDate] = useState(getTodayDateString());
  const [receiverName, setReceiverName] = useState('');
  const [receiverAccount, setReceiverAccount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [serviceCharge, setServiceCharge] = useState<number | ''>(25);
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

  const transferTransactions = useMemo(() => {
    return transactions.filter(t => t.type === 'money_transfer' || t.category === 'cat-money-transfer');
  }, [transactions]);

  const filteredList = useMemo(() => {
    if (!search.trim()) return transferTransactions;
    const q = search.toLowerCase().trim();
    return transferTransactions.filter(
      t =>
        t.customerName?.toLowerCase().includes(q) ||
        t.customerMobile?.includes(q) ||
        t.receiverName?.toLowerCase().includes(q) ||
        t.receiverAccount?.toLowerCase().includes(q) ||
        t.referenceNumber?.toLowerCase().includes(q)
    );
  }, [transferTransactions, search]);

  const stats = useMemo(() => {
    let totalAmt = 0;
    let totalFees = 0;

    for (const t of transferTransactions) {
      totalAmt += Number(t.amount) || 0;
      totalFees += Number(t.serviceCharge) || 0;
    }

    return {
      totalAmount: totalAmt,
      totalFees,
      count: transferTransactions.length,
    };
  }, [transferTransactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setErrorNotice(language === 'en' ? 'Please enter a valid transfer amount' : 'সঠিক ট্রান্সফার অঙ্ক লিখুন');
      return;
    }

    addTransaction({
      date: transferDate || getTodayDateString(),
      time: getCurrentTimeString(),
      type: 'money_transfer',
      category: 'cat-money-transfer',
      serviceName: `Money Transfer: ${receiverName ? receiverName + ' - ' : ''}₹${amt}`,
      amount: amt,
      paymentMethod,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      receiverName: receiverName.trim(),
      receiverAccount: receiverAccount.trim(),
      serviceCharge: serviceCharge !== '' ? Number(serviceCharge) : 0,
      referenceNumber: referenceNumber.trim(),
      note: note.trim(),
    });

    setSuccessNotice(`₹${amt} ${language === 'en' ? 'transfer recorded successfully!' : 'এর ট্রান্সফার রেকর্ড সফলভাবে সম্পন্ন হয়েছে!'}`);
    setCustomerName('');
    setCustomerMobile('');
    setAmount('');
    setReceiverName('');
    setReceiverAccount('');
    setReferenceNumber('');
    setNote('');

    setTimeout(() => setSuccessNotice(''), 3000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span>{t.totalTransferVolume}</span>
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white">
            {formatCurrency(stats.totalAmount)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">{language === 'en' ? 'Total remittance volume' : 'সর্বমোট পাঠানো টাকা'}</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span>{t.transferCommission}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-400">
            {formatCurrency(stats.totalFees, true)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">{language === 'en' ? 'Commission income' : 'ট্রান্সফার কমিশন লাভ'}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.transferCount}</span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white">
            {stats.count} <span className="text-xs font-normal text-slate-400">{language === 'en' ? 'records' : 'টি রেকর্ড'}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">{language === 'en' ? 'Successful transfers' : 'সফল DMT হিসেব'}</div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{language === 'en' ? 'New Money Transfer Entry (DMT)' : 'নতুন মানি ট্রান্সফার এন্ট্রি (DMT)'}</h3>
              <p className="text-xs text-slate-400">
                {language === 'en'
                  ? 'Cash collected increases Cash balance, dispatched from Bank account'
                  : 'কাস্টমার ক্যাশ দিলে ক্যাশ বাড়ে এবং ব্যাংক থেকে টাকা ট্রান্সফার হয়'}
              </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.customerName} *</label>
              <input
                type="text"
                required
                placeholder={language === 'en' ? 'Sender Customer Name' : 'যে ব্যক্তি টাকা পাঠাতে এসেছে'}
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.customerMobile} *</label>
              <input
                type="tel"
                required
                placeholder="98XXXXXXXX"
                value={customerMobile}
                onChange={e => setCustomerMobile(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{language === 'en' ? 'Transfer Amount (₹) *' : 'ট্রান্সফার পরিমাণ (Amount ₹) *'}</label>
              <input
                type="number"
                min="100"
                step="any"
                required
                placeholder="2000"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.receiverName}</label>
              <input
                type="text"
                required
                placeholder={language === 'en' ? 'Receiver Beneficiary Name' : 'যার ব্যাংক একাউন্টে যাবে'}
                value={receiverName}
                onChange={e => setReceiverName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.receiverAccount}</label>
              <input
                type="text"
                placeholder="SBI 3021... or UPI ID"
                value={receiverAccount}
                onChange={e => setReceiverAccount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none"
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
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.date}</label>
              <input
                type="date"
                value={transferDate}
                onChange={e => setTransferDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.paymentMethod}</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="cash">{language === 'en' ? 'Cash Received (Cash In)' : 'নগদ ক্যাশ দিল (Cash In)'}</option>
                <option value="upi">{language === 'en' ? 'UPI / QR Received' : 'QR / UPI তে দিল'}</option>
                <option value="bank">{language === 'en' ? 'Bank Deposit' : 'ব্যাংক একাউন্টে দিল'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{language === 'en' ? 'Bank UTR / Reference' : 'ব্যাংক UTR / রসিদ রেফারেন্স'}</label>
              <input
                type="text"
                placeholder="IMPS / UTR No"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.note}</label>
              <input
                type="text"
                placeholder={language === 'en' ? 'Optional note' : 'ঐচ্ছিক কোনো তথ্য'}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{language === 'en' ? '+ Create Transfer Entry' : '+ নতুন ট্রান্সফার এন্ট্রি তৈরি'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Transfer History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-800/80 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>{t.transferHistory} ({filteredList.length})</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search customer, receiver or ref...' : 'গ্রাহক, প্রাপক বা রেফারেন্স খুঁজুন...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {language === 'en' ? 'No money transfers found.' : 'কোনো ট্রান্সফার পাওয়া যায়নি।'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5">{t.date}</th>
                  <th className="px-4 py-2.5">{language === 'en' ? 'Customer' : 'গ্রাহক'}</th>
                  <th className="px-4 py-2.5">{language === 'en' ? 'Receiver & Account' : 'প্রাপক ও একাউন্ট'}</th>
                  <th className="px-4 py-2.5 text-right">{language === 'en' ? 'Amount (₹)' : 'ট্রান্সফার অঙ্ক'}</th>
                  <th className="px-4 py-2.5 text-right">{language === 'en' ? 'Fee (₹)' : 'সার্ভিস চার্জ'}</th>
                  <th className="px-4 py-2.5">{language === 'en' ? 'UTR / Ref' : 'রেফারেন্স / UTR'}</th>
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
                      <div className="font-bold text-slate-200">{tItem.customerName || 'Customer'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tItem.customerMobile}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="font-bold text-slate-200">{tItem.receiverName || 'Receiver'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tItem.receiverAccount || '—'}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap font-mono font-bold text-white text-sm">
                      {formatCurrency(tItem.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap font-mono font-bold text-emerald-400">
                      +{formatCurrency(tItem.serviceCharge || 0)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[10px] text-slate-400">
                      {tItem.referenceNumber || '—'}
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
