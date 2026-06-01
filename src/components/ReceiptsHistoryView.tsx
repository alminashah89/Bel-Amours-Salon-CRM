/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Eye, 
  Trash2, 
  Calendar, 
  ChevronRight, 
  Filter,
  User,
  CreditCard,
  Hash
} from 'lucide-react';
import { Receipt, SalonSettings, User as UserType } from '../types';

interface ReceiptsHistoryViewProps {
  receipts: Receipt[];
  settings: SalonSettings;
  onOpenReceipt: (receipt: Receipt) => void;
  showToaster: (msg: string) => void;
  onDeleteReceipt?: (id: string) => void;
  currentUser?: UserType | null;
}

export default function ReceiptsHistoryView({
  receipts,
  settings,
  onOpenReceipt,
  showToaster,
  onDeleteReceipt,
  currentUser
}: ReceiptsHistoryViewProps) {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter Logic
  const filteredReceipts = useMemo(() => {
    return receipts.filter((rec) => {
      const query = search.toLowerCase();
      const matchesSearch = rec.receiptNo.toLowerCase().includes(query) || 
                            rec.customerName.toLowerCase().includes(query);
      
      const matchesPayment = paymentFilter === 'All' || rec.paymentMethod === paymentFilter;

      // Date cutoff checks
      let matchesDate = true;
      const recDate = new Date(rec.date);
      const now = new Date();
      
      if (dateFilter === 'Today') {
        const todayCutoff = new Date();
        todayCutoff.setHours(0,0,0,0);
        matchesDate = recDate >= todayCutoff;
      } else if (dateFilter === 'Week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = recDate >= weekAgo;
      } else if (dateFilter === 'Month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        matchesDate = recDate >= monthAgo;
      }

      return matchesSearch && matchesPayment && matchesDate;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [receipts, search, dateFilter, paymentFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page headers */}
      <div>
        <h1 className="text-xl font-display font-semibold text-stone-900">Historical Journal</h1>
        <p className="text-stone-400 text-xs mt-0.5">Audit processed bookings, reprint thermal sheets, and export ledger parameters</p>
      </div>

      {/* Filtering Ribbon */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice # or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-stone-200 focus:border-stone-900 text-stone-850 placeholder-stone-400 text-xs pl-11 pr-4 py-2 rounded-xl transition-all outline-none"
            id="receipt-search-input"
          />
        </div>

        {/* Date Filters & Tender Toggles */}
        <div className="flex gap-3 flex-wrap items-center">
          
          {/* Date Picker Button Toggles */}
          <div className="flex border border-stone-200 rounded-xl overflow-hidden bg-white shrink-0">
            {(['All', 'Today', 'Week', 'Month'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setDateFilter(opt)}
                className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  dateFilter === opt 
                    ? 'bg-stone-900 text-white shadow-xs' 
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {opt === 'All' ? 'All Ledger' : opt}
              </button>
            ))}
          </div>

          {/* Payment Method Drops */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white border border-stone-200 hover:border-stone-300 text-stone-600 font-semibold text-xs px-3 py-2 rounded-xl outline-none"
          >
            <option value="All">All Tenders</option>
            <option value="Cash">Cash Only</option>
            <option value="Card">Card Only</option>
            <option value="EasyPaisa">EasyPaisa Only</option>
            <option value="JazzCash">JazzCash Only</option>
            <option value="Bank Transfer">Bank Transfer Only</option>
          </select>

        </div>

      </div>

      {/* Table grid layout */}
      <div className="bg-white border border-stone-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]" id="receipts-table-ledger">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-[10px] font-mono font-bold text-stone-400 tracking-wider">
                <th className="py-3 px-6">Invoice ID</th>
                <th className="py-3 px-6">Client Name</th>
                <th className="py-3 px-6">Transaction Date</th>
                <th className="py-3 px-6">Treatments</th>
                <th className="py-3 px-6">Tender Method</th>
                <th className="py-3 px-6 text-right">Net Charged</th>
                <th className="py-3 px-6 text-center">Receipt Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 text-stone-800 text-xs">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center text-stone-400 text-xs font-mono">
                    No historical receipts registered on matching parameters
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((rec) => (
                  <tr 
                    key={rec.id}
                    className="hover:bg-stone-50/50 transition-colors group"
                  >
                    {/* Invoice ref */}
                    <td className="py-4 px-6 font-mono font-semibold text-stone-900">
                      {rec.receiptNo}
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-stone-850">{rec.customerName}</div>
                      {rec.customerPhone && (
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">{rec.customerPhone}</div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-stone-500">
                      <div>{new Date(rec.date).toLocaleDateString()}</div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {new Date(rec.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Services Summary */}
                    <td className="py-4 px-6 text-stone-600 max-w-[280px] truncate" title={rec.services.map(s => `${s.quantity}x ${s.name}`).join(', ')}>
                      {rec.services.map(s => `${s.quantity}x ${s.name}`).join(', ')}
                    </td>

                    {/* Payment Method */}
                    <td className="py-4 px-6">
                      <span className="bg-stone-50 text-stone-700 text-[10px] font-mono font-bold border border-stone-150 px-2 py-1 rounded-lg">
                        {rec.paymentMethod}
                      </span>
                    </td>

                    {/* Total Net */}
                    <td className="py-4 px-6 text-right font-mono font-semibold text-stone-950">
                      {settings.currency}{rec.total.toFixed(2)}
                    </td>

                    {/* Interactive Print and details shortcuts */}
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onOpenReceipt(rec)}
                          className="p-1 px-2.5 bg-stone-50 hover:bg-stone-900 text-stone-600 hover:text-white border border-stone-200 hover:border-stone-900 rounded-lg text-[11px] font-sans transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Review thermal visual"
                          id={`reprint-btn-${rec.receiptNo}`}
                        >
                          <Eye className="w-3.5 h-3.5" /> View / Print
                        </button>
                        {currentUser?.role !== 'Cashier' && (
                          deleteConfirmId === rec.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 p-0.5 px-1.5 rounded-lg animate-in fade-in duration-100">
                              <span className="text-[10px] text-rose-600 font-bold whitespace-nowrap">Delete?</span>
                              <button
                                onClick={() => {
                                  onDeleteReceipt?.(rec.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-600 rounded-md transition-all cursor-pointer"
                                id={`delete-confirm-btn-${rec.receiptNo}`}
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 text-[10px] font-medium text-stone-600 bg-white border border-stone-200 rounded-md transition-all cursor-pointer"
                                id={`delete-cancel-btn-${rec.receiptNo}`}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(rec.id)}
                              className="p-1 px-2 text-rose-500 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg text-[11px] font-sans transition-all flex items-center gap-1 cursor-pointer"
                              title="Delete receipt record"
                              id={`delete-btn-${rec.receiptNo}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
