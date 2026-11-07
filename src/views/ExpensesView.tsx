import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Receipt,
  Search,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  TrendingDown,
  Wallet,
  Building2,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../lib/accounting';
import { Transaction, PaymentMethod } from '../types';
import { getTodayDateString, getCurrentTimeString, DEFAULT_EXPENSE_CATEGORIES } from '../data/defaults';
import { EditTransactionModal } from '../components/modals/EditTransactionModal';

export const ExpensesView: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction } = useShop();
  const { t, language } = useLanguage();

  const [category, setCategory] = useState('exp-shop');
  const [amount, setAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');

  // Modals
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState('');

  const expenseTransactions = useMemo(() => {
    return transactions.filter(tItem => tItem.type === 'expense' || tItem.type === 'cash_out' || tItem.type === 'bank_out');
  }, [transactions]);

  const filteredList = useMemo(() => {
    if (!search.trim()) return expenseTransactions;
    const q = search.toLowerCase().trim();
    return expenseTransactions.filter(
      tItem =>
        tItem.serviceName?.toLowerCase().includes(q) ||
        tItem.note?.toLowerCase().includes(q) ||
        tItem.referenceNumber?.toLowerCase().includes(q)
    );
  }, [expenseTransactions, search]);

  const stats = useMemo(() => {
    let totalCashExp = 0;
    let totalBankExp = 0;

    for (const tItem of expenseTransactions) {
      const amt = Number(tItem.amount) || 0;
      if (tItem.paymentMethod === 'cash') totalCashExp += amt;
      else totalBankExp += amt;
    }

    return {
      total: totalCashExp + totalBankExp,
      cashExpense: totalCashExp,
      bankExpense: totalBankExp,
      count: expenseTransactions.length,
    };
  }, [expenseTransactions]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setErrorNotice(language === 'en' ? 'Please enter a valid expense amount' : 'সঠিক খরচের অঙ্ক লিখুন');
      return;
    }

    const expObj = DEFAULT_EXPENSE_CATEGORIES.find(c => c.id === category);
    const finalDesc = description.trim() || (language === 'en' ? expObj?.name : expObj?.nameBn) || 'Shop Expense';

    addTransaction({
      date: expenseDate || getTodayDateString(),
      time: getCurrentTimeString(),
      type: 'expense',
      category: category,
      serviceName: finalDesc,
      amount: amt,
      paymentMethod,
      expenseCategory: category,
      note: note.trim(),
    });

    setSuccessNotice(`₹${amt} ${language === 'en' ? 'expense recorded successfully!' : 'এর খরচ সফলভাবে লিপিবদ্ধ হয়েছে!'}`);
    setAmount('');
    setDescription('');
    setNote('');

    setTimeout(() => setSuccessNotice(''), 3000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-950/40 to-slate-900 border border-rose-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span>{t.totalExpenses}</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-rose-400">
            {formatCurrency(stats.total)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">{language === 'en' ? 'Total shop operating costs' : 'সর্বমোট দোকানের খরচ'}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.cashExpenses}</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white">
            {formatCurrency(stats.cashExpense)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">{language === 'en' ? 'Paid out of cash drawer' : 'ক্যাশ বক্স থেকে দেওয়া হয়েছে'}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.bankExpenses}</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white">
            {formatCurrency(stats.bankExpense)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">{language === 'en' ? 'Paid from bank / online' : 'ব্যাংক একাউন্ট থেকে কাটা হয়েছে'}</div>
        </div>
      </div>

      {/* Add Expense Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <Minus className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{language === 'en' ? 'New Shop Expense Entry' : 'নতুন দোকান খরচের এন্ট্রি'}</h3>
              <p className="text-xs text-slate-400">{language === 'en' ? 'Automatically deducted from selected Cash or Bank balance' : 'খরচ যোগ করলে নির্বাচিত ক্যাশ বা ব্যাংক ব্যালেন্স স্বয়ংক্রিয়ভাবে কমে যাবে'}</p>
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

        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {t.expenseCategory}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEFAULT_EXPENSE_CATEGORIES.map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    setCategory(e.id);
                    if (!description) setDescription(language === 'en' ? e.name : e.nameBn);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    category === e.id
                      ? 'bg-rose-500/20 border-rose-500 text-rose-200 ring-2 ring-rose-500/30 font-bold'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>{language === 'en' ? e.name : e.nameBn}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{language === 'en' ? e.nameBn : e.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.date}</label>
              <input
                type="date"
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{language === 'en' ? 'Amount (₹) *' : 'টাকার অঙ্ক (Amount ₹) *'}</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="50"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.paymentMethod}</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="cash">{language === 'en' ? 'Cash (Cash decreases)' : 'নগদ ক্যাশ (Cash কমে যাবে)'}</option>
                <option value="bank">{language === 'en' ? 'Bank Account (Bank decreases)' : 'ব্যাংক একাউন্ট (Bank কমে যাবে)'}</option>
                <option value="upi">{language === 'en' ? 'UPI / QR (Bank decreases)' : 'UPI / QR (Bank কমে যাবে)'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">{language === 'en' ? 'Description' : 'খরচের সুনির্দিষ্ট বিবরণ'}</label>
              <input
                type="text"
                placeholder={language === 'en' ? 'e.g. 1 Rim A4 Paper, Refreshments' : 'যেমন: ১ রিম A4 পেপার, ইলেকট্রিক বিল'}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.note}</label>
            <input
              type="text"
              placeholder={language === 'en' ? 'Bill no or details' : 'রসিদ নম্বর বা বিস্তারিত মন্তব্য'}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{language === 'en' ? '+ Create Expense Entry' : '+ নতুন খরচের এন্ট্রি তৈরি'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Expense History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-800/80 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-400" />
            <span>{language === 'en' ? 'Expense History Ledger' : 'সকল খরচের খাতা'} ({filteredList.length})</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search expenses...' : 'খরচের বিবরণ খুঁজুন...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {language === 'en' ? 'No expense records found.' : 'কোনো খরচের রেকর্ড পাওয়া যায়নি।'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5">{t.date}</th>
                  <th className="px-4 py-2.5">{language === 'en' ? 'Item / Category' : 'খাত / বিবরণ'}</th>
                  <th className="px-4 py-2.5 text-right">{language === 'en' ? 'Amount (₹)' : 'টাকা (Amount)'}</th>
                  <th className="px-4 py-2.5 text-center">{language === 'en' ? 'Method' : 'মাধ্যম'}</th>
                  <th className="px-4 py-2.5">{t.note}</th>
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
                      <div className="font-bold text-slate-200">{tItem.serviceName}</div>
                      {tItem.expenseCategory && (
                        <div className="text-[10px] text-slate-400">
                          {language === 'en'
                            ? DEFAULT_EXPENSE_CATEGORIES.find(c => c.id === tItem.expenseCategory)?.name
                            : DEFAULT_EXPENSE_CATEGORIES.find(c => c.id === tItem.expenseCategory)?.nameBn}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap font-mono font-bold text-rose-400 text-sm">
                      -{formatCurrency(tItem.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <span className="uppercase text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {tItem.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-[11px] truncate max-w-[200px]">
                      {tItem.note || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
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
