/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Trash2, 
  Percent, 
  CircleDollarSign,
  Smartphone, 
  Tag, 
  ChevronRight, 
  Search, 
  Smile, 
  Plus, 
  Minus,
  Sparkle
} from 'lucide-react';
import { Customer, Service, ReceiptItem, Receipt, SalonSettings, User } from '../types';

interface POSViewProps {
  customers: Customer[];
  services: Service[];
  settings: SalonSettings;
  activeReceptionistObj: User;
  onCheckoutComplete: (receipt: Receipt) => void;
  showToaster: (msg: string) => void;
  preselectedCustomer: Customer | null;
  setPreselectedCustomer: (c: Customer | null) => void;
  onNavigate?: (view: string) => void;
}

export default function POSView({
  customers,
  services,
  settings,
  activeReceptionistObj,
  onCheckoutComplete,
  showToaster,
  preselectedCustomer,
  setPreselectedCustomer,
  onNavigate
}: POSViewProps) {
  // POS States
  const [searchServiceQuery, setSearchServiceQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Cart states
  const [cartItems, setCartItems] = useState<ReceiptItem[]>([]);
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [walkInName, setWalkInName] = useState('Walk-In Guest');
  const [walkInPhone, setWalkInPhone] = useState('');

  // Discount & Taxes
  const [discountType, setDiscountType] = useState<'Fixed' | 'Percent'>('Fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'EasyPaisa' | 'JazzCash' | 'Bank Transfer'>('Cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [staffName, setStaffName] = useState<string>('');
  const [cardNo, setCardNo] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [onlineAccountNo, setOnlineAccountNo] = useState<string>('');

  // Category list derived from services
  const categories = useMemo(() => {
    const list = Array.from(new Set(services.map(s => s.category)));
    return ['All', ...list];
  }, [services]);

  // Filter Services for left catalog menu
  const activeCatalog = useMemo(() => {
    return services.filter(s => {
      const liveOnly = s.isActive;
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
      const matchesSearch = s.name.toLowerCase().includes(searchServiceQuery.toLowerCase());
      return liveOnly && matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchServiceQuery]);

  // Handle preselected customer from CRM Shortcut
  useEffect(() => {
    if (preselectedCustomer) {
      setIsWalkIn(false);
      setSelectedCustomerId(preselectedCustomer.id);
      // Consume preselection so returning doesn't lock it
      setPreselectedCustomer(null);
    }
  }, [preselectedCustomer, setPreselectedCustomer]);

  // Cart operations
  const handleAddTreatment = (srv: Service) => {
    const existing = cartItems.find(item => item.id === srv.id);
    if (existing) {
      setCartItems(cartItems.map(item => 
        item.id === srv.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: srv.id,
        name: srv.name,
        price: srv.price,
        quantity: 1
      }]);
    }
    showToaster(`Added: ${srv.name}`);
  };

  const handleUpdateQuantity = (srvId: string, delta: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id === srvId) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveItem = (srvId: string) => {
    setCartItems(cartItems.filter(item => item.id !== srvId));
    showToaster('Treatment removed from active ticket');
  };

  // Calculations
  const calculations = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate custom discount
    let discount = 0;
    if (discountType === 'Fixed') {
      discount = Math.min(discountValue, subtotal);
    } else {
      discount = subtotal * (Math.min(discountValue, 100) / 100);
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = taxableAmount * settings.taxRate;
    const total = taxableAmount + tax;

    return {
      subtotal,
      discount,
      tax,
      total
    };
  }, [cartItems, discountType, discountValue, settings]);

  // Cash change due calculator
  const cashChangeDue = useMemo(() => {
    if (paymentMethod !== 'Cash') return 0;
    const tendered = parseFloat(amountTendered) || 0;
    return Math.max(0, tendered - calculations.total);
  }, [paymentMethod, amountTendered, calculations.total]);

  // Reset Register State
  const handleClearRegister = () => {
    setCartItems([]);
    setIsWalkIn(true);
    setSelectedCustomerId('');
    setWalkInName('Walk-In Guest');
    setWalkInPhone('');
    setDiscountValue(0);
    setAmountTendered('');
    setStaffName('');
    setCardNo('');
    setTransactionRef('');
    setOnlineAccountNo('');
  };

  // Finalize invoice checkout sequence
  const handleTriggerFinalCheckout = () => {
    if (cartItems.length === 0) {
      showToaster('Checkout cancelled: Ticket contains 0 treatments');
      return;
    }

    if (!staffName.trim()) {
      showToaster('Cancellation: Manual staff/stylist name is required to complete log');
      return;
    }

    let customerName = 'Walk-In Guest';
    let customerPhone = walkInPhone || undefined;
    let customerId: string | null = null;

    if (!isWalkIn) {
      const realCust = customers.find(c => c.id === selectedCustomerId);
      if (!realCust) {
        showToaster('Error: Please choose a register loyalty client');
        return;
      }
      customerId = realCust.id;
      customerName = realCust.name;
      customerPhone = realCust.phone;
    } else {
      customerName = walkInName.trim() || 'Walk-In Guest';
    }

    // Cash verification is skipped since no cash tendered input is required anymore.

    // Card/online verification records
    if (paymentMethod === 'Card' && !cardNo.trim()) {
      showToaster('Please enter Card details for record logging');
      return;
    }
    if ((paymentMethod === 'EasyPaisa' || paymentMethod === 'JazzCash' || paymentMethod === 'Bank Transfer') && !transactionRef.trim()) {
      showToaster('Please enter Transaction ID/Reference code for UPI confirmation');
      return;
    }

    // Build unique Receipt object
    const finalInvoice: Receipt = {
      id: `rec-${Math.random().toString(36).substr(2, 9)}`,
      receiptNo: 'TX-TEMP', // App.tsx overrides with correct sequential number
      customerId,
      customerName,
      customerPhone,
      services: [...cartItems],
      subtotal: calculations.subtotal,
      discount: calculations.discount,
      tax: calculations.tax,
      total: calculations.total,
      paymentMethod,
      receptionistId: activeReceptionistObj.id,
      receptionistName: activeReceptionistObj.name,
      date: new Date().toISOString(),
      staffName: staffName.trim(),
      cardNo: paymentMethod === 'Card' ? cardNo.trim() : undefined,
      onlineProvider: (paymentMethod === 'EasyPaisa' || paymentMethod === 'JazzCash' || paymentMethod === 'Bank Transfer') ? paymentMethod : undefined,
      transactionRef: (paymentMethod === 'EasyPaisa' || paymentMethod === 'JazzCash' || paymentMethod === 'Bank Transfer') ? transactionRef.trim() : undefined,
      onlineAccountNo: (paymentMethod === 'EasyPaisa' || paymentMethod === 'JazzCash' || paymentMethod === 'Bank Transfer') ? onlineAccountNo.trim() : undefined
    };

    onCheckoutComplete(finalInvoice);
    handleClearRegister();
  };

  return (
    <div className="space-y-4 w-full">
      {/* Dynamic Closable Header Bar */}
      <div className="bg-white border border-stone-100 rounded-2xl p-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#B48A30] uppercase block">Register Terminal • Station 1</span>
            <h1 className="text-sm font-semibold text-stone-900 font-display">Active Treatment Billing Deck</h1>
          </div>
        </div>
        {onNavigate && (
          <button 
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 hover:bg-stone-100 text-stone-500 hover:text-stone-850 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0"
          >
            Close Terminal (Return to Home)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch animate-in fade-in duration-300">
      
      {/* LEFT: MASTER TREATMENT CATALOG GRID (col-span-1 xl:col-span-7) */}
      <div className="xl:col-span-7 bg-white border border-stone-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[580px]">
        <div>
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-5">
            <div>
              <span className="text-stone-400 text-[10px] font-mono tracking-wider font-semibold uppercase">Register Terminal</span>
              <h2 className="text-base font-display font-semibold text-stone-950 mt-0.5">Quick Menu Grid</h2>
            </div>

            {/* Catalog search input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search quick treatments..."
                value={searchServiceQuery}
                onChange={(e) => setSearchServiceQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-stone-850 placeholder-stone-400 text-xs pl-9 pr-3 py-1.5 rounded-xl transition-all outline-none"
              />
            </div>
          </div>

          {/* Category Filter Pills (horizontal) */}
          <div className="flex gap-1 overflow-x-auto pb-4 border-b border-stone-50 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-50 border border-stone-100 text-stone-500 hover:text-stone-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick-Touch Menu Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 pt-4" id="pos-catalogue-tiles">
            {activeCatalog.length === 0 ? (
              <div className="col-span-full py-20 text-center text-stone-400 text-xs font-mono">
                No active treatments match descriptors
              </div>
            ) : (
              activeCatalog.map((srv) => (
                <button
                  key={srv.id}
                  onClick={() => handleAddTreatment(srv)}
                  className="bg-stone-50 hover:bg-gold-50 border border-stone-100 hover:border-gold-300 rounded-xl p-3.5 text-left transition-all active:scale-97 select-none cursor-pointer flex flex-col justify-between h-28 group"
                >
                  <div className="text-stone-850 font-display font-medium text-xs leading-snug group-hover:text-gold-900 line-clamp-2">
                    {srv.name}
                  </div>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-[10px] text-stone-400 font-mono">{srv.durationMinutes}m</span>
                    <span className="text-xs font-mono font-semibold text-stone-900 group-hover:text-gold-800">
                      {settings.currency}{srv.price.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Tip strip at the bottom */}
        <div className="mt-8 pt-4 border-t border-stone-50 text-[10px] text-stone-400 flex justify-between font-mono">
          <span>CODENAME: AURA_REFLUX_OS_3</span>
          <span>STATION: FRONT_DESK_MAIN</span>
        </div>
      </div>

      {/* RIGHT: THE REGISTER CART & TICKET BILLING PANEL (col-span-1 xl:col-span-5) */}
      <div className="xl:col-span-5 bg-white border border-stone-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[580px]">
        
        {/* Top: Customer Picker Toggle */}
        <div className="space-y-3 pb-4 border-b border-stone-50">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-stone-900 uppercase font-mono tracking-wider">Active Ticket Client</h3>
            
            {/* Walk-In toggle switch */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-stone-400">Walk-In</span>
              <button
                onClick={() => {
                  setIsWalkIn(!isWalkIn);
                  setSelectedCustomerId('');
                }}
                className="text-stone-500 hover:text-stone-800 transition-colors"
                id="walk-in-toggle-btn"
              >
                {isWalkIn ? (
                  <div className="w-9 h-5 rounded-full bg-gold-600 p-0.5 flex justify-end transition-all">
                    <div className="w-4 h-4 bg-white rounded-full shadow-inner" />
                  </div>
                ) : (
                  <div className="w-9 h-5 rounded-full bg-stone-200 p-0.5 flex justify-start transition-all">
                    <div className="w-4 h-4 bg-white rounded-full shadow-inner" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Customer Input Box based on choice */}
          {isWalkIn ? (
            <div className="grid grid-cols-2 gap-3" id="walk-in-input-grid">
              <input
                type="text"
                placeholder="Walk-In Name (e.g. Sam)"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                className="bg-stone-50 border border-stone-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-stone-900"
                id="walk-in-name-field"
              />
              <input
                type="tel"
                placeholder="Guest Phone (Optional)"
                value={walkInPhone}
                onChange={(e) => setWalkInPhone(e.target.value)}
                className="bg-stone-50 border border-stone-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-stone-900"
              />
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-stone-900 text-stone-800"
                id="loyalty-customer-select"
              >
                <option value="">-- Choose Registered Loyalty Client --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - Spend: {settings.currency}{c.totalSpending}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Manually typed Stylist / Staff Name input */}
          <div className="pt-2 border-t border-stone-100">
            <label className="text-[10px] font-bold font-mono text-stone-400 uppercase tracking-widest block mb-1">
              Handled By Stylist / Staff (Manual) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maria, Kashif, etc."
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="w-full bg-[#F9F6F0] border border-stone-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-[#B48A30] text-slate-950 font-medium placeholder-slate-400"
              id="pos-staff-name-field"
            />
          </div>
        </div>

        {/* Middle: Cart Line Items scrollbox */}
        <div className="flex-1 overflow-y-auto max-h-56 divide-y divide-stone-50 pr-1 py-3" id="pos-cart-items-box">
          {cartItems.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs font-mono">
              Ticket is empty. Tap treatments on the left catalog menu to add items.
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between group">
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-semibold text-stone-850 truncate">{item.name}</div>
                  <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                    {settings.currency}{item.price.toFixed(2)} each
                  </div>
                </div>

                {/* Controls (quantity) */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="p-1 px-1.5 hover:bg-stone-150 text-stone-500 cursor-pointer text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-xs font-semibold px-2 text-stone-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="p-1 px-1.5 hover:bg-stone-150 text-stone-500 cursor-pointer text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom adjustments, payments, totals */}
        <div className="border-t border-stone-50 pt-4 space-y-4">
          
          {/* Quick inline adjustment Discount bar */}
          <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 font-mono">
              <Tag className="w-3.5 h-3.5 text-stone-400" /> DISCOUNT TYPE
            </div>
            
            <div className="flex items-center gap-3">
              {/* Toggle percentage or raw dollar discount */}
              <div className="flex border border-stone-200 rounded-lg overflow-hidden shrink-0">
                <button
                  onClick={() => { setDiscountType('Fixed'); setDiscountValue(0); }}
                  className={`px-2 py-1 text-[9px] font-mono font-bold transition-all ${
                    discountType === 'Fixed' ? 'bg-stone-800 text-white' : 'bg-white text-stone-400'
                  }`}
                  type="button"
                >
                  Raw $
                </button>
                <button
                  onClick={() => { setDiscountType('Percent'); setDiscountValue(0); }}
                  className={`px-2 py-1 text-[9px] font-mono font-bold transition-all ${
                    discountType === 'Percent' ? 'bg-stone-800 text-white' : 'bg-white text-stone-400'
                  }`}
                  type="button"
                >
                  % Off
                </button>
              </div>

              {/* Discount Raw input */}
              <input
                type="number"
                min={0}
                placeholder={discountType === 'Fixed' ? '0.00' : '0'}
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-16 bg-white border border-stone-200 text-center font-mono text-xs rounded-lg py-1 outline-none text-stone-800"
              />
            </div>
          </div>

          {/* Itemized Calculation Summary */}
          <div className="space-y-1.5 text-xs text-stone-600 font-sans border-b border-stone-100 pb-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-stone-800 font-mono">{settings.currency}{calculations.subtotal.toFixed(2)}</span>
            </div>
            
            {calculations.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount applied:</span>
                <span className="font-mono">-{settings.currency}{calculations.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Sales Tax ({(settings.taxRate * 100).toFixed(2)}%):</span>
              <span className="font-mono">{settings.currency}{calculations.tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between pt-1.5 border-t border-stone-100 text-stone-900 font-bold text-sm">
              <span>Invoice Net Total:</span>
              <span className="font-mono text-gold-900 font-semibold">{settings.currency}{calculations.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold font-mono text-stone-400 uppercase tracking-widest">Select Tender Method</h4>
            <div className="grid grid-cols-4 gap-1.5" id="pos-payment-tabs">
              {(['Cash', 'Card', 'EasyPaisa', 'JazzCash', 'Bank Transfer'] as const).map(m => {
                const isActive = paymentMethod === m;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      setPaymentMethod(m);
                      setAmountTendered('');
                    }}
                    className={`py-2 rounded-xl text-[10px] font-semibold text-center transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-stone-900 border border-stone-900 text-white shadow-md' 
                        : 'border border-stone-200 text-stone-500 hover:text-stone-850 hover:bg-stone-50'
                    }`}
                    type="button"
                    id={`payment-tab-${m.toLowerCase().replace(' ', '-')}`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Payment notice for rapid flow */}
          {paymentMethod === 'Cash' && (
            <div className="bg-[#EEF3F0] border border-[#DCE5E0] p-4 rounded-xl text-center" id="cash-instant-notice">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#3A4F46] block font-bold">
                ✓ Cash Clearance Secured
              </span>
              <p className="text-[10px] text-[#556D62] mt-1">
                No extra information required for cash tender. Finalize the invoice to output receipt.
              </p>
            </div>
          )}

          {/* Card Entry Details (Shop Keeper Records) */}
          {paymentMethod === 'Card' && (
            <div className="bg-amber-500/5 border border-amber-600/15 p-3 rounded-xl space-y-2" id="card-payment-fields">
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold tracking-wider uppercase text-amber-800 block">Card Number (digits) *</label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  placeholder="e.g. 4580 1234 5678 9012"
                  value={cardNo}
                  onChange={(e) => setCardNo(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                  className="w-full bg-white border border-stone-200 text-xs font-mono rounded-lg px-2.5 py-2 outline-none text-stone-800"
                  id="card-number-input"
                />
              </div>
            </div>
          )}

          {/* UPI/Online EasyPaisa and Bank Transfer reference values */}
          {(paymentMethod === 'EasyPaisa' || paymentMethod === 'JazzCash' || paymentMethod === 'Bank Transfer') && (
            <div className="bg-sky-500/5 border border-sky-600/15 p-3 rounded-xl space-y-2.5" id="online-payment-fields">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider uppercase text-sky-850 block">Transaction ID/Reference *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EP-982103"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full bg-white border border-stone-200 text-xs font-mono rounded-lg px-2.5 py-1.5 outline-none text-stone-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold tracking-wider uppercase text-sky-850 block">Sender Account/Ph (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 03001234567"
                    value={onlineAccountNo}
                    onChange={(e) => setOnlineAccountNo(e.target.value)}
                    className="w-full bg-white border border-stone-200 text-xs font-mono rounded-lg px-2.5 py-1.5 outline-none text-stone-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CTA Checkout button */}
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={handleClearRegister}
              className="px-3.5 py-3 border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-xl text-xs transition-all cursor-pointer"
              title="Empty active ticket"
              type="button"
            >
              Reset
            </button>
            
            <button
              onClick={handleTriggerFinalCheckout}
              disabled={cartItems.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer ${
                cartItems.length === 0
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none border border-stone-200'
                  : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-stone-900 shadow-gold-500/10 active:scale-98'
              }`}
              type="button"
              id="finalize-checkout-btn"
            >
              <CircleDollarSign className="w-4 h-4" />
              Finalize Bill ({settings.currency}{calculations.total.toFixed(2)})
            </button>
          </div>

        </div>

      </div>

    </div>
    </div>
  );
}
