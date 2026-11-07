import { Transaction, DailyBalance } from '../types';

export interface DailyAccountSummary {
  date: string;
  openingCash: number;
  openingBank: number;
  cashIn: number;
  cashOut: number;
  bankIn: number;
  bankOut: number;
  cashToBank: number;
  bankToCash: number;
  closingCash: number;
  closingBank: number;
  todayIncome: number;
  todayExpense: number;
  todayNetProfit: number;
  transactionCount: number;
}

export function formatCurrency(amount: number, showSign = false): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(absVal);

  if (showSign && amount > 0) return `+₹${formatted}`;
  if (isNegative) return `-₹${formatted}`;
  return `₹${formatted}`;
}

export function formatBengaliNumber(val: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/[0-9]/g, d => bnDigits[Number(d)]);
}

/**
 * Calculates accounting balances for a specific day or date range.
 */
export function calculateDailySummary(
  targetDate: string,
  dailyBalances: Record<string, DailyBalance>,
  transactions: Transaction[]
): DailyAccountSummary {
  const dayBalance = dailyBalances[targetDate];
  const openingCash = dayBalance?.openingCash ?? 0;
  const openingBank = dayBalance?.openingBank ?? 0;

  const dayTxns = transactions.filter(t => t.date === targetDate);

  let cashIn = 0;
  let cashOut = 0;
  let bankIn = 0;
  let bankOut = 0;
  let cashToBank = 0;
  let bankToCash = 0;
  let todayIncome = 0;
  let todayExpense = 0;

  for (const t of dayTxns) {
    const amt = Number(t.amount) || 0;

    switch (t.type) {
      case 'cash_in':
        cashIn += amt;
        todayIncome += amt;
        break;

      case 'cash_out':
        cashOut += amt;
        todayExpense += amt;
        break;

      case 'bank_in':
        bankIn += amt;
        todayIncome += amt;
        break;

      case 'bank_out':
        bankOut += amt;
        todayExpense += amt;
        break;

      case 'cash_to_bank':
        cashToBank += amt;
        // Cash decreases, Bank increases
        break;

      case 'bank_to_cash':
        bankToCash += amt;
        // Bank decreases, Cash increases
        break;

      case 'service_income':
        todayIncome += amt;
        if (t.paymentMethod === 'cash') {
          cashIn += amt;
        } else {
          bankIn += amt; // bank or upi
        }
        break;

      case 'expense':
        todayExpense += amt;
        if (t.paymentMethod === 'cash') {
          cashOut += amt;
        } else {
          bankOut += amt; // bank or upi
        }
        break;

      case 'recharge': {
        const profit = Number(t.rechargeProfit) || 0;
        // Recharge income is either commission/profit or full transaction collected
        todayIncome += profit > 0 ? profit : amt;
        if (t.paymentMethod === 'cash') {
          cashIn += amt;
        } else {
          bankIn += amt;
        }
        break;
      }

      case 'money_transfer': {
        const fee = Number(t.serviceCharge) || 0;
        todayIncome += fee; // Shop's actual income is the service fee
        // In domestic money transfer: customer gives cash/upi, shop transfers from bank
        if (t.paymentMethod === 'cash') {
          cashIn += amt + fee; // customer gave cash for amount + fee
          bankOut += amt;      // shop sent money via bank
        } else {
          bankIn += fee;       // customer transferred total, shop dispatched amount, net fee remains in bank
        }
        break;
      }
    }
  }

  // Exact formulas specified in requirements:
  // Cash calculation: Opening Cash + Cash In + Bank to Cash - Cash Out - Cash to Bank
  const closingCash = openingCash + cashIn + bankToCash - cashOut - cashToBank;

  // Bank calculation: Opening Bank + Bank In + Cash to Bank - Bank Out - Bank to Cash
  const closingBank = openingBank + bankIn + cashToBank - bankOut - bankToCash;

  const todayNetProfit = todayIncome - todayExpense;

  return {
    date: targetDate,
    openingCash,
    openingBank,
    cashIn,
    cashOut,
    bankIn,
    bankOut,
    cashToBank,
    bankToCash,
    closingCash,
    closingBank,
    todayIncome,
    todayExpense,
    todayNetProfit,
    transactionCount: dayTxns.length,
  };
}

