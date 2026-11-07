import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  CheckCircle,
  Copy,
  Receipt,
  History,
  FileText,
  Share2,
  Check,
} from 'lucide-react';
import { Transaction, GeneratedReceipt } from '../../types';
import { useShop } from '../../context/ShopContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency } from '../../lib/accounting';

interface ViewReceiptModalProps {
  transaction?: Transaction | null;
  receipt?: GeneratedReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewReceiptModal: React.FC<ViewReceiptModalProps> = ({
  transaction,
  receipt: directReceipt,
  isOpen,
  onClose,
}) => {
  const {
    shopSettings,
    categories,
    saveReceipt,
    createReceiptFromTransaction,
    openReceiptHistoryModal,
  } = useShop();
  const { t, language } = useLanguage();

  const [receiptType, setReceiptType] = useState<'standard' | 'thermal'>('standard');
  const [copied, setCopied] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<GeneratedReceipt | null>(null);

  // Sync active receipt from props
  useEffect(() => {
    if (!isOpen) {
      setActiveReceipt(null);
      return;
    }

    if (directReceipt) {
      setActiveReceipt(directReceipt);
    } else if (transaction) {
      const converted = createReceiptFromTransaction(transaction);
      setActiveReceipt(converted);
      saveReceipt(converted);
    }
  }, [isOpen, directReceipt?.id, directReceipt?.receiptNumber, transaction?.id]);

  if (!isOpen || !activeReceipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTextReceipt = () => {
    const text = `================================
${shopSettings.shopName}
${shopSettings.shopNameBn ? shopSettings.shopNameBn + '\n' : ''}${shopSettings.address}
Phone: ${shopSettings.phone}
${shopSettings.gstinOrReg ? 'Reg: ' + shopSettings.gstinOrReg + '\n' : ''}================================
Receipt No: ${activeReceipt.receiptNumber}
Date: ${activeReceipt.date}  Time: ${activeReceipt.time}
Customer: ${activeReceipt.customerName}${activeReceipt.customerMobile ? ' (' + activeReceipt.customerMobile + ')' : ''}
Payment: ${activeReceipt.paymentMethod.toUpperCase()} (PAID)
--------------------------------
ITEMS:
${activeReceipt.items
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.name} x ${item.qty} = ₹${item.amount}`
  )
  .join('\n')}
--------------------------------
Subtotal: ₹${activeReceipt.subtotal}
${activeReceipt.serviceCharge > 0 ? `Service Charge: ₹${activeReceipt.serviceCharge}\n` : ''}${activeReceipt.discount ? `Discount: ₹${activeReceipt.discount}\n` : ''}TOTAL AMOUNT PAID: ₹${activeReceipt.totalAmount}
================================
${shopSettings.receiptFooterMessage || 'Thank you! Please visit again.'}
Radhamadhab Online Center
================================`;

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`w-full bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-auto print:m-0 print:w-full print:max-w-none print:shadow-none print:rounded-none transition-all ${
          receiptType === 'thermal' ? 'max-w-sm' : 'max-w-md'
        }`}
      >
        {/* Modal Top Bar (Hidden on print) */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs sm:text-sm">{t.receiptTitle}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
              SAVED
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Format toggle: Standard vs Thermal */}
            <div className="bg-slate-800 p-0.5 rounded-lg flex items-center text-[11px] font-medium border border-slate-700 mr-1">
              <button
                type="button"
                onClick={() => setReceiptType('standard')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  receiptType === 'standard'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Standard A4 Voucher"
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setReceiptType('thermal')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  receiptType === 'thermal'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="80mm Thermal POS Slip"
              >
                Thermal
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div
          className={`p-5 sm:p-6 bg-white font-sans text-xs space-y-4 print:p-2 ${
            receiptType === 'thermal' ? 'thermal-receipt-print font-mono text-[11px] space-y-2.5' : ''
          }`}
          id="printable-receipt"
        >
          {/* Shop Header */}
          <div className="text-center border-b pb-3 border-dashed border-slate-300">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {shopSettings.shopName}
            </h1>
            {shopSettings.shopNameBn && (
              <p className="text-xs text-slate-700 font-semibold">{shopSettings.shopNameBn}</p>
            )}
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{shopSettings.address}</p>
            <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
              {language === 'en' ? 'Phone / WhatsApp:' : 'ফোন / হোয়াটসঅ্যাপ:'} {shopSettings.phone}
            </p>
            {shopSettings.gstinOrReg && (
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                {language === 'en' ? 'Reg / GSTIN:' : 'লাইসেন্স / রেজি:'} {shopSettings.gstinOrReg}
              </p>
            )}
          </div>

          {/* Receipt Details Meta */}
          <div className="flex justify-between items-center text-[10px] text-slate-600 border-b pb-2 border-slate-200">
            <div>
              <div>
                {t.date}: <span className="font-semibold text-slate-800">{activeReceipt.date}</span>
              </div>
              <div>
                {t.time}: <span className="font-semibold text-slate-800">{activeReceipt.time}</span>
              </div>
            </div>
            <div className="text-right">
              <div>
                {t.receiptNumber}{' '}
                <span className="font-mono font-bold text-slate-800">
                  {activeReceipt.receiptNumber}
                </span>
              </div>
              <div className="uppercase">
                {t.paymentMethod}:{' '}
                <span className="font-semibold text-slate-800">{activeReceipt.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {(activeReceipt.customerName || activeReceipt.customerMobile) && (
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {language === 'en' ? 'Billed To (Customer):' : 'গ্রাহকের নাম:'}
                </div>
                <div className="text-slate-800 font-bold">{activeReceipt.customerName}</div>
              </div>
              {activeReceipt.customerMobile && (
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">{language === 'en' ? 'Mobile:' : 'মোবাইল:'}</div>
                  <div className="text-slate-700 font-mono font-semibold">{activeReceipt.customerMobile}</div>
                </div>
              )}
            </div>
          )}

          {/* Service & Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-[10px] flex justify-between border-b border-slate-200">
              <span>{t.serviceItem}</span>
              <span>{t.price}</span>
            </div>
            <div className="divide-y divide-slate-100 p-2 sm:p-2.5 space-y-1">
              {activeReceipt.items && activeReceipt.items.length > 0 ? (
                activeReceipt.items.map((item, idx) => (
                  <div key={item.id || idx} className="flex justify-between items-start pt-1 first:pt-0">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-800 text-xs">{item.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.qty > 1 && `Qty: ${item.qty} × ₹${item.rate}`}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-xs text-slate-900 shrink-0">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Shop Digital Service</span>
                  <span className="font-mono font-bold">{formatCurrency(activeReceipt.totalAmount)}</span>
                </div>
              )}

              {activeReceipt.serviceCharge > 0 && (
                <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1">
                  <span>{t.serviceCharge}</span>
                  <span className="font-mono">{formatCurrency(activeReceipt.serviceCharge)}</span>
                </div>
              )}

              {activeReceipt.discount && activeReceipt.discount > 0 && (
                <div className="flex justify-between items-center text-[11px] text-emerald-600 pt-1">
                  <span>{language === 'en' ? 'Discount' : 'ছাড়'}</span>
                  <span className="font-mono">- {formatCurrency(activeReceipt.discount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-slate-900 text-white p-3 rounded-lg flex justify-between items-center print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
            <span className="font-bold text-xs uppercase tracking-wider">{t.paidAmount}</span>
            <span className="font-mono font-bold text-base sm:text-lg text-amber-300 print:text-slate-900">
              {formatCurrency(activeReceipt.totalAmount)}
            </span>
          </div>

          {/* Note if any */}
          {activeReceipt.note && (
            <div className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
              {t.note}: {activeReceipt.note}
            </div>
          )}

          {/* Signatory Stamp Box */}
          <div className="flex justify-between items-end pt-3 text-[10px] text-slate-500 border-t border-dashed border-slate-200">
            <div>
              <div className="font-mono text-[9px] text-emerald-700 font-bold border border-emerald-400/50 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                ✓ PAYMENT VERIFIED
              </div>
            </div>
            <div className="text-right">
              <div className="w-24 border-b border-slate-400 mb-1 ml-auto" />
              <div className="font-bold text-[9px] text-slate-700">Authorized Signatory</div>
              <div className="text-[8px] text-slate-400">{shopSettings.shopName}</div>
            </div>
          </div>

          {/* Footer message */}
          <div className="text-center pt-2 text-[10px] text-slate-500 border-t border-dashed border-slate-300">
            <p className="font-medium">
              {activeReceipt.footerMessage ||
                shopSettings.receiptFooterMessage ||
                (language === 'en'
                  ? `Thank you for visiting ${shopSettings.shopName}! Please visit again.`
                  : `${shopSettings.shopName}-এ আসার জন্য ধন্যবাদ! আবার আসবেন।`)}
            </p>
            <p className="text-[9px] text-slate-400 mt-1 font-mono">
              System Generated Receipt • {shopSettings.shopName}
            </p>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden on print) */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyTextReceipt}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              title="Copy receipt text for WhatsApp/SMS"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy / Share'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                openReceiptHistoryModal();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              title="View all past saved receipts"
            >
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Receipt History</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {t.close}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printReceipt}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
