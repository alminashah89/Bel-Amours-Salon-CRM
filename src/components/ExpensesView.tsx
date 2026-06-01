/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit2, 
  Filter, 
  Calendar as CalendarIcon, 
  Tag, 
  FileText,
  User as UserIcon,
  X,
  PlusCircle,
  TrendingDown,
  Info
} from 'lucide-react';
import { Expense, User, SalonSettings } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  onAddExpense: (exp: Omit<Expense, 'id' | 'createdBy'>) => void;
  onEditExpense: (exp: Expense) => void;
  onDeleteExpense: (id: string) => void;
  currentUser: User | null;
  settings: SalonSettings;
}

const EXPENSE_CATEGORIES = [
  'Staff Salary',
  'Electricity Bill',
  'Food/Tea Expense',
  'Cosmetic Purchases',
  'Shop Maintenance',
  'Other Expenses'
];

export default function ExpensesView({
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  currentUser,
  settings
}: ExpensesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchNotes, setSearchNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isAdmin = useMemo(() => {
    return currentUser?.role === 'Admin' || currentUser?.role === 'Manager';
  }, [currentUser]);

  // Handle open modal for adding
  const openAddModal = () => {
    setEditingExpense(null);
    setCategory(EXPENSE_CATEGORIES[0]);
    setAmount('');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  // Handle open modal for editing
  const openEditModal = (exp: Expense) => {
    if (!isAdmin) return;
    setEditingExpense(exp);
    setCategory(exp.category);
    setAmount(exp.amount.toString());
    setNotes(exp.notes);
    setDate(exp.date);
    setIsModalOpen(true);
  };

  // Handle Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valAmount = parseFloat(amount);
    if (isNaN(valAmount) || valAmount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    if (editingExpense) {
      onEditExpense({
        ...editingExpense,
        category,
        amount: valAmount,
        notes,
        date
      });
    } else {
      onAddExpense({
        category,
        amount: valAmount,
        notes,
        date
      });
    }
    setIsModalOpen(false);
  };

  // Filtered list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Category match
      if (selectedCategory !== 'All' && exp.category !== selectedCategory) {
        return false;
      }
      // Search notes
      if (searchNotes && !exp.notes.toLowerCase().includes(searchNotes.toLowerCase())) {
        return false;
      }
      // Date range match
      if (startDate && exp.date < startDate) {
        return false;
      }
      if (endDate && exp.date > endDate) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedCategory, searchNotes, startDate, endDate]);

  // Sum aggregates
  const totalInFilter = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Upper Title banner section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-stone-200 p-6 rounded-2xl shadow-xs relative overflow-hidden">
        <div>
          <span className="text-[#B48A30] font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" /> Bookkeeping & Cash outflow
          </span>
          <h1 className="text-2xl font-display font-semibold mt-1 text-stone-950">Salon Expenses Ledger</h1>
          <p className="text-stone-500 text-xs mt-1 max-w-xl">
            Track utilities, team payroll advances, rent, tea buffers, and equipment maintenance. Safe data synchronized with Firestore.
          </p>
        </div>
        
        {isAdmin ? (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#B48A30] text-white font-semibold px-4 py-2.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-gold-500/10 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Add Expense Note
          </button>
        ) : (
          <div className="bg-stone-50 border border-stone-150 rounded-xl px-3.5 py-2.5 text-[11px] text-stone-500 font-mono flex items-center gap-2 max-w-[280px]">
            <Info className="w-4 h-4 text-[#B48A30] shrink-0" />
            <span>Viewing as {currentUser?.role}. Expense modifications are locked to Managers/Admins.</span>
          </div>
        )}
      </div>

      {/* Filter Dock */}
      <div className="bg-white border border-stone-200/60 rounded-2xl p-5 shadow-xs grid grid-cols-12 gap-3.5">
        <div className="col-span-12 sm:col-span-6 md:col-span-3">
          <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1.5">Category Filter</label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-stone-50 text-stone-850 hover:bg-stone-100/75 border border-stone-200 rounded-xl px-3 py-2 text-xs transition-all cursor-pointer font-medium focus:ring-1 focus:ring-[#C5B496] focus:outline-none"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-5">
          <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1.5">Search Notes</label>
          <input
            type="text"
            placeholder="Search memo notes, bills..."
            value={searchNotes}
            onChange={(e) => setSearchNotes(e.target.value)}
            className="w-full bg-stone-50 text-stone-850 border border-stone-200 rounded-xl px-3 py-2 text-xs transition-all placeholder-stone-400 focus:ring-1 focus:ring-[#C5B496] focus:outline-none"
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-2">
          <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1.5">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-stone-50 text-stone-850 border border-stone-200 rounded-xl px-3 py-2 text-xs transition-all focus:ring-1 focus:ring-[#C5B496] focus:outline-none"
          />
        </div>

        <div className="col-span-12 sm:col-span-6 md:col-span-2">
          <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1.5">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-stone-50 text-stone-850 border border-stone-200 rounded-xl px-3 py-2 text-xs transition-all focus:ring-1 focus:ring-[#C5B496] focus:outline-none"
          />
        </div>
      </div>

      {/* Aggregate Overview Card Grid representing Filter state */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#FCF8E3] border border-[#EDEAD6] p-5 rounded-2xl shadow-xs flex justify-between items-center">
          <div>
            <span className="text-stone-500 text-xs font-mono tracking-wider font-semibold uppercase block">Aggregated Cash Outflow</span>
            <span className="text-3xl font-display font-bold text-[#544431] mt-1 block">
              {settings.currency}{totalInFilter.toFixed(2)}
            </span>
            <p className="text-[10px] text-stone-400 mt-1 font-mono">Matched {filteredExpenses.length} filters ledger logs</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-xl border border-[#EDEAD6] flex items-center justify-center text-[#B48A30]">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center shrink-0 border border-stone-100">
            <Info className="w-5 h-5 text-[#B48A30]" />
          </div>
          <div className="text-xs text-stone-500 leading-relaxed">
            <span className="font-semibold text-stone-850 block mb-0.5">Dual Level Authorization Rules</span>
            All salon shifts are logged. Admins hold full catalog controls while cashiers and receptionists operate read-only screens to prevent balance tampering.
          </div>
        </div>
      </div>

      {/* Main Expenses Registry Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/75 flex justify-between items-center">
          <h3 className="text-sm font-display font-bold text-stone-900 uppercase tracking-wide">Expense Records</h3>
          <span className="font-mono text-[10px] text-stone-400 uppercase font-semibold">Ordered by Date (Newest first)</span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-55 flex items-center justify-center text-stone-400 mx-auto mb-3 border border-stone-100">
              <PlusCircle className="w-6 h-6" />
            </div>
            <p className="text-stone-800 text-sm font-semibold">No expense records found</p>
            <p className="text-stone-400 text-xs mt-1">Refine your active filters dock or insert a new expense entry node</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 font-mono text-[10px] uppercase font-bold bg-stone-50/25">
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Memo Notes</th>
                  <th className="py-3 px-5">Logged By</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  {isAdmin && <th className="py-3 px-5 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 text-xs">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-stone-600 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        exp.category === 'Staff Salary' ? 'bg-violet-50 text-violet-700 border border-violet-100' :
                        exp.category === 'Electricity Bill' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        exp.category === 'Food/Tea Expense' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                        exp.category === 'Cosmetic Purchases' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        exp.category === 'Shop Maintenance' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                        'bg-stone-100 text-stone-700 border border-stone-200'
                      }`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-stone-600 max-w-xs truncate" title={exp.notes}>
                      {exp.notes || <span className="text-stone-300 italic">No notes written</span>}
                    </td>
                    <td className="py-3.5 px-5 text-stone-500 font-medium">
                      {exp.createdBy}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-stone-900 whitespace-nowrap">
                      {settings.currency}{exp.amount.toFixed(2)}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1 px-2 text-stone-500 hover:text-[#B48A30] hover:bg-[#FCF8E3]/50 rounded-lg transition-all cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirmId === exp.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 p-0.5 px-1 rounded-lg animate-in fade-in duration-100">
                              <span className="text-[10px] text-rose-600 font-bold whitespace-nowrap">Sure?</span>
                              <button
                                onClick={() => {
                                  onDeleteExpense(exp.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-rose-600 rounded-md transition-all cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 text-[9px] font-medium text-stone-600 bg-white border border-stone-200 rounded-md transition-all cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(exp.id)}
                              className="p-1 px-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over / Modal Form Panel */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-stone-200 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-display font-extrabold text-[#544431] uppercase tracking-wide">
                  {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
                </h3>
                <p className="text-[10px] text-stone-400 font-mono">FIRESTORE DIRECT WRITING</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#B48A30]" /> Category Selector
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-stone-50 text-stone-850 hover:bg-stone-100/75 border border-stone-200 rounded-xl px-3 py-2 text-xs transition-all cursor-pointer font-medium focus:ring-1 focus:ring-[#C5B496] focus:outline-none"
                  required
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-[#B48A30]" /> Amount ({settings.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-stone-50 text-stone-850 border border-stone-200 rounded-xl px-3 py-2.5 text-xs transition-all placeholder-stone-400 focus:ring-1 focus:ring-[#C5B496] focus:outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-[#B48A30]" /> Expense Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-stone-50 text-stone-850 border border-stone-200 rounded-xl px-3 py-2.5 text-xs transition-all focus:ring-1 focus:ring-[#C5B496] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#B48A30]" /> Memo Notes / Receipt Details
                </label>
                <textarea
                  placeholder="Describe details e.g., AC general maintenance service charger, tea/food list buffer bill reference..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-stone-50 text-stone-850 border border-stone-200 rounded-xl px-3 py-2.5 text-xs transition-all placeholder-stone-400 focus:ring-1 focus:ring-[#C5B496] focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="pt-4 border-t border-stone-50 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#C5A059] hover:bg-[#B48A30] text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-gold-500/10 cursor-pointer"
                >
                  {editingExpense ? 'Save Changes' : 'Confirm & Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
