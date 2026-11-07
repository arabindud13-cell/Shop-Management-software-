import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Wallet, Building2, CreditCard } from 'lucide-react';
import { Transaction, PaymentMethod } from '../../types';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../context/LanguageContext';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { updateTransaction, deleteTransaction, categories } = useShop();
  const { t, language } = useLanguage();

  const [amount, setAmount] = useState<number | ''>('');
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [rechargeProfit, setRechargeProfit] = useState<number | ''>('');
  const [serviceCharge, setServiceCharge] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount);
      setServiceName(transaction.serviceName);
      setCategory(transaction.category);
      setPaymentMethod(transaction.paymentMethod);
      setCustomerName(transaction.customerName || '');
      setCustomerMobile(transaction.customerMobile || '');
      setReferenceNumber(transaction.referenceNumber || '');
      setNote(transaction.note || '');
      setDate(transaction.date);
      setTime(transaction.time);
      setRechargeProfit(transaction.rechargeProfit ?? '');
      setServiceCharge(transaction.serviceCharge ?? '');
      setErrorMsg('');
      setConfirmDelete(false);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg(language === 'en' ? 'Please enter a valid amount' : 'টাকার অঙ্ক সঠিক নয়');
      return;
    }

    updateTransaction(transaction.id, {
      amount: numericAmount,
      serviceName: serviceName.trim(),
      category,
      paymentMethod,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      referenceNumber: referenceNumber.trim(),
      note: note.trim(),
      date,
      time,
      rechargeProfit: rechargeProfit !== '' ? Number(rechargeProfit) : undefined,
      serviceCharge: serviceCharge !== '' ? Number(serviceCharge) : undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100">
        <div className="px-5 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{language === 'en' ? 'Edit Transaction' : 'লেনদেন সম্পাদনা (Edit Transaction)'}</h2>
            <p className="text-xs text-slate-400 font-mono">ID: {transaction.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Amount */}
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              {t.amountLabel}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 font-bold text-lg text-slate-400">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xl font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Service Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {t.serviceDescription}
            </label>
            <input
              type="text"
              required
              value={serviceName}
              onChange={e => setServiceName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {t.filterCategory}
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {language === 'en' ? `${c.name} (${c.nameBn})` : `${c.nameBn} (${c.name})`}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {t.paymentMethod}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: t.cash, icon: Wallet },
                { id: 'bank', label: t.bank, icon: Building2 },
                { id: 'upi', label: t.upi, icon: CreditCard },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPaymentMethod(item.id as PaymentMethod)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    paymentMethod === item.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.date}</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.time}</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.customerName}</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.customerMobile}</label>
              <input
                type="tel"
                value={customerMobile}
                onChange={e => setCustomerMobile(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Recharge or Money Transfer specifics */}
          {transaction.type === 'recharge' && (
            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1">
                {t.profitCommission}
              </label>
              <input
                type="number"
                min="0"
                value={rechargeProfit}
                onChange={e => setRechargeProfit(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {transaction.type === 'money_transfer' && (
            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1">
                {t.serviceCharge}
              </label>
              <input
                type="number"
                min="0"
                value={serviceCharge}
                onChange={e => setServiceCharge(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Ref & Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.refNumber}</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t.note}</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Yes, Delete' : 'হ্যাঁ, নিশ্চিত মুছুন'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-800/40 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t.actionDelete}
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {language === 'en' ? 'Save Changes' : 'পরিবর্তন সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
