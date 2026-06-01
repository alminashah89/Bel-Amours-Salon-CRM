/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  CircleDollarSign,
  TrendingUp, 
  TrendingDown,
  Users, 
  Receipt as ReceiptIcon, 
  ArrowUpRight, 
  Plus, 
  Settings as SettingsIcon, 
  Sparkles,
  UserPlus,
  Lock,
  Percent,
  Coins,
  ShieldAlert
} from 'lucide-react';
import { Customer, Service, Receipt, SalonSettings, Expense, User } from '../types';
import { PRIMARY_LOGO_SVG } from './BrandLogos';

interface DashboardViewProps {
  receipts: Receipt[];
  customers: Customer[];
  services: Service[];
  settings: SalonSettings;
  expenses: Expense[];
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export default function DashboardView({
  receipts,
  customers,
  services,
  settings,
  expenses = [],
  currentUser,
  onNavigate,
  onSelectCustomer
}: DashboardViewProps) {
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ date: string; value: number; x: number; y: number } | null>(null);

  // 1. Calculations
  const stats = useMemo(() => {
    // Total Revenue
    const totalRev = receipts.reduce((sum, r) => sum + r.total, 0);
    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Today Sales (using current local mock date 2026-05-21 as reference, let's treat receipts on May 20/21 or last 24h as today)
    // Looking at mock data.ts, newest was TX-10501 on 2026-05-20.
    // Let's calculate for receipts after 2026-05-19T00:00:00Z as "Today / Recent's" window
    const todayCutoff = new Date('2026-05-19T00:00:00Z');
    const todaySales = receipts
      .filter(r => new Date(r.date) >= todayCutoff)
      .reduce((sum, r) => sum + r.total, 0);

    const todayExpenses = expenses
      .filter(e => new Date(e.date) >= todayCutoff)
      .reduce((sum, e) => sum + e.amount, 0);

    const todayProfit = todaySales - todayExpenses;

    // Weekly Summary (Cutoff from May 15, 2026)
    const weekCutoff = new Date('2026-05-15T00:00:00Z');
    const weeklySales = receipts
      .filter(r => new Date(r.date) >= weekCutoff)
      .reduce((sum, r) => sum + r.total, 0);

    const weeklyExpenses = expenses
      .filter(e => new Date(e.date) >= weekCutoff)
      .reduce((sum, e) => sum + e.amount, 0);

    const weeklyProfit = weeklySales - weeklyExpenses;

    // Monthly Summary (Cutoff from May 01, 2026)
    const monthCutoff = new Date('2026-05-01T00:00:00Z');
    const monthlySales = receipts
      .filter(r => new Date(r.date) >= monthCutoff)
      .reduce((sum, r) => sum + r.total, 0);

    const monthlyExpenses = expenses
      .filter(e => new Date(e.date) >= monthCutoff)
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyProfit = monthlySales - monthlyExpenses;

    const totalCustomers = customers.length;
    const totalReceipts = receipts.length;

    return {
      totalRev,
      totalExp,
      todaySales,
      todayExpenses,
      todayProfit,
      weeklySales,
      weeklyExpenses,
      weeklyProfit,
      monthlySales,
      monthlyExpenses,
      monthlyProfit,
      totalCustomers,
      totalReceipts
    };
  }, [receipts, customers, expenses]);

  // 2. High-Fidelity SVG Sales Chart Data Builder (Last 10 Days)
  const chartData = useMemo(() => {
    // Collect dates from May 10 to May 21
    const dataMap: { [key: string]: number } = {};
    for (let i = 10; i <= 21; i++) {
      dataMap[`2026-05-${i}`] = 0;
    }

    receipts.forEach(r => {
      const dateStr = r.date.substring(0, 10); // e.g., "2026-05-15"
      if (dataMap[dateStr] !== undefined) {
        dataMap[dateStr] += r.total;
      }
    });

    const dataset = Object.keys(dataMap).sort().map(date => {
      const dayLabel = date.split('-')[2];
      return {
        dateString: date,
        label: `May ${dayLabel}`,
        amount: dataMap[date]
      };
    });

    return dataset;
  }, [receipts]);

  // SVG Chart Dimensions & Spline Calculations
  const chartWidth = 500;
  const chartHeight = 160;
  const maxVal = Math.max(...chartData.map(d => d.amount), 200) * 1.15;

  const points = useMemo(() => {
    const l = chartData.length;
    return chartData.map((d, i) => {
      const x = (i / (l - 1)) * (chartWidth - 40) + 20;
      const y = chartHeight - ((d.amount / maxVal) * (chartHeight - 40) + 20);
      return { x, y, ...d };
    });
  }, [chartData, maxVal]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let dStr = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      dStr += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return dStr;
  }, [points]);

