/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  CircleDollarSign,
  Users, 
  Calendar,
  ShieldAlert,
  Search,
  Receipt as ReceiptIcon,
  Coins,
  Wallet,
  CreditCard,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Info,
  Download
} from 'lucide-react';
import { Customer, Receipt, SalonSettings, User, Expense, Service } from '../types';

interface ReportsViewProps {
  receipts: Receipt[];
  customers: Customer[];
  settings: SalonSettings;
  currentUser: User | null;
  expenses: Expense[];
  services?: Service[];
}

export default function ReportsView({ 
  receipts, 
  customers, 
  settings, 
  currentUser,
  expenses = [],
  services = []
}: ReportsViewProps) {
  
  // Tab state: 'reports' indicates advanced metrics, 'income' represents the detailed ledger log
  const [activeSegment, setActiveSegment] = useState<'reports' | 'income'>('reports');

  // Time window state filter: 'today' | 'weekly' | 'monthly' | 'yearly' | 'all'
  const [timeRange, setTimeRange] = useState<'today' | 'weekly' | 'monthly' | 'yearly' | 'all'>('all');

  // Table search & filter states
  const [tableSearch, setTableSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Admin and Manager role permissions guard
  const isAdminOrManager = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  // Helper date filtering logic
  const filteredData = useMemo(() => {
    const now = new Date();
    
    // Filter receipts
    const rFiltered = receipts.filter(receipt => {
      const rDate = new Date(receipt.date);
      if (isNaN(rDate.getTime())) return false;

      if (timeRange === 'today') {
        const rDateStr = rDate.toISOString().split('T')[0];
        const todayStr = now.toISOString().split('T')[0];
        return rDateStr === todayStr;
      }
      if (timeRange === 'all') return true;

      const diffTime = now.getTime() - rDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (timeRange === 'weekly') return diffDays <= 7;
      if (timeRange === 'monthly') return diffDays <= 30;
      if (timeRange === 'yearly') return diffDays <= 365;

      return true;
    });

    // Filter expenses
    const eFiltered = expenses.filter(expense => {
      // Expenses date is YYYY-MM-DD
      const eDate = new Date(expense.date);
      if (isNaN(eDate.getTime())) return false;

      if (timeRange === 'today') {
        const eDateStr = expense.date; // already YYYY-MM-DD
        const todayStr = now.toISOString().split('T')[0];
        return eDateStr === todayStr;
      }
      if (timeRange === 'all') return true;

      const diffTime = now.getTime() - eDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (timeRange === 'weekly') return diffDays <= 7;
      if (timeRange === 'monthly') return diffDays <= 30;
      if (timeRange === 'yearly') return diffDays <= 365;

      return true;
    });

    return { receipts: rFiltered, expenses: eFiltered };
  }, [receipts, expenses, timeRange]);

  // Compute key numbers dynamically
  const metrics = useMemo(() => {
    const periodReceipts = filteredData.receipts;
    const periodExpenses = filteredData.expenses;

    const totalSales = periodReceipts.reduce((sum, r) => sum + r.total, 0);
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingProfit = totalSales - totalExpenses;

    const receiptsCount = periodReceipts.length;

    // Count unique customers served during the chosen period
    const uniqueCustIds = new Set<string>();
    let walkInGuests = 0;
    periodReceipts.forEach(r => {
      if (r.customerId) {
        uniqueCustIds.add(r.customerId);
      } else {
        walkInGuests++;
      }
    });
    const totalCustomersServed = uniqueCustIds.size + walkInGuests;

    // Payment splits calculation
    const getSplit = (methods: string[]) => {
      return periodReceipts
        .filter(r => methods.some(m => r.paymentMethod.toLowerCase() === m.toLowerCase()))
        .reduce((sum, r) => sum + r.total, 0);
    };

    const cashTotal = getSplit(['cash']);
    const easypaisaTotal = getSplit(['easypaisa']);
    const jazzcashTotal = getSplit(['jazzcash']);
    const bankTransferTotal = getSplit(['bank transfer', 'bank']);
    const cardTotal = getSplit(['card', 'credit card', 'debit card']);

    // Detailed Income Metrics
    const grossSales = periodReceipts.reduce((sum, r) => sum + (r.subtotal !== undefined ? r.subtotal : r.total), 0);
    const totalDiscounts = periodReceipts.reduce((sum, r) => sum + (r.discount || 0), 0);
    const totalTax = periodReceipts.reduce((sum, r) => sum + (r.tax || 0), 0);
    const netRevenue = totalSales;
    const avgReceiptSize = receiptsCount > 0 ? (totalSales / receiptsCount) : 0;

    // Detailed staff earnings split
    const staffSummary: { [name: string]: { name: string; count: number; gross: number; net: number } } = {};
    periodReceipts.forEach(r => {
      const sName = r.staffName || 'Unassigned / Operator';
      if (!staffSummary[sName]) {
        staffSummary[sName] = { name: sName, count: 0, gross: 0, net: 0 };
      }
      staffSummary[sName].count += 1;
      staffSummary[sName].gross += (r.subtotal !== undefined ? r.subtotal : r.total);
      staffSummary[sName].net += r.total;
    });
    const staffPerformance = Object.values(staffSummary).sort((a, b) => b.net - a.net);

    // Detailed service breakdown
    const serviceSummary: { [name: string]: { name: string; category: string; count: number; revenue: number } } = {};
    periodReceipts.forEach(r => {
      r.services.forEach(item => {
        const key = item.name;
        if (!serviceSummary[key]) {
          const foundS = (services || []).find(s => s.id === item.id || s.name.toLowerCase() === item.name.toLowerCase());
          const cat = foundS?.category || 'Treatment';
          serviceSummary[key] = { name: item.name, category: cat, count: 0, revenue: 0 };
        }
        serviceSummary[key].count += item.quantity;
        serviceSummary[key].revenue += (item.price * item.quantity);
      });
    });
    const popularServices = Object.values(serviceSummary).sort((a, b) => b.revenue - a.revenue);

    return {
      totalSales,
      totalExpenses,
      remainingProfit,
      receiptsCount,
      totalCustomersServed,
      cashTotal,
      easypaisaTotal,
      jazzcashTotal,
      bankTransferTotal,
      cardTotal,
      grossSales,
      totalDiscounts,
      totalTax,
      netRevenue,
      avgReceiptSize,
      staffPerformance,
      popularServices
    };
  }, [filteredData, services]);

  // Filtered detailed income table calculations
  const tableData = useMemo(() => {
    return filteredData.receipts.filter(receipt => {
      // Lookup match
      const searchableStr = `${receipt.receiptNo} ${receipt.customerName} ${receipt.paymentMethod} ${receipt.services.map(s => s.name).join(' ')}`.toLowerCase();
      const matchesSearch = searchableStr.includes(tableSearch.toLowerCase());

      // Method match
      let matchesMethod = true;
      if (paymentFilter !== 'All') {
        if (paymentFilter === 'EasyPaisa/JazzCash') {
          matchesMethod = ['easypaisa', 'jazzcash'].includes(receipt.paymentMethod.toLowerCase());
        } else {
          matchesMethod = receipt.paymentMethod.toLowerCase() === paymentFilter.toLowerCase();
        }
      }

      return matchesSearch && matchesMethod;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredData.receipts, tableSearch, paymentFilter]);

  // CSV Downloader helper with proper character encoding & Excel-complying double quote escaping
  const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
    const escapeCSVField = (field: any) => {
      if (field === null || field === undefined) return '""';
      let stringified = String(field);
      stringified = stringified.replace(/"/g, '""');
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n') || stringified.includes('\r')) {
        return `"${stringified}"`;
      }
      return `"${stringified}"`;
    };

    const csvContent = [
      headers.map(escapeCSVField).join(','),
      ...rows.map(row => row.map(escapeCSVField).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Export Income reports with requested fields
  const handleExportIncome = () => {
    const headers = [
      'Receipt ID',
      'Customer Name',
      'Services Purchased',
      'Payment Method',
      'Total Amount',
      'Visit Count',
      'Date & Time'
    ];

    const rows = filteredData.receipts.map(rec => {
      const associatedCust = customers.find(c => c.id === rec.customerId);
      const displayVisits = rec.customerId 
        ? String(associatedCust?.visitCount || '1') 
        : 'Walk-In';

      const servicesStr = rec.services.map(s => `${s.quantity}x ${s.name}`).join(', ');

      return [
        rec.receiptNo,
        rec.customerName,
        servicesStr,
        rec.paymentMethod,
        `${settings.currency} ${rec.total.toFixed(2)}`,
        displayVisits,
        new Date(rec.date).toISOString().replace('T', ' ').substring(0, 19)
      ];
    });

    downloadCSV(headers, rows, `Income_Report_${timeRange.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // 2. Export Expense reports with requested fields
  const handleExportExpenses = () => {
    const headers = [
      'Expense Category',
      'Expense Amount',
      'Expense Notes',
      'Payment Type',
      'Date & Time'
    ];

    const rows = filteredData.expenses.map(exp => {
      const getPaymentType = (category: string) => {
        if (category === 'Electricity Bill' || category === 'Shop Maintenance') return 'Bank Wire / Accounts';
        if (category === 'Staff Salary') return 'Direct Bank Transfer / Cash';
        return 'Cash Register Drawer';
      };

      return [
        exp.category,
        `${settings.currency} ${exp.amount.toFixed(2)}`,
        exp.notes,
        getPaymentType(exp.category),
        exp.date + ' 00:00:00'
      ];
    });

    downloadCSV(headers, rows, `Expenses_Report_${timeRange.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // 3. Export Transactions reports with audit field trails
  const handleExportTransactions = () => {
    const headers = [
      'Transaction ID',
      'Receipt No',
      'Customer Name',
      'Customer Phone',
      'Services Rendered',
      'Subtotal',
      'Discount',
      'Tax Charged',
      'Total Paid',
      'Payment Method',
      'Operator / Cashier',
      'Date & Time'
    ];

    const rows = filteredData.receipts.map(rec => {
      const servicesStr = rec.services.map(s => `${s.quantity}x ${s.name}`).join(', ');
      return [
        rec.id,
        rec.receiptNo,
        rec.customerName,
        rec.customerPhone || 'N/A',
        servicesStr,
        `${settings.currency} ${rec.subtotal.toFixed(2)}`,
        `${settings.currency} ${rec.discount.toFixed(2)}`,
        `${settings.currency} ${rec.tax.toFixed(2)}`,
        `${settings.currency} ${rec.total.toFixed(2)}`,
        rec.paymentMethod,
        rec.receptionistName,
        new Date(rec.date).toISOString().replace('T', ' ').substring(0, 19)
      ];
    });

    downloadCSV(headers, rows, `Transactions_Report_${timeRange.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // 4. Export Customer reports filtered by registration timeRange matching dashboard
  const handleExportCustomers = () => {
    const headers = [
      'Customer ID',
      'Customer Name',
      'Phone Number',
      'Email Address',
      'Total Spending',
      'Visit Count',
      'Last Visit Date',
      'Joined Date',
      'Operator Notes'
    ];

    const filteredCustomers = customers.filter(customer => {
      if (timeRange === 'all') return true;
      const cDate = new Date(customer.createdAt);
      if (isNaN(cDate.getTime())) return false;

      const now = new Date();
      if (timeRange === 'today') {
        const cDateStr = customer.createdAt.split('T')[0];
        const todayStr = now.toISOString().split('T')[0];
        return cDateStr === todayStr;
      }

      const diffTime = now.getTime() - cDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (timeRange === 'weekly') return diffDays <= 7;
      if (timeRange === 'monthly') return diffDays <= 30;
      if (timeRange === 'yearly') return diffDays <= 365;

      return true;
    });

    const rows = filteredCustomers.map(cust => [
      cust.id,
      cust.name,
      cust.phone,
      cust.email || 'N/A',
      `${settings.currency} ${cust.totalSpending.toFixed(2)}`,
      String(cust.visitCount),
      cust.lastVisit || 'N/A',
      cust.createdAt.replace('T', ' ').substring(0, 19),
      cust.notes || ''
    ]);

    downloadCSV(headers, rows, `Customers_Report_${timeRange.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Export current Ledger (including tableSearch & paymentFilter)
  const handleExportLedgerList = () => {
    const headers = [
      'Receipt ID',
      'Customer Name',
      'Customer Phone',
      'Services Purchased',
      'Payment Method',
      'Visit Count',
      'Date & Time',
      'Total Bill'
    ];

    const rows = tableData.map(rec => {
      const associatedCust = customers.find(c => c.id === rec.customerId);
      const displayVisits = rec.customerId 
        ? String(associatedCust?.visitCount || '1') 
        : 'Walk-In';

      const servicesStr = rec.services.map(s => `${s.quantity}x ${s.name}`).join(', ');

      return [
        rec.receiptNo,
        rec.customerName,
        rec.customerPhone || 'N/A',
        servicesStr,
        rec.paymentMethod,
        displayVisits,
        new Date(rec.date).toISOString().replace('T', ' ').substring(0, 19),
        `${settings.currency} ${rec.total.toFixed(2)}`
      ];
    });

    downloadCSV(headers, rows, `Ledger_Selected_List_${timeRange.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Render Access Lockout notice for Cashiers / Stylists
  if (!isAdminOrManager) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white border border-stone-100 rounded-3xl max-w-lg mx-auto my-12 shadow-md">
        <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-lg font-display font-semibold text-stone-900 uppercase tracking-tight">Executive Console Restricted</h2>
        <p className="text-stone-550 text-xs mt-2 max-w-sm leading-relaxed">
          Operational auditing, dynamic reporting ledger tools, and cash-drawer analytics are restricted to **Admin** roles. Cashiers are restricted to POS billing interfaces.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page header and tab controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-stone-950">Business Reports Console</h1>
          <p className="text-stone-500 text-xs mt-0.5">Dual-mode reporting deck showing sales volumes, expenses ledger splits, and cashier registers</p>
        </div>

        {/* Console view toggle pills */}
        <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200 self-start md:self-auto shadow-inner">
          <button
            onClick={() => setActiveSegment('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeSegment === 'reports'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200/50'
                : 'text-stone-500 hover:text-stone-850'
            }`}
            id="tab-reports-analytics"
          >
            SaaS Analytics & Summaries
          </button>
          <button
            onClick={() => setActiveSegment('income')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeSegment === 'income'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200/50'
                : 'text-stone-500 hover:text-stone-850'
            }`}
            id="tab-detailed-ledger"
          >
            Detailed Income Register
          </button>
        </div>
      </div>

      {/* Primary Timeline control pills */}
      <div className="bg-[#3D3120] border border-[#544431]/20 p-5 rounded-3xl text-stone-150 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-md relative overflow-hidden">
        {/* Soft floating background light */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-mono tracking-widest font-bold text-[#D4AF37] uppercase">Dynamic Window Filter</span>
          <h2 className="text-base font-semibold text-white">Choose Audit Duration</h2>
          <p className="text-stone-400 text-[11px]">All metrics, balances, and records recalculate reactively based on your timeframe selection.</p>
        </div>

        {/* Range switcher pills */}
        <div className="flex flex-wrap gap-1 sm:gap-1.5 bg-[#2C2114] p-1 sm:p-1.5 rounded-2xl border border-[#4E3E2A] relative z-10 w-full lg:w-auto justify-center sm:justify-start">
          {(['today', 'weekly', 'monthly', 'yearly', 'all'] as const).map(range => {
            const labelMap = {
              today: { short: 'Today', long: 'Today Only' },
              weekly: { short: 'Weekly', long: 'Weekly Summary' },
              monthly: { short: 'Monthly', long: 'Monthly Summary' },
              yearly: { short: 'Yearly', long: 'Yearly Overview' },
              all: { short: 'All', long: 'All Time' }
            };
            const isSelected = timeRange === range;
            return (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-grow sm:flex-grow-0 text-center ${
                  isSelected 
                    ? 'bg-[#B48A30] text-white shadow-md' 
                    : 'text-[#C5B496] hover:text-white hover:bg-white/5'
                }`}
                id={`btn-timerange-${range}`}
              >
                <span className="sm:hidden">{labelMap[range].short}</span>
                <span className="hidden sm:inline">{labelMap[range].long}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONDITIONAL SEGMENT A: ANALYTICS & SUMMARIES */}
      {activeSegment === 'reports' && (
        <div className="space-y-6 animate-in fade-in-30 duration-200">
          
          {/* Main Financial overview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="main-analytics-columns">
            {/* Sales Card */}
            <div className="bg-white border border-stone-150 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-[10px] font-mono tracking-wider font-semibold uppercase">Total Sales ({timeRange === 'all' ? 'All' : timeRange})</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-xl font-display font-bold text-stone-950 font-mono">
                  {settings.currency} {metrics.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className="text-[10px] text-stone-400 mt-1">Aggregated ticket inputs</div>
              </div>
            </div>

            {/* Expenses Card */}
            <div className="bg-white border border-stone-150 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-[10px] font-mono tracking-wider font-semibold uppercase">Total Expenses</span>
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-xl font-display font-bold text-stone-950 font-mono">
                  {settings.currency} {metrics.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className="text-[10px] text-stone-400 mt-1">Managed cash outflows</div>
              </div>
            </div>

            {/* Remaining Profit Card */}
            <div className={`p-5 rounded-2xl shadow-xs border flex flex-col justify-between transition-all ${
              metrics.remainingProfit >= 0
                ? 'bg-[#FCF8E3]/55 border-[#EDEAD6]' 
                : 'bg-rose-50/30 border-rose-100'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 text-[10px] font-mono tracking-wider font-semibold uppercase">Remaining Profit</span>
                <div className={`p-1.5 rounded-lg ${
                  metrics.remainingProfit >= 0 ? 'bg-gold-100 text-[#B48A30]' : 'bg-rose-100 text-rose-700'
                }`}>
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-xl font-display font-bold font-mono ${
                  metrics.remainingProfit >= 0 ? 'text-[#544431]' : 'text-rose-600'
                }`}>
                  {metrics.remainingProfit < 0 ? '-' : ''}{settings.currency} {Math.abs(metrics.remainingProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className="text-[10px] text-stone-400 mt-1">Net profit margin</div>
              </div>
            </div>

            {/* Total Customers */}
            <div className="bg-white border border-stone-150 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-[10px] font-mono tracking-wider font-semibold uppercase">Unique Guests</span>
                <div className="p-1.5 rounded-lg bg-stone-50 text-stone-605">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-xl font-display font-bold text-stone-950 font-mono">
                  {metrics.totalCustomersServed}
                </span>
                <p className="text-[10px] text-stone-400 mt-1">Loyals & Walk-Ins served</p>
              </div>
            </div>

            {/* Total Invoices */}
            <div className="bg-white border border-stone-150 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-[10px] font-mono tracking-wider font-semibold uppercase">Receipts Generated</span>
                <div className="p-1.5 rounded-lg bg-stone-50 text-stone-605">
                  <ReceiptIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-xl font-display font-bold text-stone-950 font-mono">
                  {metrics.receiptsCount}
                </span>
                <p className="text-[10px] text-stone-400 mt-1">Finalized registers</p>
              </div>
            </div>
          </div>

          {/* CRM & General Accounts CSV Export Hub */}
          <div className="bg-white border border-stone-150 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest font-extrabold text-[#B48A30] uppercase">Auditing & Compliance Export Console</span>
                <h3 className="text-sm font-display font-bold text-stone-900 uppercase tracking-wide">Generate & Download Business Reports</h3>
                <p className="text-stone-400 text-xs">Instantly compile real-time, filtered POS files optimized for QuickBooks & Excel integration.</p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 bg-stone-50 border border-stone-150 px-3 py-1.5 rounded-xl font-mono text-[9.5px] font-bold text-stone-600 uppercase">
                Active Audit Window: <span className="text-[#B48A30]">{timeRange}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Income Reports */}
              <button
                type="button"
                onClick={handleExportIncome}
                className="group flex flex-col justify-between p-4.5 bg-[#FCFBF8] hover:bg-[#FCF8E3]/25 border border-stone-200/80 hover:border-[#EDEAD6] rounded-xl text-left transition-all duration-200 cursor-pointer shadow-3xs hover:shadow-2xs"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-stone-100 text-stone-500 rounded-md">CSV</span>
                </div>
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-stone-900 leading-tight">Income Reports</h4>
                  <p className="text-[10px] text-stone-450 mt-1">Sales & receipt ledger logs matching the "{timeRange}" filter.</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-[#B48A30] pt-2 border-t border-stone-150/50 w-full group-hover:text-[#544431]">
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" /> Download Sheet
                  </span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>

              {/* Expense Reports */}
              <button
                type="button"
                onClick={handleExportExpenses}
                className="group flex flex-col justify-between p-4.5 bg-[#FCFBF8] hover:bg-[#FCF8E3]/25 border border-stone-200/80 hover:border-[#EDEAD6] rounded-xl text-left transition-all duration-200 cursor-pointer shadow-3xs hover:shadow-2xs"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-lg group-hover:scale-105 transition-transform">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-stone-100 text-stone-500 rounded-md">CSV</span>
                </div>
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-stone-900 leading-tight">Expense Reports</h4>
                  <p className="text-[10px] text-stone-450 mt-1">Salon bills, payouts, and utility vouchers logged in "{timeRange}".</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-[#B48A30] pt-2 border-t border-stone-150/50 w-full group-hover:text-[#544431]">
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" /> Download Sheet
                  </span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>

              {/* Transactions Reports */}
              <button
                type="button"
                onClick={handleExportTransactions}
                className="group flex flex-col justify-between p-4.5 bg-[#FCFBF8] hover:bg-[#FCF8E3]/25 border border-stone-200/80 hover:border-[#EDEAD6] rounded-xl text-left transition-all duration-200 cursor-pointer shadow-3xs hover:shadow-2xs"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-105 transition-transform">
                    <ReceiptIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-stone-100 text-stone-500 rounded-md">CSV</span>
                </div>
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-stone-900 leading-tight">Transactions Reports</h4>
                  <p className="text-[10px] text-stone-450 mt-1">Granular financial auditing trail matching active "{timeRange}" filter.</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-[#B48A30] pt-2 border-t border-stone-150/50 w-full group-hover:text-[#544431]">
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" /> Download Sheet
                  </span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>

              {/* Customer Reports */}
              <button
                type="button"
                onClick={handleExportCustomers}
                className="group flex flex-col justify-between p-4.5 bg-[#FCFBF8] hover:bg-[#FCF8E3]/25 border border-stone-200/80 hover:border-[#EDEAD6] rounded-xl text-left transition-all duration-200 cursor-pointer shadow-3xs hover:shadow-2xs"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 bg-[#FCF8E3]/50 text-[#B48A30] rounded-lg group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-stone-100 text-stone-500 rounded-md">CSV</span>
                </div>
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-stone-900 leading-tight">Customer Reports</h4>
                  <p className="text-[10px] text-stone-450 mt-1">CRM directory profiles and visit spending metrics.</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-[#B48A30] pt-2 border-t border-stone-150/50 w-full group-hover:text-[#544431]">
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" /> Download Sheet
                  </span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* Payment Method Balance tracker */}
          <div className="bg-white border border-stone-150 p-6 rounded-2xl shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-display font-bold text-stone-900 uppercase tracking-wide">Tender Balances Split</h3>
              <p className="text-stone-500 text-xs mt-0.5">Exact cash drawer amounts and dynamic e-wallet balances for safe operations</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              
              {/* Cash drawer */}
              <div className="bg-stone-50/75 border border-stone-200/50 p-4.5 rounded-xl space-y-3 overflow-hidden">
                <span className="text-[9px] uppercase font-mono tracking-wider text-stone-400 font-bold block truncate">Cash Register Drawer</span>
                <div className="flex gap-2.5 items-center min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Coins className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm xl:text-base font-mono font-bold text-stone-900 block truncate" title={`${settings.currency} ${metrics.cashTotal.toLocaleString()}`}>
                      {settings.currency} {metrics.cashTotal.toFixed(0)}
                    </span>
                    <p className="text-[9px] text-stone-400 leading-none truncate">Drawer Cash</p>
                  </div>
                </div>
                {/* Dynamic progress fill */}
                <div className="w-full bg-stone-200/50 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${metrics.totalSales > 0 ? (metrics.cashTotal / metrics.totalSales) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Easypaisa balance */}
              <div className="bg-stone-50/75 border border-stone-200/50 p-4.5 rounded-xl space-y-3 overflow-hidden">
                <span className="text-[9px] uppercase font-mono tracking-wider text-stone-400 font-bold block truncate">Easypaisa Split</span>
                <div className="flex gap-2.5 items-center min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Wallet className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm xl:text-base font-mono font-bold text-stone-900 block truncate" title={`${settings.currency} ${metrics.easypaisaTotal.toLocaleString()}`}>
                      {settings.currency} {metrics.easypaisaTotal.toFixed(0)}
                    </span>
                    <p className="text-[9px] text-stone-400 leading-none truncate">Mobile Wallet</p>
                  </div>
                </div>
                <div className="w-full bg-stone-200/50 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${metrics.totalSales > 0 ? (metrics.easypaisaTotal / metrics.totalSales) * 100 : 0}%` }} />
                </div>
              </div>

              {/* JazzCash balance */}
              <div className="bg-stone-50/75 border border-stone-200/50 p-4.5 rounded-xl space-y-3 overflow-hidden">
                <span className="text-[9px] uppercase font-mono tracking-wider text-stone-400 font-bold block truncate">JazzCash Split</span>
                <div className="flex gap-2.5 items-center min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                    <Wallet className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm xl:text-base font-mono font-bold text-stone-900 block truncate" title={`${settings.currency} ${metrics.jazzcashTotal.toLocaleString()}`}>
                      {settings.currency} {metrics.jazzcashTotal.toFixed(0)}
                    </span>
                    <p className="text-[9px] text-stone-400 leading-none truncate">Mobilink Wallet</p>
                  </div>
                </div>
                <div className="w-full bg-stone-200/50 h-1 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full rounded-full" style={{ width: `${metrics.totalSales > 0 ? (metrics.jazzcashTotal / metrics.totalSales) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Bank Transfer balance */}
              <div className="bg-stone-50/75 border border-stone-200/50 p-4.5 rounded-xl space-y-3 overflow-hidden">
                <span className="text-[9px] uppercase font-mono tracking-wider text-stone-400 font-bold block truncate">Bank Transfer Balance</span>
                <div className="flex gap-2.5 items-center min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Coins className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm xl:text-base font-mono font-bold text-stone-900 block truncate" title={`${settings.currency} ${metrics.bankTransferTotal.toLocaleString()}`}>
                      {settings.currency} {metrics.bankTransferTotal.toFixed(0)}
                    </span>
                    <p className="text-[9px] text-stone-400 leading-none truncate">Instant Bank Wire</p>
                  </div>
                </div>
                <div className="w-full bg-stone-200/50 h-1 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: `${metrics.totalSales > 0 ? (metrics.bankTransferTotal / metrics.totalSales) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Card payments */}
              <div className="bg-stone-50/75 border border-stone-200/50 p-4.5 rounded-xl space-y-3 overflow-hidden">
                <span className="text-[9px] uppercase font-mono tracking-wider text-stone-400 font-bold block truncate">Credit/Debit Card</span>
                <div className="flex gap-2.5 items-center min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm xl:text-base font-mono font-bold text-stone-900 block truncate" title={`${settings.currency} ${metrics.cardTotal.toLocaleString()}`}>
                      {settings.currency} {metrics.cardTotal.toFixed(0)}
                    </span>
                    <p className="text-[9px] text-stone-400 leading-none truncate">Merchant Outlets</p>
                  </div>
                </div>
                <div className="w-full bg-stone-200/50 h-1 rounded-full overflow-hidden">
                  <div className="bg-stone-600 h-full rounded-full" style={{ width: `${metrics.totalSales > 0 ? (metrics.cardTotal / metrics.totalSales) * 100 : 0}%` }} />
                </div>
              </div>

            </div>
          </div>

          {/* Quick graphical trends (Department / Category splits) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
            {/* Sales vs Expenses vertical comparative summary bar */}
            <div className="bg-white border border-stone-150 p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-display font-semibold text-stone-950">Revenue vs Outflows Balance Ratio</h3>
                <p className="text-stone-405 text-xs">Evaluating the operational efficiency ratio during selected date frame</p>
              </div>

              {(() => {
                const combined = metrics.totalSales + metrics.totalExpenses;
                const salesPct = combined > 0 ? (metrics.totalSales / combined) * 100 : 100;
                const expensesPct = combined > 0 ? (metrics.totalExpenses / combined) * 100 : 0;
                return (
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between text-xs font-mono font-semibold">
                      <span className="text-stone-800 flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" /> Incoming Revenue ({salesPct.toFixed(0)}%)
                      </span>
                      <span className="text-rose-600 flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Cash Outflows ({expensesPct.toFixed(0)}%)
                      </span>
                    </div>

                    <div className="w-full bg-stone-100 h-4 rounded-xl overflow-hidden flex">
                      <div className="bg-[#C5A059] h-full" style={{ width: `${salesPct}%` }} />
                      <div className="bg-rose-500 h-full" style={{ width: `${expensesPct}%` }} />
                    </div>

                    <p className="text-[11px] text-stone-500 italic bg-stone-55 p-3 rounded-lg border border-stone-100 leading-normal">
                      💡 Outflows consume approximately <strong className="font-mono text-stone-800">{expensesPct.toFixed(1)}%</strong> of your gross incoming sales receipts. Maintain strict checks on salon utilities and cosmetic stock purchases to protect profitability!
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Quick Informative guidelines */}
            <div className="bg-gradient-to-tr from-[#3D3120] to-[#2C2114] border border-[#544431]/30 p-6 rounded-2xl text-[#FCF8E3] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] uppercase tracking-widest font-mono text-[#D4AF37] font-extrabold font-bold">Audit Insights</span>
                  <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white">Live Station Sync OK</span>
                </div>
                <h3 className="text-sm font-display font-semibold text-white">Bél'Amour Compliance & Accounting</h3>
                <p className="text-[#C5B496] text-xs leading-relaxed mt-2">
                  This system tracks real business checkouts and real-time ledger records. All receipt logs, service fees, and staff advance deductions are logged securely. Deletions of registers are authorized to Admins and Managers for compliance audits.
                </p>
              </div>

              <div className="pt-4 border-t border-[#544431]/40 flex justify-between items-center font-mono text-[9px] text-[#A39174]">
                <span>LAST AUDIT SYNC: WEEKLY RECONCILED</span>
                <span>PK-LA05</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* CONDITIONAL SEGMENT B: DETAILED INCOME TABLE & SEARCH REGISTER */}
      {activeSegment === 'income' && (
        <div className="space-y-6 animate-in fade-in-30 duration-200">
          
          {/* Detailed Financial Overview Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Gross Services */}
            <div className="bg-[#FAF8F5] border border-stone-200/60 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-[10px] font-mono tracking-wider font-semibold uppercase">Gross Ticket Sales</span>
                <span className="text-[10px] uppercase font-mono bg-stone-200/50 text-stone-600 px-1.5 py-0.5 rounded font-bold scale-90">Invoiced</span>
              </div>
              <div className="mt-3">
                <span className="text-lg sm:text-xl font-display font-medium text-stone-900 font-mono">
                  {settings.currency} {metrics.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-stone-400 mt-0.5">Base prices before deductions</p>
              </div>
            </div>

            {/* Campaign Discounts */}
            <div className="bg-white border border-stone-200/60 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-[10px] font-mono tracking-wider font-semibold uppercase">Discounts Disbursed</span>
                <span className="text-[10px] uppercase font-mono bg-amber-50 text-[#B48A30] px-1.5 py-0.5 rounded font-bold scale-90">Campaigns</span>
              </div>
              <div className="mt-3">
                <span className="text-lg sm:text-xl font-display font-medium text-stone-900 font-mono text-amber-700">
                  -{settings.currency} {metrics.totalDiscounts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-stone-400 mt-0.5">Deductions and adjustments</p>
              </div>
            </div>

            {/* Sales Tax Collected */}
            <div className="bg-white border border-stone-200/60 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-[10px] font-mono tracking-wider font-semibold uppercase">Sales Tax (GST)</span>
                <span className="text-[10px] uppercase font-mono bg-[#FCF8E3]/60 text-[#3D3120] px-1.5 py-0.5 rounded font-bold scale-90">Government</span>
              </div>
              <div className="mt-3">
                <span className="text-lg sm:text-xl font-display font-medium text-stone-900 font-mono">
                  {settings.currency} {metrics.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-stone-400 mt-0.5">Sales tax pools</p>
              </div>
            </div>

            {/* Net Settle Revenue - Large colored highlight */}
            <div className="bg-gradient-to-tr from-[#3D3120] to-[#2C2114] border border-[#544431]/20 p-5 rounded-2xl text-[#FCF8E3] flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#C5B496] text-[10px] font-mono tracking-wider font-semibold uppercase">Net Settled Revenue</span>
                <span className="text-[9px] uppercase font-mono bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] px-1.5 py-0.5 rounded font-bold scale-90">Direct Capital</span>
              </div>
              <div className="mt-3">
                <span className="text-lg sm:text-2xl font-display font-bold text-white font-mono tracking-tight">
                  {settings.currency} {metrics.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[9.5px] text-[#C5B496] mt-0.5 leading-none">Net Liquid Cash Flow</p>
              </div>
            </div>

            {/* Average Ticket Value */}
            <div className="bg-white border border-stone-200/60 p-5 rounded-2xl flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 text-[10px] font-mono tracking-wider font-semibold uppercase">Average Visit Value</span>
                <span className="text-[10px] uppercase font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold scale-90">AOV</span>
              </div>
              <div className="mt-3">
                <span className="text-lg sm:text-xl font-display font-medium text-stone-900 font-mono">
                  {settings.currency} {metrics.avgReceiptSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-stone-400 mt-0.5">Average customer payment</p>
              </div>
            </div>

          </div>

          {/* Settle Details Breakdown Sub-Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Specialist / Therapist Leaderboard */}
            <div className="lg:col-span-6 bg-white border border-stone-200/60 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-display font-bold text-stone-900 uppercase tracking-wide">Specialist & Therapist Income Contribution</h3>
                <p className="text-stone-400 text-xs mt-0.5">Breakdown of gross sales sales attributed to treatment specialists</p>
              </div>

              {metrics.staffPerformance.length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center">No assigned therapist transactions logged in query timescale.</p>
              ) : (
                <div className="space-y-3.5">
                  {metrics.staffPerformance.map((staff, idx) => {
                    const pctOfNet = metrics.netRevenue > 0 ? (staff.net / metrics.netRevenue) * 100 : 0;
                    return (
                      <div key={staff.name || idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] font-bold bg-[#FCF8E3] text-[#3D3120] border border-[#EDEAD6] w-5 h-5 rounded-full flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-stone-850">{staff.name}</span>
                            <span className="text-[9.5px] text-stone-400 font-mono">({staff.count} tickets)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-stone-900">
                              {settings.currency} {staff.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="font-mono text-[9.5px] text-[#B48A30] ml-1.5 font-bold">
                              {pctOfNet.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        {/* Custom visual attribution progress bar */}
                        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#B48A30] h-full rounded-full transition-all"
                            style={{ width: `${pctOfNet}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Treatment Revenue Performance */}
            <div className="lg:col-span-6 bg-white border border-stone-200/60 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-display font-bold text-stone-900 uppercase tracking-wide">Popular Treatments Split</h3>
                <p className="text-stone-400 text-xs mt-0.5">Contribution splits and volume by specific beauty and spa services</p>
              </div>

              {metrics.popularServices.length === 0 ? (
                <p className="text-xs text-stone-400 py-6 text-center text-[#C5B496]">No treatments rendered in chosen timeframe.</p>
              ) : (
                <div className="space-y-2.5 max-h-[295px] overflow-y-auto pr-1">
                  {metrics.popularServices.slice(0, 6).map((srv, idx) => {
                    const totalSrvRevenue = metrics.popularServices.reduce((sum, s) => sum + s.revenue, 0);
                    const servicePct = totalSrvRevenue > 0 ? (srv.revenue / totalSrvRevenue) * 100 : 0;
                    return (
                      <div key={srv.name || idx} className="flex justify-between items-center text-xs py-2 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors px-1.5 rounded-lg">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-stone-900 truncate" title={srv.name}>{srv.name}</p>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-[#B48A30] block mt-0.5">{srv.category}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono font-bold text-stone-850">
                            {settings.currency} {srv.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-[9.5px] text-stone-400 font-mono font-semibold mt-0.5">
                            {srv.count} sales • {servicePct.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
          
          {/* Table Filters Panel */}
          <div className="bg-white border border-stone-200/60 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Search bar */}
            <div className="md:col-span-7 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Customer Name, Receipt ID, Services purchased..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full bg-[#FCFBF8] hover:bg-stone-50 text-stone-850 border border-stone-200 rounded-xl px-10 py-2.5 text-xs transition-all outline-none"
              />
            </div>

            {/* Method Filter */}
            <div className="md:col-span-5 flex items-center gap-3">
              <Filter className="w-4 h-4 text-stone-400 shrink-0" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full bg-[#FCFBF8] text-stone-850 hover:bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer font-medium outline-none"
              >
                <option value="All">All Payment Systems</option>
                <option value="Cash">Cash Drawer</option>
                <option value="Card">Visa/Mastercard Credit Cards</option>
                <option value="EasyPaisa/JazzCash">Easypaisa & JazzCash Wallets</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

          </div>

          {/* Income Table Data Container */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/75 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-display font-bold text-stone-900 uppercase tracking-wide">Live Register Ledger</h3>
                <p className="text-stone-400 text-[11px] mt-0.5">Showing matching rows in accordance with current timeframe filter: <strong className="uppercase font-semibold">{timeRange}</strong></p>
              </div>
              
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="font-mono text-[9px] text-[#544431] bg-[#FCF8E3] border border-[#EDEAD6] font-extrabold px-3 py-1.5 rounded-lg whitespace-nowrap">
                  {tableData.length} entries matching
                </span>
                {tableData.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportLedgerList}
                    className="flex items-center gap-1.5 bg-[#3D3120] hover:bg-[#544431] text-[#FCF8E3] text-[10.5px] uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-lg border border-[#3D3120]/10 transition-colors cursor-pointer shadow-3xs"
                    title="Export currently filtered list to CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                )}
              </div>
            </div>

            {tableData.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 mx-auto mb-3 border border-stone-100">
                  <ReceiptIcon className="w-6 h-6" />
                </div>
                <p className="text-stone-800 text-sm font-semibold">No transactions registered</p>
                <p className="text-stone-400 text-xs mt-1">Refine your search fields above or adjust your time period filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="border-b border-stone-150 text-stone-450 font-mono text-[9.5px] uppercase font-bold bg-stone-50/50">
                      <th className="py-3.5 px-5">Receipt ID</th>
                      <th className="py-3.5 px-5">Customer Profile</th>
                      <th className="py-3.5 px-5">Services Purchased</th>
                      <th className="py-3.5 px-5 text-center">Tender Method</th>
                      <th className="py-3.5 px-5 text-center">Visit Count</th>
                      <th className="py-3.5 px-5">Date and Time</th>
                      <th className="py-3.5 px-5 text-right">Total Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {tableData.map((rec) => {
                      // Lookup visit count and spending from customers state
                      const associatedCust = customers.find(c => c.id === rec.customerId);
                      const displayVisits = rec.customerId 
                        ? (associatedCust?.visitCount || '1') 
                        : 'Walk-In';

                      return (
                        <tr key={rec.id} className="hover:bg-stone-50/50 transition-colors">
                          {/* Receipt ID */}
                          <td className="py-3.5 px-5 font-mono font-bold text-stone-900 whitespace-nowrap">
                            {rec.receiptNo}
                          </td>
                          
                          {/* Customer Name */}
                          <td className="py-3.5 px-5 font-medium text-stone-850">
                            <div>
                              <p className="font-semibold text-stone-900">{rec.customerName}</p>
                              {rec.customerPhone && (
                                <p className="text-[10px] text-stone-400 font-mono mt-0.5">{rec.customerPhone}</p>
                              )}
                            </div>
                          </td>

                          {/* Services purchased list */}
                          <td className="py-3.5 px-5 text-stone-600 font-medium truncate max-w-xs" title={rec.services.map(s => `${s.quantity}x ${s.name}`).join(', ')}>
                            {rec.services.map(s => `${s.quantity}x ${s.name}`).join(', ')}
                          </td>

                          {/* Payment method */}
                          <td className="py-3.5 px-5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                              rec.paymentMethod.toLowerCase() === 'cash' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                              rec.paymentMethod.toLowerCase() === 'card' ? 'bg-sky-50 text-sky-800 border-sky-100' :
                              ['easypaisa', 'jazzcash'].includes(rec.paymentMethod.toLowerCase()) ? 'bg-pink-50 text-pink-800 border-pink-100' :
                              'bg-stone-100 text-stone-700 border-stone-200'
                            }`}>
                              {rec.paymentMethod}
                            </span>
                          </td>

                          {/* Customer historical visits */}
                          <td className="py-3.5 px-5 text-center font-mono font-bold text-stone-700">
                            {displayVisits}
                          </td>

                          {/* Date and time */}
                          <td className="py-3.5 px-5 text-stone-500 font-mono whitespace-nowrap">
                            {new Date(rec.date).toISOString().replace('T', ' ').substring(0, 16)}
                          </td>

                          {/* Total amount */}
                          <td className="py-3.5 px-5 text-right font-mono font-extrabold text-[#3D3120] text-sm whitespace-nowrap">
                            {settings.currency} {rec.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
