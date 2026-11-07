import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Printer,
  Download,
  Wallet,
  Building2,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, calculateRangeSummary, calculateCategoryBreakdown } from '../lib/accounting';
import { exportTransactionsAsCSV } from '../lib/backup';
import { getTodayDateString } from '../data/defaults';

export const ReportsView: React.FC = () => {
  const { transactions, categories, dailyBalances, shopSettings } = useShop();
  const { t, language } = useLanguage();

  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [customStart, setCustomStart] = useState(getTodayDateString());
  const [customEnd, setCustomEnd] = useState(getTodayDateString());

  // Compute effective date range
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (reportType === 'daily') {
      return { startDate: selectedDate, endDate: selectedDate };
    }

    if (reportType === 'weekly') {
      const d = new Date(selectedDate || todayStr);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        startDate: monday.toISOString().split('T')[0],
        endDate: sunday.toISOString().split('T')[0],
      };
    }

    if (reportType === 'monthly') {
      const [year, month] = (selectedDate || todayStr).split('-');
      const start = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      return { startDate: start, endDate: end };
    }

    return {
      startDate: customStart || todayStr,
      endDate: customEnd || todayStr,
    };
  }, [reportType, selectedDate, customStart, customEnd]);

  const summary = useMemo(() => {
    return calculateRangeSummary(startDate, endDate, dailyBalances, transactions);
  }, [startDate, endDate, dailyBalances, transactions]);

  const categoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(summary.transactions);
  }, [summary.transactions]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportTransactionsAsCSV(summary.transactions, `report_${reportType}_${startDate}_to_${endDate}.csv`);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Control Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>{t.reportsTitle}</span>
          </h2>
          <p className="text-xs text-slate-400">{t.reportsDesc}</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          <div className="bg-slate-800 p-1 rounded-xl flex gap-1">
            {[
              { id: 'daily', label: t.dailyReport },
              { id: 'weekly', label: t.weeklyReport },
              { id: 'monthly', label: t.monthlyReport },
              { id: 'custom', label: t.customReport },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReportType(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  reportType === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {reportType !== 'custom' ? (
            <input
              type={reportType === 'monthly' ? 'month' : 'date'}
              value={reportType === 'monthly' ? selectedDate.slice(0, 7) : selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
              <span className="text-xs text-slate-500">{language === 'en' ? 'to' : 'থেকে'}</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t.printReport}
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">{t.printReport}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={t.exportCSV}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0">
        <div className="border-b border-slate-800 pb-4 print:border-slate-300">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-amber-300 print:text-slate-900">
              {shopSettings.shopName}
            </h1>
            <p className="text-xs text-slate-400 print:text-slate-600 font-medium">
              {shopSettings.shopName} • {t.reportsTitle}
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              {language === 'en' ? 'Period:' : 'সময়সীমা:'}{' '}
              <strong className="text-slate-200 print:text-slate-900">{startDate}</strong>{' '}
              {language === 'en' ? 'to' : 'থেকে'}{' '}
              <strong className="text-slate-200 print:text-slate-900">{endDate}</strong>
            </p>
          </div>
        </div>

        {/* 3 Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 print:bg-slate-100 p-4 rounded-xl border border-slate-700 print:border-slate-300">
            <div className="text-xs font-semibold text-slate-400 print:text-slate-600 mb-1">
              {t.totalIncomeReport}
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 print:text-emerald-700">
              {formatCurrency(summary.totalIncome)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {language === 'en' ? 'Services, Recharges & DMT Commission' : 'সার্ভিস, রিচার্জ ও মানি ট্রান্সফার কমিশন'}
            </div>
          </div>

          <div className="bg-slate-800/80 print:bg-slate-100 p-4 rounded-xl border border-slate-700 print:border-slate-300">
            <div className="text-xs font-semibold text-slate-400 print:text-slate-600 mb-1">
              {t.totalExpenseReport}
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400 print:text-rose-700">
              {formatCurrency(summary.totalExpense)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {language === 'en' ? 'Total shop operating expenses' : 'দোকানের যাবতীয় খরচ'}
            </div>
          </div>

          <div className="bg-slate-800/80 print:bg-slate-100 p-4 rounded-xl border border-slate-700 print:border-slate-300">
            <div className="text-xs font-semibold text-slate-400 print:text-slate-600 mb-1">
              {t.netProfitReport}
            </div>
            <div className={`text-2xl font-bold font-mono ${
              summary.netIncome >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'
            }`}>
              {formatCurrency(summary.netIncome, true)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {language === 'en' ? 'Net profit after all expenses' : 'মোট আয় থেকে মোট খরচ বাদ দিয়ে'}
            </div>
          </div>
        </div>

        {/* Dual Accounting Reconciliation Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* CASH ACCOUNTING */}
          <div className="bg-slate-800/60 print:bg-slate-50 rounded-xl border border-slate-700 print:border-slate-300 overflow-hidden">
            <div className="bg-emerald-950/40 print:bg-emerald-100 px-4 py-3 border-b border-emerald-800/40 print:border-emerald-300 flex items-center justify-between">
              <span className="font-bold text-sm text-emerald-400 print:text-emerald-900 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> {t.cashReconciliation}
              </span>
            </div>

            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-700/60 print:border-slate-200">
                <span className="text-slate-300 print:text-slate-700">{t.openingCash}:</span>
                <span className="font-mono font-bold text-slate-200 print:text-slate-900">
                  {formatCurrency(summary.initialOpeningCash)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 text-emerald-400 print:text-emerald-800">
                <span>(+) {language === 'en' ? 'Cash In & Service Income' : 'নগদ জমা ও সার্ভিস আয়'}:</span>
                <span className="font-mono font-bold">+{formatCurrency(summary.totalCashIn)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-blue-400 print:text-blue-800">
                <span>(+) {t.quickBankToCash}:</span>
                <span className="font-mono font-bold">+{formatCurrency(summary.totalBankToCash)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-rose-400 print:text-rose-800">
                <span>(-) {language === 'en' ? 'Cash Out & Expenses' : 'নগদ খরচ ও উত্তোলন'}:</span>
                <span className="font-mono font-bold">-{formatCurrency(summary.totalCashOut)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-amber-400 print:text-amber-800">
                <span>(-) {t.quickCashToBank}:</span>
                <span className="font-mono font-bold">-{formatCurrency(summary.totalCashToBank)}</span>
              </div>

              <div className="pt-2 border-t-2 border-slate-700 print:border-slate-400 flex justify-between items-center text-sm font-bold bg-slate-900/60 print:bg-white p-2 rounded-lg">
                <span className="text-white print:text-slate-900">{t.closingCash}:</span>
                <span className="font-mono text-emerald-400 print:text-emerald-700 text-base">
                  {formatCurrency(summary.closingCash)}
                </span>
              </div>
            </div>
          </div>

          {/* BANK ACCOUNTING */}
          <div className="bg-slate-800/60 print:bg-slate-50 rounded-xl border border-slate-700 print:border-slate-300 overflow-hidden">
            <div className="bg-blue-950/40 print:bg-blue-100 px-4 py-3 border-b border-blue-800/40 print:border-blue-300 flex items-center justify-between">
              <span className="font-bold text-sm text-blue-400 print:text-blue-900 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> {t.bankReconciliation}
              </span>
            </div>

            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-700/60 print:border-slate-200">
                <span className="text-slate-300 print:text-slate-700">{t.openingBank}:</span>
                <span className="font-mono font-bold text-slate-200 print:text-slate-900">
                  {formatCurrency(summary.initialOpeningBank)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 text-emerald-400 print:text-emerald-800">
                <span>(+) {language === 'en' ? 'Bank & UPI In' : 'ব্যাংক ও UPI জমা'}:</span>
                <span className="font-mono font-bold">+{formatCurrency(summary.totalBankIn)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-blue-400 print:text-blue-800">
                <span>(+) {t.quickCashToBank}:</span>
                <span className="font-mono font-bold">+{formatCurrency(summary.totalCashToBank)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-rose-400 print:text-rose-800">
                <span>(-) {language === 'en' ? 'Bank Out & Transfers' : 'ব্যাংক থেকে খরচ / পাঠানো'}:</span>
                <span className="font-mono font-bold">-{formatCurrency(summary.totalBankOut)}</span>
              </div>

              <div className="flex justify-between items-center py-1 text-amber-400 print:text-amber-800">
                <span>(-) {t.quickBankToCash}:</span>
                <span className="font-mono font-bold">-{formatCurrency(summary.totalBankToCash)}</span>
              </div>

              <div className="pt-2 border-t-2 border-slate-700 print:border-slate-400 flex justify-between items-center text-sm font-bold bg-slate-900/60 print:bg-white p-2 rounded-lg">
                <span className="text-white print:text-slate-900">{t.closingBank}:</span>
                <span className="font-mono text-blue-400 print:text-blue-700 text-base">
                  {formatCurrency(summary.closingBank)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category-Wise Breakdown Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-white print:text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>{t.categoryBreakdown}</span>
            </h3>
            <span className="text-xs text-slate-400 print:text-slate-600">
              {Object.keys(categoryBreakdown).length} {language === 'en' ? 'active categories' : 'টি ক্যাটাগরিতে লেনদেন'}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-800 print:border-slate-300 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 print:bg-slate-100 text-slate-300 print:text-slate-700 font-semibold border-b border-slate-700 print:border-slate-300">
                <tr>
                  <th className="px-4 py-2.5">{t.filterCategory}</th>
                  <th className="px-4 py-2.5 text-center">{language === 'en' ? 'Count' : 'লেনদেন সংখ্যা'}</th>
                  <th className="px-4 py-2.5 text-right">{language === 'en' ? 'Volume (₹)' : 'মোট টাকা (Volume)'}</th>
                  <th className="px-4 py-2.5 text-right">{t.percentage}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {categories.map(cat => {
                  const data = categoryBreakdown[cat.id] || { totalAmount: 0, count: 0 };
                  const pct = summary.totalIncome > 0 ? ((data.totalAmount / summary.totalIncome) * 100).toFixed(1) : '0';

                  return (
                    <tr key={cat.id} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                      <td className="px-4 py-2.5 font-medium text-slate-200 print:text-slate-900">
                        {language === 'en' ? cat.name : cat.nameBn}{' '}
                        <span className="text-slate-500 font-normal">
                          ({language === 'en' ? cat.nameBn : cat.name})
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-slate-300 print:text-slate-700">
                        {data.count}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-white print:text-slate-900">
                        {formatCurrency(data.totalAmount)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-400 print:text-slate-600">
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>{language === 'en' ? 'Generated on:' : 'রিপোর্ট তৈরি হয়েছে:'} {new Date().toLocaleString('en-IN')}</span>
          <span>Radhamadhab Online Center Management System</span>
        </div>
      </div>
    </div>
  );
};
