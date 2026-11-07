import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Receipt, CheckCircle, Calculator, User, Phone, Sparkles } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../context/LanguageContext';
import { PaymentMethod, ReceiptItem, GeneratedReceipt, Transaction } from '../../types';
import { getTodayDateString, getCurrentTimeString } from '../../data/defaults';
import { formatCurrency } from '../../lib/accounting';

interface GenerateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillTxn?: Transaction | null;
}

export const GenerateReceiptModal: React.FC<GenerateReceiptModalProps> = ({
  isOpen,
  onClose,
  prefillTxn,
}) => {
  const { categories, shopSettings, saveReceipt, addTransaction, openReceiptModal } = useShop();
  const { t, language } = useLanguage();

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [serviceCharge, setServiceCharge] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [recordAsTransaction, setRecordAsTransaction] = useState(true);

  // Items list
  const [items, setItems] = useState<ReceiptItem[]>([
    {
      id: 'item-1',
      name: 'Xerox Photocopy (A4)',
      category: 'cat-xerox',
      qty: 1,
      rate: 10,
      amount: 10,
    },
  ]);

  // Reset or prefill on open
  useEffect(() => {
    if (isOpen) {
      if (prefillTxn) {
        setCustomerName(prefillTxn.customerName || '');
        setCustomerMobile(prefillTxn.customerMobile || '');
        setPaymentMethod(prefillTxn.paymentMethod || 'cash');
        setServiceCharge(prefillTxn.serviceCharge || '');
        setDiscount('');
        setNote(prefillTxn.note || '');
        setRecordAsTransaction(false); // already recorded
        setItems([
          {
            id: 'item-' + Date.now(),
            name: prefillTxn.serviceName,
            category: prefillTxn.category,
            qty: 1,
            rate: prefillTxn.amount,
            amount: prefillTxn.amount,
          },
        ]);
      } else {
        setCustomerName('');
        setCustomerMobile('');
        setPaymentMethod('cash');
        setServiceCharge('');
        setDiscount('');
        setNote('');
        setRecordAsTransaction(true);
        setItems([
          {
            id: 'item-' + Date.now(),
            name: 'Xerox Photocopy (A4)',
            category: 'cat-xerox',
            qty: 1,
            rate: 5,
            amount: 5,
          },
        ]);
      }
    }
  }, [isOpen, prefillTxn]);

  if (!isOpen) return null;

  // Item helpers
  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'qty' || field === 'rate') {
      const q = field === 'qty' ? Math.max(1, Number(value) || 1) : item.qty;
      const r = field === 'rate' ? Math.max(0, Number(value) || 0) : item.rate;
      item.qty = q;
      item.rate = r;
      item.amount = q * r;
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: 'Printout / Service',
        category: 'cat-print',
        qty: 1,
        rate: 10,
        amount: 10,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const numericCharge = Number(serviceCharge) || 0;
  const numericDiscount = Number(discount) || 0;
  const totalAmount = Math.max(0, subtotal + numericCharge - numericDiscount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || totalAmount <= 0) return;

    const today = getTodayDateString();
    const time = getCurrentTimeString();
    const receiptSeq = Math.floor(100 + Math.random() * 900);
    const receiptNumber = `REC-${today.replace(/-/g, '')}-${receiptSeq}`;

    let linkedTxnId = prefillTxn?.id;

    // Optionally record as a new shop transaction if requested and not prefilled
    if (recordAsTransaction && !prefillTxn) {
      const primaryCategory = items[0]?.category || 'cat-other';
      const itemsSummary = items.map(i => `${i.name} (x${i.qty})`).join(', ');

      linkedTxnId = addTransaction({
        date: today,
        time,
        type: 'service_income',
        category: primaryCategory,
        serviceName: itemsSummary.length > 50 ? itemsSummary.slice(0, 47) + '...' : itemsSummary,
        amount: totalAmount,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        customerMobile: customerMobile.trim() || undefined,
        referenceNumber: receiptNumber,
        serviceCharge: numericCharge > 0 ? numericCharge : undefined,
        note: note.trim() || 'Receipt issued',
      });
    }

    const generated: GeneratedReceipt = {
      id: 'rec-' + Date.now(),
      receiptNumber,
      transactionId: linkedTxnId,
      date: today,
      time,
      customerName: customerName.trim() || (language === 'en' ? 'Walking Customer' : 'সাধারণ গ্রাহক'),
      customerMobile: customerMobile.trim(),
      items,
      subtotal,
      serviceCharge: numericCharge,
      discount: numericDiscount > 0 ? numericDiscount : undefined,
      totalAmount,
      paymentMethod,
      paymentStatus: 'paid',
      note: note.trim() || undefined,
      shopName: shopSettings.shopName,
      shopPhone: shopSettings.phone,
      shopAddress: shopSettings.address,
      gstinOrReg: shopSettings.gstinOrReg,
      footerMessage: shopSettings.receiptFooterMessage,
      createdAt: new Date().toISOString(),
    };

    // Save to history & open viewer modal
    saveReceipt(generated);
    onClose();
    openReceiptModal(generated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl max-w-2xl w-full space-y-4 my-auto animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {language === 'en' ? 'Generate Customer Receipt' : 'নতুন গ্রাহক রসিদ তৈরি'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'en' ? 'Create, print, and save to receipt history' : 'রসিদ তৈরি করুন, প্রিন্ট করুন এবং ইতিহাসে সংরক্ষণ হবে'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                {t.customerName}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder={language === 'en' ? 'Customer name (optional)' : 'গ্রাহকের নাম (ঐচ্ছিক)'}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                {t.customerMobile}
              </label>
              <input
                type="tel"
                value={customerMobile}
                onChange={e => setCustomerMobile(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Service Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                {language === 'en' ? 'Service Items & Charges:' : 'সার্ভিস বা কাজের বিবরণ ও দর:'}
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Add Item' : '+ আইটেম যোগ করুন'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs"
                >
                  <div className="flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleItemChange(idx, 'name', e.target.value)}
                      placeholder="Service name (e.g. Xerox, Passport Photo)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium"
                      required
                    />
                  </div>

                  <div className="w-28 shrink-0">
                    <select
                      value={item.category || 'cat-other'}
                      onChange={e => handleItemChange(idx, 'category', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-300"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {language === 'en' ? c.name : c.nameBn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-16 shrink-0">
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                      title="Qty"
                      placeholder="Qty"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center"
                    />
                  </div>

                  <div className="w-20 shrink-0">
                    <input
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                      placeholder="Rate ₹"
                      title="Rate ₹"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-right"
                    />
                  </div>

                  <div className="w-20 shrink-0 font-mono font-bold text-amber-300 text-right pr-1">
                    {formatCurrency(item.amount)}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Adjustments & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.serviceCharge} (₹)
              </label>
              <input
                type="number"
                min="0"
                value={serviceCharge}
                onChange={e => setServiceCharge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {language === 'en' ? 'Discount (₹)' : 'ছাড় / Discount (₹)'}
              </label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={e => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.paymentMethod}
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="cash">{t.cash}</option>
                <option value="bank">{t.bank}</option>
                <option value="upi">{t.upi}</option>
              </select>
            </div>
          </div>

          {/* Note & Accounts Sync */}
          <div className="space-y-2">
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={language === 'en' ? 'Optional note or receipt remarks...' : 'রসিদের মন্তব্য বা নোট (ঐচ্ছিক)...'}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />

            {!prefillTxn && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={recordAsTransaction}
                  onChange={e => setRecordAsTransaction(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                />
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {language === 'en'
                    ? 'Also record in shop daily income transactions & balance'
                    : 'দোকানের দৈনিক লেনদেন ও ক্যাশ/ব্যাংক ব্যালেন্সেও যোগ করুন'}
                </span>
              </label>
            )}
          </div>

          {/* Total Bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">{t.paidAmount}</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {items.length} {language === 'en' ? 'item(s)' : 'টি আইটেম'}
              </span>
            </div>
            <div className="font-mono text-2xl font-bold text-amber-300">
              {formatCurrency(totalAmount)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'বাতিল'}
            </button>
            <button
              type="submit"
              disabled={totalAmount <= 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{language === 'en' ? '+ Create & View Receipt' : '+ রসিদ তৈরি ও প্রিন্ট'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
