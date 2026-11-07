import { AppDataPayload, Transaction } from '../types';

export function exportDataAsJSON(data: AppDataPayload, filename = 'radhamadhab_shop_backup.json'): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTransactionsAsCSV(transactions: Transaction[], filename = 'transactions_report.csv'): void {
  const headers = [
    'ID',
    'Date (তারিখ)',
    'Time (সময়)',
    'Type (ধরন)',
    'Category (বিভাগ)',
    'Service / Description (বিবরণ)',
    'Amount (টাকা)',
    'Payment Method (পেমেন্ট পদ্ধতি)',
    'Customer Name (গ্রাহকের নাম)',
    'Customer Mobile (মোবাইল)',
    'Reference (রেফারেন্স)',
    'Recharge Operator',
    'Profit / Commission (লাভ)',
    'Receiver Name',
    'Receiver Account',
    'Service Charge',
    'Note (মন্তব্য)',
  ];

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = transactions.map(t => [
    escapeCSV(t.id),
    escapeCSV(t.date),
    escapeCSV(t.time),
    escapeCSV(t.type),
    escapeCSV(t.category),
    escapeCSV(t.serviceName),
    escapeCSV(t.amount),
    escapeCSV(t.paymentMethod),
    escapeCSV(t.customerName || ''),
    escapeCSV(t.customerMobile || ''),
    escapeCSV(t.referenceNumber || ''),
    escapeCSV(t.rechargeOperator || ''),
    escapeCSV(t.rechargeProfit || ''),
    escapeCSV(t.receiverName || ''),
    escapeCSV(t.receiverAccount || ''),
    escapeCSV(t.serviceCharge || ''),
    escapeCSV(t.note || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function parseBackupFile(file: File): Promise<AppDataPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as AppDataPayload;
        if (!parsed.shopSettings || !Array.isArray(parsed.transactions)) {
          throw new Error('Invalid backup format: missing required shop fields.');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