  const fillD = useMemo(() => {
    if (points.length === 0) return '';
    return `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;
  }, [points, pathD]);

  // 3. Service Popularity distribution helper
  const popularServicesOutput = useMemo(() => {
    const countMap: { [key: string]: { name: string; count: number; totalRev: number } } = {};
    receipts.forEach(r => {
      r.services.forEach(item => {
        if (!countMap[item.id]) {
          countMap[item.id] = { name: item.name, count: 0, totalRev: 0 };
        }
        countMap[item.id].count += item.quantity;
        countMap[item.id].totalRev += item.price * item.quantity;
      });
    });

    return Object.values(countMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [receipts]);

  // 4. Recent activity (Latest 4 receipts)
  const recentReceipts = useMemo(() => {
    return [...receipts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [receipts]);

  // 5. Recent registered clients (Last 4)
  const recentCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [customers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Banner / Operational Greeting */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-stone-200 p-6 rounded-2xl text-stone-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <svg className="w-24 h-24 text-[#B48A30]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
        </div>
        <div className="z-10">
          <span className="text-[#B48A30] font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B48A30]" /> Salon Concierge & Billing Suite
          </span>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                className="w-12 h-12 rounded-xl object-contain border border-stone-200 bg-stone-50 p-1 shrink-0" 
                alt="Custom Brand Logo" 
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 p-1 flex items-center justify-center shrink-0"
                dangerouslySetInnerHTML={{ __html: PRIMARY_LOGO_SVG.replace('width="70"', 'width="38"').replace('height="70"', 'height="38"') }}
              />
            )}
            <h1 className="text-2xl font-display font-semibold text-stone-950">Hello, {settings.salonName}</h1>
          </div>
          <p className="text-stone-500 text-xs mt-1 max-w-xl">
            Welcome to your unified front desk. Track live transactions, manage client histories, and fast-track guest checkouts with zero friction.
          </p>
        </div>
        <div className="flex gap-2 z-10">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#B48A30] text-white font-semibold px-4 py-2.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-gold-500/10 cursor-pointer active:scale-98"
            id="quick-pos-billing-btn"
          >
            <Plus className="w-4 h-4" />
            New Checkout
          </button>
          <button
            onClick={() => onNavigate('customers')}
            className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 text-[#B48A30] border border-stone-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="metric-cards-parent">
        
        {/* Metric Card 1: Today Sales */}
        <div className="bg-white border border-stone-150 p-5 rounded-2xl shadow-xs hover:border-stone-200 transition-all flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-stone-400 text-xs font-mono tracking-wider font-semibold uppercase">Today's Sales</span>
            <div className="text-2xl font-display font-semibold text-stone-900">
              {settings.currency}{stats.todaySales.toFixed(2)}
            </div>
            <div className="text-[10px] text-[#B48A30] font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Live billing rate
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gold-100/50 border border-gold-200/50 flex items-center justify-center text-[#B48A30]">
            <CircleDollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric Card 2: Today Expenses */}
        <div className="bg-white border border-stone-150 p-5 rounded-2xl shadow-xs hover:border-stone-200 transition-all flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-stone-400 text-xs font-mono tracking-wider font-semibold uppercase">Today's Expenses</span>
            {currentUser?.role === 'Cashier' ? (
              <div className="flex items-center gap-1.5 text-stone-400 font-medium text-xs mt-2 font-mono">
                <Lock className="w-3.5 h-3.5 text-[#B48A30]" /> Restricted
              </div>
            ) : (
              <>
                <div className="text-2xl font-display font-semibold text-stone-900">
                  {settings.currency}{stats.todayExpenses.toFixed(2)}
                </div>
                <p className="text-[10px] text-stone-500 font-mono">Managed outflows</p>
              </>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Metric Card 3: Remaining Profit */}
        <div className={`border p-5 rounded-2xl shadow-xs transition-all flex justify-between items-start ${
          currentUser?.role === 'Cashier' ? 'bg-white border-stone-150' : 
          stats.todayProfit >= 0 ? 'bg-[#FCF8E3]/35 border-[#EDEAD6]' : 'bg-rose-50/25 border-rose-100'
        }`}>
          <div className="space-y-2">
            <span className="text-stone-400 text-xs font-mono tracking-wider font-semibold uppercase">Remaining Profit</span>
            {currentUser?.role === 'Cashier' ? (
              <div className="flex items-center gap-1.5 text-stone-400 font-medium text-xs mt-2 font-mono">
                <Lock className="w-3.5 h-3.5 text-[#B48A30]" /> Restricted
              </div>
            ) : (
              <>
                <div className={`text-2xl font-display font-bold ${
                  stats.todayProfit >= 0 ? 'text-[#544431]' : 'text-rose-600'
                }`}>
                  {stats.todayProfit < 0 ? '-' : ''}{settings.currency}{Math.abs(stats.todayProfit).toFixed(2)}
                </div>
                <div className="text-[10px] flex items-center gap-0.5">
                  {stats.todayProfit >= 0 ? (
                    <span className="text-[#B48A30] font-semibold">Net Surplus Balance</span>
                  ) : (
                    <span className="text-rose-500 font-semibold">Net Deficit State</span>
                  )}
                </div>
              </>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            currentUser?.role === 'Cashier' ? 'bg-stone-50 border border-stone-150 text-stone-450' :
            stats.todayProfit >= 0 ? 'bg-[#FCF8E3] border border-[#C5A059]/30 text-[#B48A30]' : 'bg-rose-100 border border-rose-200 text-rose-600'
          }`}>
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Metric Card 4: Total Customers */}
        <div className="bg-white border border-stone-150 p-5 rounded-2xl shadow-xs hover:border-stone-200 transition-all flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-stone-400 text-xs font-mono tracking-wider font-semibold uppercase">Total Customers</span>
            <div className="text-2xl font-display font-semibold text-stone-900">
              {stats.totalCustomers}
            </div>
            <p className="text-[10px] text-stone-400">Aura loyalty enrollments</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Business Performance & Financial Analytics */}
      <div className="bg-white border border-stone-150 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-display font-bold text-stone-900 uppercase tracking-wide">Business Financial Performance</h3>
            <p className="text-stone-400 text-xs mt-0.5">Calculated trailing metrics for daily, weekly and monthly earnings vs cash outflows</p>
          </div>
          <span className="text-[10px] font-mono bg-[#FCF8E3]/55 text-[#544431]/80 font-bold px-2.5 py-1 rounded-md border border-[#EDEAD6]">
            AUDITED LEDGER STATUS
          </span>
        </div>

        {currentUser?.role === 'Cashier' ? (
          <div className="bg-stone-50 border border-stone-200 p-8 rounded-xl flex flex-col items-center text-center justify-center space-y-2">
            <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-[#B48A30]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold text-stone-850">Analytical Summary Restricted</h4>
            <p className="text-stone-400 text-[10px] max-w-sm">Summary profit sheets are restricted to Managers & Admins. Contact Bél'Amour managers for financial audits.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Weekly Summary Card */}
            <div className="bg-stone-50/75 border border-stone-200/60 p-4.5 rounded-xl space-y-4 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-400 tracking-wider">Weekly Overview (May 15+)</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <span className="text-stone-500 shrink-0">Sales Received:</span>
                  <span className="font-mono font-bold text-[#3D3120]">{settings.currency}{stats.weeklySales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <span className="text-stone-500 shrink-0">Expenses Deducted:</span>
                  <span className="font-mono font-bold text-rose-600 font-medium">-{settings.currency}{stats.weeklyExpenses.toFixed(2)}</span>
                </div>
                <div className="border-t border-stone-200/50 pt-2 flex justify-between items-center gap-2 flex-wrap">
                  <span className="font-bold text-stone-700 shrink-0">Remaining Profit:</span>
                  <span className={`font-mono font-extrabold text-right shrink-0 ${stats.weeklyProfit >= 0 ? 'text-[#B48A30]' : 'text-rose-600'}`}>
                    {stats.weeklyProfit < 0 ? '-' : ''}{settings.currency}{Math.abs(stats.weeklyProfit).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Summary Card */}
            <div className="bg-stone-50/75 border border-stone-200/60 p-4.5 rounded-xl space-y-4 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-400 tracking-wider">Monthly Overview (May 01+)</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <span className="text-stone-500 shrink-0">Sales Received:</span>
                  <span className="font-mono font-bold text-[#3D3120]">{settings.currency}{stats.monthlySales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <span className="text-stone-500 shrink-0">Expenses Deducted:</span>
                  <span className="font-mono font-bold text-rose-600 font-medium">-{settings.currency}{stats.monthlyExpenses.toFixed(2)}</span>
                </div>
                <div className="border-t border-stone-200/50 pt-2 flex justify-between items-center gap-2 flex-wrap">
                  <span className="font-bold text-stone-700 shrink-0">Remaining Profit:</span>
                  <span className={`font-mono font-extrabold text-right shrink-0 ${stats.monthlyProfit >= 0 ? 'text-[#B48A30]' : 'text-rose-600'}`}>
                    {stats.monthlyProfit < 0 ? '-' : ''}{settings.currency}{Math.abs(stats.monthlyProfit).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sales vs Expenses Comparison Chart Card */}
            <div className="border border-[#EDEAD6] bg-[#FCF8E3]/15 p-4.5 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-stone-405 tracking-wider">Outflow Ratio (Weekly)</span>
              
              <div className="space-y-3 mt-2">
                {/* Visual Side-by-Side comparison of sales vs expenses */}
                {(() => {
                  const totalSum = stats.weeklySales + stats.weeklyExpenses;
                  const salesPercent = totalSum > 0 ? (stats.weeklySales / totalSum) * 100 : 100;
                  const expensePercent = totalSum > 0 ? (stats.weeklyExpenses / totalSum) * 100 : 0;
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-stone-605 font-bold">Sales ({salesPercent.toFixed(0)}%)</span>
                        <span className="text-rose-600 font-bold">Outflow ({expensePercent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-[#C5A059] h-full transition-all duration-500"
                          style={{ width: `${salesPercent}%` }}
                        />
                        <div 
                          className="bg-rose-500 h-full transition-all duration-500"
                          style={{ width: `${expensePercent}%` }}
                        />
                      </div>
                      <p className="text-[8px] text-stone-400 font-mono mt-1 text-center">
                        Outflows map to {expensePercent.toFixed(0)}% of weekly cash inputs
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Dashboard Interactive Charts/Analytics & Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive SVG Trend Chart Panel */}
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-xs lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-display font-semibold text-stone-950">Daily Revenue Timeline</h3>
              <p className="text-stone-400 text-xs mt-0.5">Tracking sales velocity over the recent 10 operating days</p>
            </div>
            <span className="text-[10px] font-mono bg-stone-50 text-stone-500 font-semibold px-2 py-1 rounded-md border border-stone-100">
              MAY 10 - MAY 21
            </span>
          </div>

          {/* Interactive SVG Area Chart */}
          <div className="relative pt-2">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 select-none overflow-visible"
            >
              {/* Grid Lines */}
              <line x1="20" y1="20" x2={chartWidth-20} y2="20" stroke="#f4f4f5" strokeWidth="1" />
              <line x1="20" y1="60" x2={chartWidth-20} y2="60" stroke="#f4f4f5" strokeWidth="1" />
              <line x1="20" y1="100" x2={chartWidth-20} y2="100" stroke="#f4f4f5" strokeWidth="1" />
              <line x1="20" y1="140" x2={chartWidth-20} y2="140" stroke="#f5f5f4" strokeWidth="1" />

              {/* Shaded Area fill */}
              <path 
                d={fillD} 
                fill="url(#goldGradient)" 
                className="transition-all duration-300"
              />

              {/* Outline Path */}
              <path 
                d={pathD} 
                fill="none" 
                stroke="#C5A059" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                className="transition-all duration-300"
              />

              {/* Data Knots */}
              {points.map((p, index) => (
                <g key={index} className="cursor-pointer group">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredDataPoint?.dateString === p.dateString ? "5" : "3.5"}
                    fill={hoveredDataPoint?.dateString === p.dateString ? "#B48A30" : "#C5A059"}
                    className="transition-all"
                    onMouseEnter={() => setHoveredDataPoint({ date: p.label, value: p.amount, x: p.x, y: p.y })}
                    onMouseLeave={() => setHoveredDataPoint(null)}
                  />
                </g>
              ))}

              {/* X Axis Labels */}
              {points.filter((_, i) => i % 2 === 0).map((p, index) => (
                <text
                  key={index}
                  x={p.x}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  className="fill-stone-400 font-mono text-[8px]"
                >
                  {p.label}
                </text>
              ))}

              {/* Definitions for gorgeous fill gradient */}
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C5A059" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#C5A059" stopOpacity="0.01" />
                </linearGradient>
              </defs>
            </svg>

            {/* Hover Tooltip overlay */}
            {hoveredDataPoint && (
              <div 
                className="absolute bg-stone-900 text-white rounded-lg p-2.5 shadow-md border border-white/10 text-xs font-mono select-none"
                style={{
                  left: `${(hoveredDataPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredDataPoint.y / chartHeight) * 100 - 45}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="text-[10px] text-stone-400 leading-none">{hoveredDataPoint.date}</div>
                <div className="text-gold-200 font-semibold mt-1">
                  {settings.currency}{hoveredDataPoint.value.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popular Services & Special Offers Panel */}
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-xs">
          <div className="mb-5">
            <h3 className="text-base font-display font-semibold text-stone-950">Popular Services</h3>
            <p className="text-stone-400 text-xs mt-0.5">Top-performing salon treatments by sales volume</p>
          </div>

          <div className="space-y-4">
            {popularServicesOutput.map((item, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-stone-850 truncate max-w-[190px]">{item.name}</span>
                  <span className="font-mono text-stone-400 text-[10px]">{item.count} checkouts</span>
                </div>
                {/* Horizontal Bar Chart representation */}
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gold-500 h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min((item.count / Math.max(...popularServicesOutput.map(r => r.count))) * 100, 100)}%` 
                    }}
                  />
                </div>
                <div className="text-[9px] text-stone-500 flex justify-between font-mono">
                  <span>Category Revenue</span>
                  <span className="text-stone-700">{settings.currency}{item.totalRev.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-stone-50">
            <div className="bg-gradient-to-br from-gold-50 to-gold-100/30 p-4 rounded-xl border border-gold-200 text-xs leading-relaxed">
              <span className="font-semibold text-gold-900 block mb-1">💡 Daily Analytics tip</span>
              <span className="text-stone-600 block">
                Haircut checkouts remain the baseline driver. Cross-sell facials or therapy add-ons to increase service tickets by up to 25%!
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity Sections & Dynamic Table Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Transactions Feed */}
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-stone-950">Recent Transactions</h3>
              <p className="text-stone-400 text-xs mt-0.5">Live transaction log compiled from register billing</p>
            </div>
            <button 
              onClick={() => onNavigate('receipts')}
              className="text-xs text-stone-500 hover:text-stone-850 flex items-center gap-0.5 font-medium cursor-pointer"
            >
              See Receipts <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-50">
            {recentReceipts.map((rec) => (
              <div key={rec.id} className="py-3 flex items-center justify-between group hover:bg-stone-50/50 px-1 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-stone-50 border border-stone-100 font-mono rounded-lg flex items-center justify-center text-stone-600 text-xs">
                    TX
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-850">{rec.customerName}</div>
                    <div className="text-[10px] text-stone-400 flex items-center gap-1">
                      <span>{rec.receiptNo}</span>
                      <span>•</span>
                      <span>{rec.services.length} items</span>
                      <span>•</span>
                      <span>{rec.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-stone-900 font-mono">
                    {settings.currency}{rec.total.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono block">
                    {new Date(rec.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Loyals Registered Feed */}
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-stone-950">Loyalty Program enrollments</h3>
              <p className="text-stone-400 text-xs mt-0.5">Recently registered salon clients</p>
            </div>
            <button 
              onClick={() => onNavigate('customers')}
              className="text-xs text-stone-500 hover:text-stone-850 flex items-center gap-0.5 font-medium cursor-pointer"
            >
              Customer Hub <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-50">
            {recentCustomers.map((cust) => (
              <div 
                key={cust.id} 
                className="py-3 flex items-center justify-between group hover:bg-stone-50/50 px-1 rounded-xl transition-colors cursor-pointer"
                onClick={() => onSelectCustomer(cust)}
                title="View customer profile"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gold-50 border border-gold-200 font-display font-semibold text-xs text-gold-700 flex items-center justify-center">
                    {cust.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-stone-850 truncate">{cust.name}</div>
                    <div className="text-[10px] text-stone-400 flex items-center gap-1 truncate">
                      <span>{cust.phone}</span>
                      <span>•</span>
                      <span className="lowercase">{cust.email}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-stone-900 font-mono">
                    {statusStr(cust.totalSpending)}
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono block">
                    {cust.visitCount} visits
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );

  function statusStr(sum: number): string {
    return `${settings.currency}${sum.toFixed(2)}`;
  }
}
