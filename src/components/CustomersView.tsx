/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Notebook, 
  Trash2, 
  Smile, 
  History, 
  Award, 
  Calendar,
  Sparkle,
  X,
  CreditCard,
  Edit2
} from 'lucide-react';
import { Customer, Receipt, SalonSettings, Service, User } from '../types';

interface CustomersViewProps {
  customers: Customer[];
  receipts: Receipt[];
  settings: SalonSettings;
  activeCustomer: Customer | null;
  setActiveCustomer: (customer: Customer | null) => void;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'totalSpending' | 'visitCount' | 'createdAt'>, customId?: string) => Customer;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  globalSearchQuery: string;
  onNavigate: (view: string) => void;
  services: Service[];
  activeReceptionistObj: User | null;
  onCheckoutComplete: (receipt: Receipt) => void;
}

export default function CustomersView({
  customers,
  receipts,
  settings,
  activeCustomer,
  setActiveCustomer,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  globalSearchQuery,
  onNavigate,
  services,
  activeReceptionistObj,
  onCheckoutComplete,
}: CustomersViewProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states to avoid heavy validation libraries for maximum reactivity
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Instant Billing Expansion states inside New Registration Modal
  const [enableInstantBilling, setEnableInstantBilling] = useState(false);
  const [addServiceId, setAddServiceId] = useState('');
  const [addStaffName, setAddStaffName] = useState('');
  const [addPaymentMethod, setAddPaymentMethod] = useState<'Cash' | 'Card' | 'EasyPaisa' | 'Bank Transfer'>('Cash');
  const [addCardNo, setAddCardNo] = useState('');
  const [addTransactionRef, setAddTransactionRef] = useState('');
  const [addOnlineAccountNo, setAddOnlineAccountNo] = useState('');

  // 1. Search Query selection
  const searchQuery = useMemo(() => {
    return (globalSearchQuery || internalSearch).toLowerCase();
  }, [globalSearchQuery, internalSearch]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery) ||
      c.phone.toLowerCase().includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery)
    );
  }, [customers, searchQuery]);

  // If a profile view is active, calculate their past receipt transactions
  const customerBills = useMemo(() => {
    if (!activeCustomer) return [];
    return receipts
      .filter(r => r.customerId === activeCustomer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeCustomer, receipts]);

  // Live PKR computations for New Registration Quick Billing
  const liveCalculation = useMemo(() => {
    const selectedSrv = services.find(s => s.id === addServiceId);
    if (!selectedSrv) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = selectedSrv.price;
    const tax = subtotal * settings.taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [addServiceId, services, settings.taxRate]);

  // Set selected client as prime active view automatically if nothing selected
  useEffect(() => {
    if (!activeCustomer && filteredCustomers.length > 0) {
      setActiveCustomer(filteredCustomers[0]);
    }
  }, [activeCustomer, filteredCustomers, setActiveCustomer]);

  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [activeCustomer?.id]);

  const [formError, setFormError] = useState<string | null>(null);

  // Modal loaders
  const openAddForm = () => {
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormNotes('');
    setFormError(null);
    setEnableInstantBilling(false);
    setAddServiceId('');
    setAddStaffName('');
    setAddPaymentMethod('Cash');
    setAddCardNo('');
    setAddTransactionRef('');
    setAddOnlineAccountNo('');
    setShowAddModal(true);
  };

  const openEditForm = (c: Customer) => {
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormEmail(c.email);
    setFormNotes(c.notes);
    setShowEditModal(true);
  };

  const submitAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formName.trim()) return;

    if (enableInstantBilling) {
      if (!addServiceId) {
        setFormError('Required: Select the treatment provided');
        return;
      }
      if (!addStaffName.trim()) {
        setFormError('Required: Enter Stylist/Staff Name handling this client');
        return;
      }
      if (addPaymentMethod === 'Card' && !addCardNo.trim()) {
        setFormError('Required: Enter card number digits');
        return;
      }
      if ((addPaymentMethod === 'EasyPaisa' || addPaymentMethod === 'Bank Transfer') && !addTransactionRef.trim()) {
        setFormError('Required: Enter transaction reference code');
        return;
      }
    }

    const tempId = `cust-${Date.now()}`;
    const nextCust = onAddCustomer({
      name: formName.trim(),
      phone: formPhone.trim() || 'Guest Member',
      email: formEmail.trim(),
      notes: formNotes.trim()
    }, tempId);

    if (enableInstantBilling) {
      const selectedSrv = services.find(s => s.id === addServiceId);
      if (selectedSrv) {
        const subtotal = selectedSrv.price;
        const tax = subtotal * settings.taxRate;
        const total = subtotal + tax;

        const finalReceipt: Receipt = {
          id: `rec-${Math.random().toString(36).substr(2, 9)}`,
          receiptNo: 'TX-TEMP', // App.tsx will replace with sequential Invoice No
          customerId: nextCust.id,
          customerName: nextCust.name,
          customerPhone: nextCust.phone,
          customerEmail: nextCust.email || undefined,
          services: [{
            id: selectedSrv.id,
            name: selectedSrv.name,
            price: selectedSrv.price,
            quantity: 1
          }],
          subtotal,
          discount: 0,
          tax,
          total,
          paymentMethod: addPaymentMethod,
          receptionistId: activeReceptionistObj?.id || 'aura-receptionist',
          receptionistName: activeReceptionistObj?.name || "BEL'AMOUR",
          date: new Date().toISOString(),
          staffName: addStaffName.trim(),
          cardNo: addPaymentMethod === 'Card' ? addCardNo.trim() : undefined,
          onlineProvider: (addPaymentMethod === 'EasyPaisa' || addPaymentMethod === 'Bank Transfer') ? addPaymentMethod : undefined,
          transactionRef: (addPaymentMethod === 'EasyPaisa' || addPaymentMethod === 'Bank Transfer') ? addTransactionRef.trim() : undefined,
          onlineAccountNo: (addPaymentMethod === 'EasyPaisa' || addPaymentMethod === 'Bank Transfer') ? addOnlineAccountNo.trim() : undefined
        };

        onCheckoutComplete(finalReceipt);
      }
    }

    setShowAddModal(false);
  };

  const submitEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !formName.trim()) return;
    onEditCustomer({
      ...activeCustomer,
      name: formName,
      phone: formPhone,
      email: formEmail,
      notes: formNotes
    });
    setShowEditModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header operations bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-display font-semibold text-stone-900">Loyalty Directory</h1>
          <p className="text-stone-400 text-xs mt-0.5">Manage VIP clients, visit counts, spend analytics, and service logs</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-850 text-white font-medium py-2.5 px-4 rounded-xl text-xs sm:text-sm tracking-wide cursor-pointer transition-all active:scale-98 shadow-md"
            id="add-customer-trigger-btn"
          >
            <Plus className="w-4 h-4" />
            Add Customer Profile
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center justify-center p-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 hover:text-stone-900 rounded-xl cursor-pointer transition-all shrink-0"
            title="Close Directory and return home"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main CRM Layout Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Customer directory listings card */}
        <div className="bg-white border border-stone-100 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[640px] lg:col-span-1">
          {/* Internal search tracker */}
          <div className="p-4 border-b border-stone-50 bg-stone-50/20">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search directory..."
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                className="w-full bg-white border border-stone-200 focus:border-stone-900 text-stone-850 placeholder-stone-400 text-xs pl-9 pr-3 py-2 rounded-xl transition-all outline-none"
              />
            </div>
          </div>

          {/* Directory list scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-50" id="customers-list-container">
            {filteredCustomers.length === 0 ? (
              <div className="py-20 text-center text-stone-400 text-xs font-mono">
                No loyal customer entries found
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = activeCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveCustomer(c)}
                    className={`p-4 text-left transition-all cursor-pointer select-none flex items-center justify-between group ${
                      isSelected ? 'bg-stone-900 text-white' : 'hover:bg-stone-50'
                    }`}
                    id={`customer-item-${c.id}`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-xs truncate ${isSelected ? 'text-white' : 'text-stone-800'}`}>
                          {c.name}
                        </span>
                        {c.totalSpending > 600 && (
                          <span className={`text-[8px] px-1 py-0.5 rounded font-mono font-bold shrink-0 ${
                            isSelected ? 'bg-gold-500/30 text-gold-200' : 'bg-gold-50 text-gold-700'
                          }`}>
                            VIP
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] mt-0.5 font-mono truncate ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                        {c.phone}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-xs font-mono font-semibold ${isSelected ? 'text-gold-200' : 'text-stone-900'}`}>
                        {settings.currency}{c.totalSpending.toFixed(0)}
                      </div>
                      <span className={`text-[9px] font-mono block ${isSelected ? 'text-stone-400' : 'text-stone-400'}`}>
                        {c.visitCount} visits
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Profile detailed tab panel */}
        <div className="lg:col-span-2 space-y-4">
          {activeCustomer ? (
            <div className="bg-white border border-stone-100 rounded-2xl shadow-xs p-6 relative min-h-[640px] flex flex-col justify-between">
              <div>
                
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-stone-50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center font-display font-semibold text-gold-800 text-lg shadow-inner">
                      {activeCustomer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-display font-semibold text-stone-900">{activeCustomer.name}</h2>
                        {activeCustomer.totalSpending > 600 && (
                          <span className="bg-gold-100 text-gold-800 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 font-mono">
                            <Award className="w-3.5 h-3.5" /> VIP LOYALTY
                          </span>
                        )}
                      </div>
                      <p className="text-stone-400 text-xs mt-0.5">Enrolled member since {new Date(activeCustomer.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(activeCustomer)}
                      className="p-2 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all cursor-pointer"
                      title="Edit general details"
                      id="edit-customer-btn"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {showDeleteConfirm ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-rose-50 border border-rose-100 p-2 rounded-xl animate-in fade-in duration-100 max-w-sm">
                        <div className="flex flex-col leading-tight pr-1">
                          <span className="text-xs text-rose-700 font-bold">Delete Customer?</span>
                          {activeReceptionistObj?.role === 'Cashier' ? (
                            <span className="text-[10px] text-rose-500 font-mono font-medium">Notice: Allowed for cashiers only if entered by mistake.</span>
                          ) : (
                            <span className="text-[10px] text-rose-500">This will remove loyalty profiles and history.</span>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0 mt-1 sm:mt-0">
                          <button
                            onClick={() => {
                              onDeleteCustomer(activeCustomer.id);
                              setActiveCustomer(null);
                              setShowDeleteConfirm(false);
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all cursor-pointer shadow-xs"
                            id="delete-customer-confirm-btn"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-2.5 py-1 text-[10px] font-medium text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-all cursor-pointer"
                            id="delete-customer-cancel-btn"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 border border-stone-100 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Delete profile"
                        id="delete-customer-btn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Submetrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <span className="text-stone-400 text-[10px] font-mono tracking-wider block uppercase">Total Expenditures</span>
                    <span className="text-lg font-display font-semibold text-stone-900 font-mono mt-1 block">
                      {settings.currency}{activeCustomer.totalSpending.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <span className="text-stone-400 text-[10px] font-mono tracking-wider block uppercase">Visit Count</span>
                    <span className="text-lg font-display font-semibold text-stone-900 font-mono mt-1 block">
                      {activeCustomer.visitCount} times
                    </span>
                  </div>

                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 col-span-2 sm:col-span-1">
                    <span className="text-stone-400 text-[10px] font-mono tracking-wider block uppercase">Last Booking Date</span>
                    <span className="text-xs font-semibold text-stone-800 mt-2 block whitespace-nowrap">
                      {activeCustomer.lastVisit ? new Date(activeCustomer.lastVisit).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Main detail content tabs split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                  
                  {/* Notes & Preferences */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-805 uppercase tracking-wider">
                      <Notebook className="w-4 h-4 text-stone-400" /> Stylist & Front Desk Notes
                    </div>
                    <div className="bg-amber-500/5 text-amber-950/80 border border-amber-600/15 rounded-xl p-4 text-xs font-sans leading-relaxed shadow-inner min-h-[140px] whitespace-pre-line" id="customer-notes-display">
                      {activeCustomer.notes || "No operational notes documented yet. Write custom guidelines on coffee preference, client allergies, stylist requests or premium hair codes."}
                    </div>
                    
                    {/* Fast contact listings */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2.5 text-xs text-stone-600">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-mono">{activeCustomer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-stone-600">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-mono break-all">{activeCustomer.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visit Transaction History */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-805 uppercase tracking-wider">
                      <History className="w-4 h-4 text-stone-400" /> Billing Logs ({customerBills.length})
                    </div>
                    
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="customer-billing-timeline">
                      {customerBills.length === 0 ? (
                        <div className="py-12 text-center text-stone-400 text-xs font-mono border border-dashed border-stone-100 rounded-xl bg-stone-50">
                          No receipts associated with this client
                        </div>
                      ) : (
                        customerBills.map((b) => (
                          <div key={b.id} className="bg-stone-50 border border-stone-100 rounded-xl p-3 flex justify-between items-center hover:bg-stone-100/50 transition-colors">
                            <div>
                              <div className="text-xs font-semibold text-stone-800">{b.receiptNo}</div>
                              <div className="text-[10px] text-stone-400 mt-0.5">
                                {new Date(b.date).toLocaleDateString()} • {b.services.length} services
                              </div>
                            </div>

                            <span className="font-mono text-xs font-semibold text-stone-900">
                              {settings.currency}{b.total.toFixed(2)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Fast POS checkout action inside loyalty module */}
              <div className="pt-4 border-t border-stone-50 bg-stone-50/20 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="text-xs text-stone-500">
                    Ready to checkout? Select this client inside <strong>POS billing</strong> to fast-track bookings.
                  </div>
                  <button
                    onClick={() => {
                      // Navigate to POS that lists this customer as preselected
                      setActiveCustomer(activeCustomer);
                      onNavigate('pos');
                    }}
                    className="flex items-center gap-1 bg-gold-600 hover:bg-gold-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-all cursor-pointer"
                    id="loyalty-checkout-shortcut"
                  >
                    Load into POS <CreditCard className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-stone-100 rounded-2xl shadow-xs p-20 text-center text-stone-400 text-xs font-mono h-[640px] flex items-center justify-center">
              Please choose a customer from the direct lookup menu on the left to review metrics
            </div>
          )}
        </div>

      </div>      {/* CREATE CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={submitAddCustomer}
            className="bg-white rounded-[24px] border border-stone-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-200"
            id="add-customer-form"
          >
            <div className="px-6 py-4.5 bg-[#132A21] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase block font-semibold">CRM OPERATIONS</span>
                <h3 className="font-display font-bold text-base text-white">Add Customer & Log Service</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scroll Container */}
            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto pr-2 divide-y divide-stone-100/60 font-sans">
              
              {/* Part 1: Basic Loyalty Registry info */}
              <div className="space-y-4 pb-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-[#132A21] bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850 placeholder-stone-400 font-medium transition-all"
                    id="form-customer-name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Telephone / Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 03001234567"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 focus:border-[#132A21] bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850 placeholder-stone-400"
                      id="form-customer-phone"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="name@domain.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 focus:border-[#132A21] bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850 placeholder-stone-400"
                      id="form-customer-email"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Preferences & Hair Notes (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Guidelines, style formulas, sensitivity codes..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-[#132A21] bg-white text-xs px-3.5 py-2 rounded-xl outline-none text-stone-850 placeholder-stone-400 resize-none font-sans"
                    id="form-customer-notes"
                  />
                </div>
              </div>

              {/* Part 2: First-class Treatment & Stylist Billing Integration */}
              <div className="space-y-4 pt-4">
                <div>
                  <h4 className="text-xs font-bold text-[#132A21] flex items-center gap-1.5 font-sans leading-none">
                    <span>Treatment Service & Staff Stylist Assignment</span>
                    <span className="text-[8px] bg-[#EEF3F0] text-[#3A4F46] font-mono border border-[#DCE5E0] px-2 py-0.5 rounded-full uppercase font-bold">
                      Billing Integration
                    </span>
                  </h4>
                  <p className="text-[10px] text-stone-400 mt-1 font-mono">
                    Select the service and stylist to instantly post this to sales history logs.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Service Done</label>
                  <select
                    value={addServiceId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAddServiceId(val);
                      setEnableInstantBilling(!!val);
                    }}
                    className="w-full bg-[#FAF9F5] border border-stone-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-[#D4AF37] text-stone-850 font-medium"
                    id="form-customer-treatment"
                  >
                    <option value="">-- No Treatment (Registry Member Only) --</option>
                    {services.filter(s => s.isActive).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {settings.currency}{s.price.toFixed(0)}
                      </option>
                    ))}
                  </select>
                </div>

                {enableInstantBilling && (
                  <div className="space-y-3.5 pt-1.5 animate-in slide-in-from-top-2 duration-200">
                    {/* Manual Stylist Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Stylist / Staff Member Providing Service *</label>
                      <input
                        type="text"
                        placeholder="e.g. Maria, Kashif, etc. (who provided service)"
                        value={addStaffName}
                        onChange={(e) => setAddStaffName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 focus:border-[#132A21] bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850 placeholder-stone-400 font-semibold"
                        id="form-customer-stylist"
                      />
                    </div>

                    {/* Payment Mode Selector inside CRM */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block hidden">Select Payment Method</label>
                      <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-stone-400 block">Select Payment Method</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['Cash', 'Card', 'EasyPaisa', 'Bank Transfer'] as const).map(m => {
                          const isActive = addPaymentMethod === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setFormError(null);
                                setAddPaymentMethod(m);
                              }}
                              className={`py-2 rounded-xl text-[10px] font-semibold text-center transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-[#132A21] text-white shadow-sm font-bold' 
                                  : 'border border-stone-200 text-stone-500 hover:text-stone-850 hover:bg-stone-50'
                              }`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Conditional input details according to selected payment method */}
                    {addPaymentMethod === 'Cash' && (
                      <div className="bg-[#EEF3F0] border border-[#DCE5E0] p-3 rounded-xl text-center">
                        <span className="text-[9px] uppercase font-mono tracking-wider text-[#3A4F46] font-bold block">
                          ✓ Cash Payment Clearance
                        </span>
                        <span className="text-[9px] text-[#556D62] block mt-0.5">No supplementary fields necessary.</span>
                      </div>
                    )}

                    {addPaymentMethod === 'Card' && (
                      <div className="space-y-1 bg-amber-500/5 border border-amber-600/10 p-3 rounded-xl animate-in fade-in duration-200">
                        <label className="text-[9px] font-mono font-bold tracking-wider uppercase text-amber-800 block">Card Number (digits) *</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          placeholder="e.g. 4584 1234 5678 9012"
                          value={addCardNo}
                          onChange={(e) => setAddCardNo(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                          className="w-full bg-white border border-stone-200 text-xs font-mono rounded-lg px-2.5 py-1.5 outline-none text-stone-800"
                        />
                      </div>
                    )}

                    {(addPaymentMethod === 'EasyPaisa' || addPaymentMethod === 'Bank Transfer') && (
                      <div className="space-y-2 bg-sky-500/5 border border-sky-600/10 p-3 rounded-xl animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#1C415C] block">Transaction Reference *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. EP-28103"
                              value={addTransactionRef}
                              onChange={(e) => setAddTransactionRef(e.target.value)}
                              className="w-full bg-white border border-stone-200 text-xs font-mono rounded-lg px-2.5 py-1.5 outline-none text-stone-800"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#1C415C] block">Sender Phone/Acc</label>
                            <input
                              type="text"
                              placeholder="e.g. 03451234567"
                              value={addOnlineAccountNo}
                              onChange={(e) => setAddOnlineAccountNo(e.target.value)}
                              className="w-full bg-white border border-stone-200 text-xs font-mono rounded-lg px-2.5 py-1.5 outline-none text-stone-800"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple live calculation overview banner */}
                    <div className="bg-[#FAF9F5] border border-stone-200/50 p-3.5 rounded-xl text-xs space-y-1.5 font-mono text-stone-600">
                      <div className="flex justify-between">
                        <span>Treatment Cost:</span>
                        <span>{settings.currency}{liveCalculation.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span>GST Sales Tax ({(settings.taxRate * 100).toFixed(0)}%):</span>
                        <span>{settings.currency}{liveCalculation.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#132A21] pt-1.5 border-t border-stone-200/40">
                        <span>Invoice Net:</span>
                        <span className="text-[#B48A30] font-bold text-sm">{settings.currency}{liveCalculation.total.toFixed(2)}</span>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>

            {/* Error messaging state */}
            {formError && (
              <div className="px-6 py-2.5 bg-rose-50 border-t border-rose-100 text-rose-700 font-mono text-[10px] text-center uppercase tracking-wider font-bold">
                ⚠️ {formError}
              </div>
            )}

            <div className="px-6 py-4.5 bg-stone-50 border-t border-stone-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 hover:bg-stone-100 text-stone-500 hover:text-stone-800 rounded-xl text-xs transition-all cursor-pointer font-medium font-sans"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#132A21] hover:bg-[#1A3B31]/90 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all cursor-pointer font-sans shadow-md"
                id="save-new-customer-btn"
              >
                {enableInstantBilling ? 'Checkout & Save Client' : 'Register Customer Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showEditModal && activeCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={submitEditCustomer}
            className="bg-white rounded-2xl border border-stone-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-200"
          >
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center">
              <h3 className="font-display font-semibold text-stone-950 text-base">Modify Client Details</h3>
              <button 
                type="button" 
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-505 block">Client Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-505 block">Telephone *</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-505 block">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-505 block">Receptionist Prefs & Stylist Notes</label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850 resize-none font-sans"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 hover:bg-stone-100 text-stone-500 hover:text-stone-800 rounded-xl text-xs transition-all cursor-pointer"
              >
                Discard
              </button>
              <button
                type="submit"
                className="bg-stone-900 hover:bg-stone-850 text-white font-medium py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
                id="update-customer-confirm-btn"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
