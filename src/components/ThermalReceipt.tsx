/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useEffect } from 'react';
import { Printer, X, Download, Copy, Check } from 'lucide-react';
import { Receipt, SalonSettings } from '../types';
import { PRIMARY_LOGO_SVG, SECONDARY_LOGO_SVG } from './BrandLogos';

interface ThermalReceiptProps {
  receipt: Receipt;
  settings: SalonSettings;
  onClose: () => void;
  showToaster: (msg: string) => void;
}

export default function ThermalReceipt({ receipt, settings, onClose, showToaster }: ThermalReceiptProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.focus();
    setTimeout(() => {
      window.print();
    }, 50);
  };

  const handleCopyReceiptText = () => {
    const lines = [
      `================================`,
      `       ${settings.salonName.toUpperCase()}`,
      `================================`,
      `Address: ${settings.address}`,
      `Phone: ${settings.phone}`,
      `Email: ${settings.email}`,
      `================================`,
      `Receipt: ${receipt.receiptNo}`,
      `Date   : ${new Date(receipt.date).toLocaleString()}`,
      receipt.staffName ? `Staff  : ${receipt.staffName}` : '',
      `Client : ${receipt.customerName}`,
      `--------------------------------`,
    ].filter(Boolean);

    receipt.services.forEach(item => {
      const lineTotal = (item.price * item.quantity).toFixed(2);
      const namePart = item.name.substring(0, 18);
      const sQty = `${item.quantity}x ${settings.currency}${item.price.toFixed(0)}`;
      const spacesLength = 32 - namePart.length - lineTotal.length;
      const spaces = spacesLength > 0 ? ' '.repeat(spacesLength) : ' ';
      lines.push(`${namePart}${spaces}${settings.currency}${lineTotal}`);
      if (item.quantity > 1) {
        lines.push(`  (${sQty})`);
      }
    });

    lines.push(`--------------------------------`);
    lines.push(`Subtotal:       ${settings.currency}${receipt.subtotal.toFixed(2)}`);
    if (receipt.discount > 0) {
      lines.push(`Discount:      -${settings.currency}${receipt.discount.toFixed(2)}`);
    }
    lines.push(`Tax:            ${settings.currency}${receipt.tax.toFixed(2)}`);
    lines.push(`TOTAL:          ${settings.currency}${receipt.total.toFixed(2)}`);
    lines.push(`================================`);
    lines.push(`Payment Method: ${receipt.paymentMethod.toUpperCase()}`);
    if (receipt.cardNo) {
      lines.push(`Card Number:    **** **** **** ${receipt.cardNo.slice(-4)}`);
    }
    if (receipt.onlineProvider) {
      lines.push(`Provider:       ${receipt.onlineProvider}`);
    }
    if (receipt.transactionRef) {
      lines.push(`Trans Ref:      ${receipt.transactionRef}`);
    }
    if (receipt.onlineAccountNo) {
      lines.push(`Account No:     ${receipt.onlineAccountNo}`);
    }
    lines.push(`================================`);
    lines.push(`      THANK YOU FOR YOUR VISIT  `);
    lines.push(`             Bel Amours         `);
    lines.push(`================================`);

    navigator.clipboard.writeText(lines.join('\n'));
    showToaster('Receipt text copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto" id="thermal-receipt-overlay">
      <div 
        className="bg-stone-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in fade-in duration-200"
        id="thermal-receipt-modal"
      >
        {/* Left Interactive panel: Controls */}
        <div className="p-6 md:w-1/2 flex flex-col justify-between text-stone-200 border-b md:border-b-0 md:border-r border-white/10 print:hidden" id="thermal-receipt-controls">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-stone-400 text-xs font-mono uppercase tracking-wider">Transaction Status</span>
                <h3 className="text-xl font-display font-semibold text-white mt-1">Payment Finalized</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1 px-2 hover:bg-white/10 rounded-md text-stone-400 hover:text-white transition-all text-xs flex items-center gap-1 font-mono"
                id="close-receipt-btn"
              >
                <X className="w-4 h-4" /> Esc
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-stone-800/50 p-4 rounded-xl space-y-2 text-sm font-sans border border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Invoice Ref:</span>
                  <span className="font-mono text-white">{receipt.receiptNo}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Timestamp:</span>
                  <span className="text-white">{new Date(receipt.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Client:</span>
                  <span className="text-white font-medium">{receipt.customerName}</span>
                </div>
                {receipt.staffName && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Stylist/Staff:</span>
                    <span className="text-amber-200 font-medium">{receipt.staffName}</span>
                  </div>
                )}
                {receipt.cardNo && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Card Number:</span>
                    <span className="font-mono text-stone-200">**** {receipt.cardNo.slice(-4)}</span>
                  </div>
                )}
                {receipt.transactionRef && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-400">Transaction ID:</span>
                    <span className="font-mono text-stone-200">{receipt.transactionRef}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs pt-2 border-t border-white/5">
                  <span className="text-stone-400">Net Charged:</span>
                  <span className="text-gold-200 font-mono font-medium">{settings.currency}{receipt.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-xs text-stone-400 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                💡 <span className="text-amber-200 font-medium">Receptionist Tip:</span> This receipt represents a real-world 80mm standard layout. Click <strong>Print Receipt</strong> to output cleanly to any thermal or laser printer.
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#C5A059] text-[#132A21] font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[#D4AF37]/10 cursor-pointer active:scale-98 transition-all"
              id="print-action-btn"
            >
              <Printer className="w-5 h-5" />
              Print Receipt (80mm)
            </button>
            
            <button
              onClick={handleCopyReceiptText}
              className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer font-sans"
              id="copy-text-btn"
            >
              <Copy className="w-4 h-4" />
              Copy Digital text copy
            </button>

            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md cursor-pointer active:scale-98 transition-all text-sm uppercase tracking-wider"
              id="done-and-close-receipt-btn"
            >
              ✓ Done & Close Receipt
            </button>

            <p className="text-[10px] text-center text-[#889D93] font-mono mt-1 font-semibold uppercase">
              Click Green button to return to terminal POS screen
            </p>
          </div>
        </div>

        {/* Right Preview Panel: The actual 80mm Thermal Slip mockup */}
        <div className="bg-stone-50 border-t md:border-t-0 p-4 sm:p-8 md:w-1/2 flex items-center justify-center relative select-none overflow-x-auto w-full print:p-0 print:bg-white print:border-none print:w-full print:block print:static font-mono">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-stone-400 font-mono tracking-widest uppercase print:hidden">
            Paper Preview (80mm Width)
          </div>

          {/* Thermal Receipt Print Area */}
          <div 
            ref={printAreaRef}
            id="thermal-receipt-print-area"
            className="w-[80mm] min-h-[140mm] bg-white text-stone-900 px-[4mm] py-[6mm] shadow-lg rounded-sm text-xs font-mono border-t-[3px] border-amber-600 relative shrink-0 leading-[1.35]"
          >
            {/* Soft jagged teeth top mockup in UI but hidden in real print */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(135deg,#f5f5f5_25%,transparent_25%),linear-gradient(225deg,#f5f5f5_25%,transparent_25%)] bg-[size:4px_4px] md:block print:hidden" />

            {/* Receipt Header */}
            <div className="text-center mb-4 pt-2">
              <div className="flex justify-center mb-2">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} className="max-h-16 max-w-36 object-contain" alt="Salon Logo" />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: PRIMARY_LOGO_SVG }} />
                )}
              </div>
              <div className="text-sm font-bold tracking-tight uppercase">{settings.salonName}</div>
              <div className="text-[10px] text-stone-600 mt-1 whitespace-pre-wrap">{settings.address}</div>
              <div className="text-[10px] text-stone-600">TEL: {settings.phone}</div>
              <div className="text-[10px] text-stone-500 mt-0.5">{settings.email}</div>
            </div>

            <div className="border-t border-dashed border-stone-400 my-2" />

            {/* Receipt Info */}
            <div className="space-y-0.5 text-[10px]">
              <div>RECEIPT : {receipt.receiptNo}</div>
              <div>DATE    : {new Date(receipt.date).toLocaleString()}</div>
              <div>CLIENT  : {receipt.customerName.toUpperCase()}</div>
              {receipt.customerPhone && (
                <div>PHONE   : {receipt.customerPhone}</div>
              )}
              {receipt.staffName && (
                <div>STAFF   : {receipt.staffName.toUpperCase()}</div>
              )}
            </div>

            <div className="border-t border-dashed border-stone-400 my-2" />

            {/* Items headers */}
            <div className="grid grid-cols-12 font-bold mb-1 text-[10px]">
              <div className="col-span-7">DESCRIPTION</div>
              <div className="col-span-2 text-center">QTY</div>
              <div className="col-span-3 text-right">TOTAL</div>
            </div>

            <div className="border-t border-stone-300 mb-1.5" />

            {/* Services List */}
            <div className="space-y-1 text-[10px]">
              {receipt.services.map((item) => (
                <div key={item.id} className="space-y-0.5">
                  <div className="grid grid-cols-12 text-stone-950 font-medium">
                    <div className="col-span-7 truncate">{item.name}</div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-3 text-right">
                      {settings.currency}{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  {item.quantity > 1 && (
                    <div className="text-[9px] text-stone-500 pl-2">
                      ({item.quantity} x {settings.currency}{item.price.toFixed(2)})
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-stone-450 my-3" />

            {/* Totals Block */}
            <div className="space-y-1 text-[10px] pl-16">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span className="font-medium">{settings.currency}{receipt.subtotal.toFixed(2)}</span>
              </div>
              
              {receipt.discount > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>DISCOUNT:</span>
                  <span>-{settings.currency}{receipt.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>SALES TAX:</span>
                <span>{settings.currency}{receipt.tax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between pt-1 border-t border-stone-300 text-stone-950 font-bold text-xs">
                <span>TOTAL:</span>
                <span>{settings.currency}{receipt.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-stone-450 my-3" />

            {/* Payment Details */}
            <div className="text-center space-y-1 text-[10px]">
              <div className="font-bold uppercase">PAYMENT METHOD: {receipt.paymentMethod}</div>
              {receipt.cardNo && (
                <div className="text-stone-700 font-mono">CARD: **** **** **** {receipt.cardNo.slice(-4)}</div>
              )}
              {receipt.onlineProvider && (
                <div className="text-stone-700">PROVIDER: {receipt.onlineProvider.toUpperCase()}</div>
              )}
              {receipt.transactionRef && (
                <div className="text-stone-700 font-mono">TXN REF: {receipt.transactionRef}</div>
              )}
              {receipt.onlineAccountNo && (
                <div className="text-stone-700">SENDER ACCOUNT: {receipt.onlineAccountNo}</div>
              )}
              <div className="text-stone-500">AUTH ID: TX-{Math.floor(Math.random() * 90000) + 10000}-A</div>
            </div>

            <div className="border-t border-stone-300 my-2" />

            {/* Footer */}
            <div className="text-center text-[10px] text-stone-600 mt-2 space-y-1">
              <div className="flex justify-center mb-1.5" dangerouslySetInnerHTML={{ __html: SECONDARY_LOGO_SVG }} />
              <div className="font-medium text-stone-900">THANK YOU FOR YOUR PATRONAGE</div>
              <div className="text-[9.5px] italic font-serif mt-1">{settings.receiptFooter || 'YOUR BEAUTY & HEALTH ARE OUR PASSION'}</div>
              <div className="border border-dashed border-stone-300 py-1.5 px-3 rounded-lg mt-2 inline-block font-mono text-[9.5px] font-bold text-stone-800 bg-stone-50">
                COMPLAIN NO: {settings.complaintNumber || '0347 8361531'}
              </div>
              
              {/* Social / Website Links */}
              <div className="flex flex-col items-center gap-0.5 mt-2.5 text-[8.5px] text-stone-500 font-mono">
                {settings.websiteUrl && <span>Website: {settings.websiteUrl}</span>}
                {settings.facebookLink && <span>Facebook: {settings.facebookLink}</span>}
                {settings.instagramLink && <span>Instagram: {settings.instagramLink}</span>}
                {settings.whatsappNumber && <span>WhatsApp: {settings.whatsappNumber}</span>}
              </div>
              <div className="text-[8px] mt-2 text-stone-400">Powered by Salon & Spa POS Pro</div>
            </div>
            
            {/* Jagged bottom mockup */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[linear-gradient(315deg,#f5f5f5_25%,transparent_25%),linear-gradient(45deg,#f5f5f5_25%,transparent_25%)] bg-[size:4px_4px] md:block print:hidden" />
          </div>
        </div>
      </div>
    </div>
  );
}