/**
 * Calculates aggregated report across any date range.
 */
export function calculateRangeSummary(
  startDate: string,
  endDate: string,
  dailyBalances: Record<string, DailyBalance>,
  transactions: Transaction[]
) {
  const rangeTxns = transactions.filter(t => t.date >= startDate && t.date <= endDate);

  // Initial opening is opening of the earliest date in range
  const sortedDates = Object.keys(dailyBalances)
    .filter(d => d >= startDate && d <= endDate)
    .sort();

  const firstDate = sortedDates[0] || startDate;
  const initialOpeningCash = dailyBalances[firstDate]?.openingCash ?? 0;
  const initialOpeningBank = dailyBalances[firstDate]?.openingBank ?? 0;

  let totalCashIn = 0;
  let totalCashOut = 0;
  let totalBankIn = 0;
  let totalBankOut = 0;
  let totalCashToBank = 0;
  let totalBankToCash = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of rangeTxns) {
    const amt = Number(t.amount) || 0;

    switch (t.type) {
      case 'cash_in':
        totalCashIn += amt;
        totalIncome += amt;
        break;
      case 'cash_out':
        totalCashOut += amt;
        totalExpense += amt;
        break;
      case 'bank_in':
        totalBankIn += amt;
        totalIncome += amt;
        break;
      case 'bank_out':
        totalBankOut += amt;
        totalExpense += amt;
        break;
      case 'cash_to_bank':
        totalCashToBank += amt;
        break;
      case 'bank_to_cash':
        totalBankToCash += amt;
        break;
      case 'service_income':
        totalIncome += amt;
        if (t.paymentMethod === 'cash') totalCashIn += amt;
        else totalBankIn += amt;
        break;
      case 'expense':
        totalExpense += amt;
        if (t.paymentMethod === 'cash') totalCashOut += amt;
        else totalBankOut += amt;
        break;
      case 'recharge': {
        const profit = Number(t.rechargeProfit) || 0;
        totalIncome += profit > 0 ? profit : amt;
        if (t.paymentMethod === 'cash') totalCashIn += amt;
        else totalBankIn += amt;
        break;
      }
      case 'money_transfer': {
        const fee = Number(t.serviceCharge) || 0;
        totalIncome += fee;
        if (t.paymentMethod === 'cash') {
          totalCashIn += amt + fee;
          totalBankOut += amt;
        } else {
          totalBankIn += fee;
        }
        break;
      }
    }
  }

  const closingCash = initialOpeningCash + totalCashIn + totalBankToCash - totalCashOut - totalCashToBank;
  const closingBank = initialOpeningBank + totalBankIn + totalCashToBank - totalBankOut - totalBankToCash;
  const netIncome = totalIncome - totalExpense;

  return {
    startDate,
    endDate,
    initialOpeningCash,
    initialOpeningBank,
    totalCashIn,
    totalCashOut,
    totalBankIn,
    totalBankOut,
    totalCashToBank,
    totalBankToCash,
    closingCash,
    closingBank,
    totalIncome,
    totalExpense,
    netIncome,
    totalTransactions: rangeTxns.length,
    transactions: rangeTxns,
  };
}

/**
 * Calculates category-wise breakdown.
 */
export function calculateCategoryBreakdown(transactions: Transaction[]) {
  const map: Record<string, { totalAmount: number; count: number; categoryId: string }> = {};

  for (const t of transactions) {
    const cat = t.category || 'cat-other';
    if (!map[cat]) {
      map[cat] = { totalAmount: 0, count: 0, categoryId: cat };
    }
    const amt = Number(t.amount) || 0;
    map[cat].totalAmount += amt;
    map[cat].count += 1;
  }

  return map;
}
