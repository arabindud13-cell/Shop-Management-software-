import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Clock,
  Wallet,
  Building2,
  CreditCard,
  Receipt,
  History,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import { Transaction, PaymentMethod } from '../types';
import { formatCurrency } from '../lib/accounting';
import { exportTransactionsAsCSV } from '../lib/backup';
import { ViewReceiptModal } from '../components/modals/ViewReceiptModal';
import { EditTransactionModal } from '../components/modals/EditTransactionModal';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    categories,
    deleteTransaction,
    openAddModal,
    receipts,
    openReceiptModalForTransaction,
    openReceiptHistoryModal,
    openGenerateReceiptModal,
  } = useShop();
  const { t, language } = useLanguage();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals
  const [receiptTxn, setReceiptTxn] = useState<Transaction | null>(null);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    const yesterdayStr = yest.toISOString().split('T')[0];

    const d = new Date(today);
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const mondayStr = monday.toISOString().split('T')[0];

    const firstDayMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    return transactions.filter(tItem => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = tItem.customerName?.toLowerCase().includes(query);
        const matchesMobile = tItem.customerMobile?.includes(query);
        const matchesService = tItem.serviceName.toLowerCase().includes(query);
        const matchesRef = tItem.referenceNumber?.toLowerCase().includes(query);
        const matchesNote = tItem.note?.toLowerCase().includes(query);
        const matchesReceiver = tItem.receiverName?.toLowerCase().includes(query);

        if (!matchesName && !matchesMobile && !matchesService && !matchesRef && !matchesNote && !matchesReceiver) {
          return false;
        }
      }

      // 2. Date filter
      if (dateFilter === 'today' && tItem.date !== todayStr) return false;
      if (dateFilter === 'yesterday' && tItem.date !== yesterdayStr) return false;
      if (dateFilter === 'this_week' && tItem.date < mondayStr) return false;
      if (dateFilter === 'this_month' && tItem.date < firstDayMonthStr) return false;
      if (dateFilter === 'custom') {
        if (customStartDate && tItem.date < customStartDate) return false;
        if (customEndDate && tItem.date > customEndDate) return false;
      }

      // 3. Category filter
      if (categoryFilter !== 'all' && tItem.category !== categoryFilter) return false;

      // 4. Payment Method filter
      if (paymentFilter !== 'all' && tItem.paymentMethod !== paymentFilter) return false;

      // 5. Type filter
      if (typeFilter === 'income') {
        if (!['service_income', 'cash_in', 'bank_in', 'recharge', 'money_transfer'].includes(tItem.type)) return false;
      } else if (typeFilter === 'expense') {
        if (!['expense', 'cash_out', 'bank_out'].includes(tItem.type)) return false;
      } else if (typeFilter === 'transfer') {
        if (!['cash_to_bank', 'bank_to_cash'].includes(tItem.type)) return false;
      }

      return true;
    });
  }, [
    transactions,
    searchQuery,
    dateFilter,
    customStartDate,
    customEndDate,
    categoryFilter,
    paymentFilter,
    typeFilter,
  ]);

  const filteredStats = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const tItem of filteredTransactions) {
      const amt = Number(tItem.amount) || 0;
      if (['service_income', 'cash_in', 'bank_in', 'recharge', 'money_transfer'].includes(tItem.type)) {
        income += amt;
      } else if (['expense', 'cash_out', 'bank_out'].includes(tItem.type)) {
        expense += amt;
      }
    }

    return {
      count: filteredTransactions.length,
      totalIncome: income,
      totalExpense: expense,
      net: income - expense,
    };
  }, [filteredTransactions]);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setDeletingId(null);
  };

  const handleExportCSV = () => {
    exportTransactionsAsCSV(filteredTransactions, `shop_ledger_${dateFilter}.csv`);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{t.transactionsTitle}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold">
              {filteredStats.count} {language === 'en' ? 'records' : 'টি রেকর্ড'}
            </span>
          </h2>
          <p className="text-xs text-slate-400">{t.transactionsSubtitle}</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            type="button"
            onClick={() => openGenerateReceiptModal()}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title={language === 'en' ? 'Generate Customer Receipt' : 'রসিদ তৈরি করুন'}
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'en' ? 'Receipt' : 'রসিদ'}</span>
          </button>

          <button
            type="button"
            onClick={openReceiptHistoryModal}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title={language === 'en' ? 'Saved Receipt History' : 'রসিদ ইতিহাস'}
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{language === 'en' ? 'History' : 'ইতিহাস'}</span>
            {receipts && receipts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                {receipts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.exportCSV}</span>
          </button>

          <button
            type="button"
            onClick={() => openAddModal()}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? '+ Create Entry' : '+ নতুন লেনদেন'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Date Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t.filterDate}</label>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">{language === 'en' ? 'All Dates' : 'সব তারিখ'}</option>
              <option value="today">{language === 'en' ? 'Today' : 'আজকে'}</option>
              <option value="yesterday">{language === 'en' ? 'Yesterday' : 'গতকাল'}</option>
              <option value="this_week">{language === 'en' ? 'This Week' : 'এই সপ্তাহ'}</option>
              <option value="this_month">{language === 'en' ? 'This Month' : 'এই মাস'}</option>
              <option value="custom">{language === 'en' ? 'Custom Range' : 'নির্দিষ্ট সময়'}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t.filterCategory}</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">{t.all}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {language === 'en' ? c.name : c.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t.filterPayment}</label>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">{t.all}</option>
              <option value="cash">{t.cash}</option>
              <option value="bank">{t.bank}</option>
              <option value="upi">{t.upi}</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{t.filterType}</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">{t.all}</option>
              <option value="income">{t.income}</option>
              <option value="expense">{t.expense}</option>
              <option value="transfer">{t.transfer}</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 flex-wrap">
            <span className="text-xs text-slate-400">{language === 'en' ? 'From:' : 'শুরু:'}</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none"
            />
            <span className="text-xs text-slate-400">{language === 'en' ? 'To:' : 'শেষ:'}</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Filtered Summary Bar */}
      <div className="bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>
            {language === 'en' ? 'Filtered Income:' : 'ফিল্টার করা আয়:'}{' '}
            <strong className="text-emerald-400 font-mono">{formatCurrency(filteredStats.totalIncome)}</strong>
          </span>
          <span>•</span>
          <span>
            {language === 'en' ? 'Expenses:' : 'খরচ:'}{' '}
            <strong className="text-rose-400 font-mono">{formatCurrency(filteredStats.totalExpense)}</strong>
          </span>
          <span>•</span>
          <span>
            {language === 'en' ? 'Net Profit:' : 'নিট লাভ:'}{' '}
            <strong className={`font-mono ${filteredStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(filteredStats.net, true)}
            </strong>
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Filter className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
            <p className="text-sm font-medium">{language === 'en' ? 'No transactions found.' : 'কোনো লেনদেন পাওয়া যায়নি।'}</p>
            <p className="text-xs text-slate-500">{language === 'en' ? 'Try adjusting your filters or search keywords.' : 'অনুগ্রহ করে ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">{language === 'en' ? 'Date & Time' : 'তারিখ ও সময়'}</th>
                  <th className="px-4 py-3">{language === 'en' ? 'Category' : 'ক্যাটাগরি'}</th>
                  <th className="px-4 py-3">{language === 'en' ? 'Service / Description' : 'সার্ভিস / বিবরণ'}</th>
                  <th className="px-4 py-3">{language === 'en' ? 'Customer & Mobile' : 'গ্রাহক ও মোবাইল'}</th>
                  <th className="px-4 py-3 text-right">{language === 'en' ? 'Amount (₹)' : 'টাকা (Amount)'}</th>
                  <th className="px-4 py-3 text-center">{language === 'en' ? 'Method' : 'পদ্ধতি'}</th>
                  <th className="px-4 py-3 text-right">{language === 'en' ? 'Action' : 'অ্যাকশন'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTransactions.map(tItem => {
                  const cat = categories.find(c => c.id === tItem.category);
                  const isIncome = ['service_income', 'cash_in', 'bank_in', 'recharge', 'money_transfer'].includes(tItem.type);
                  const isExpense = ['expense', 'cash_out', 'bank_out'].includes(tItem.type);

                  return (
                    <tr key={tItem.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono font-medium text-slate-200">{tItem.date}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tItem.time}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                          {language === 'en' ? (cat?.name || tItem.category) : (cat?.nameBn || tItem.category)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-100">{tItem.serviceName}</div>
                        {tItem.referenceNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {tItem.referenceNumber}
                          </div>
                        )}
                        {tItem.note && (
                          <div className="text-[10px] text-slate-500 italic truncate max-w-[200px]">
                            {tItem.note}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {tItem.customerName ? (
                          <div>
                            <div className="font-medium text-slate-200">{tItem.customerName}</div>
                            {tItem.customerMobile && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                {tItem.customerMobile}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div
                          className={`font-mono font-bold text-sm sm:text-base ${
                            isIncome
                              ? 'text-emerald-400'
                              : isExpense
                              ? 'text-rose-400'
                              : 'text-blue-400'
                          }`}
                        >
                          {formatCurrency(tItem.amount, isIncome)}
                        </div>
                        {tItem.rechargeProfit !== undefined && tItem.rechargeProfit > 0 && (
                          <div className="text-[10px] text-emerald-400 font-mono">
                            {language === 'en' ? 'Profit' : 'লাভ'}: +₹{tItem.rechargeProfit}
                          </div>
                        )}
                        {tItem.serviceCharge !== undefined && tItem.serviceCharge > 0 && (
                          <div className="text-[10px] text-amber-400 font-mono">
                            {language === 'en' ? 'Fee' : 'চার্জ'}: +₹{tItem.serviceCharge}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tItem.paymentMethod === 'cash'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : tItem.paymentMethod === 'bank'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {tItem.paymentMethod}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {deletingId === tItem.id ? (
                            <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-lg border border-rose-800">
                              <span className="text-[10px] text-rose-300 font-bold px-1">
                                {language === 'en' ? 'Delete?' : 'মুছবেন?'}
                              </span>
                              <button
                                onClick={() => handleDelete(tItem.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                              >
                                {language === 'en' ? 'Yes' : 'হ্যাঁ'}
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-1.5 py-0.5 rounded text-slate-400 hover:text-white text-[10px] cursor-pointer"
                              >
                                {language === 'en' ? 'No' : 'না'}
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => openReceiptModalForTransaction(tItem)}
                                title={language === 'en' ? 'Print / View Receipt (Auto-save)' : 'রসিদ দেখুন ও প্রিন্ট করুন'}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Receipt className="w-4 h-4 text-amber-400" />
                              </button>

                              <button
                                onClick={() => setEditTxn(tItem)}
                                title={t.actionEdit}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setDeletingId(tItem.id)}
                                title={t.actionDelete}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {receiptTxn && (
        <ViewReceiptModal
          transaction={receiptTxn}
          isOpen={Boolean(receiptTxn)}
          onClose={() => setReceiptTxn(null)}
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
