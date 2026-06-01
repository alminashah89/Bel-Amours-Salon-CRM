/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Columns3, 
  Users, 
  WalletCards, 
  Sparkle, 
  History, 
  TrendingUp, 
  Settings as SettingsIcon, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Coins
} from 'lucide-react';
import { User, SalonSettings } from '../types';
import { PRIMARY_LOGO_SVG } from './BrandLogos';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: User | null;
  onLogout: () => void;
  settings: SalonSettings;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  mobileMenuOpen?: boolean;
}

export default function Sidebar({
  currentView,
  onNavigate,
  user,
  onLogout,
  settings,
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileMenuOpen = false,
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Columns3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'pos', label: 'POS Billing', icon: WalletCards, badge: 'FAST' },
    { id: 'services', label: 'Services', icon: Sparkle },
    { id: 'receipts', label: 'Receipts History', icon: History },
    { id: 'expenses', label: 'Expenses', icon: Coins },
    ...(user && (user.role === 'Admin' || user.role === 'Manager') ? [
      { id: 'reports', label: 'Reports', icon: TrendingUp },
      { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ] : []),
  ];

  return (
    <aside 
      className={`fixed top-0 bottom-0 left-0 bg-[#3D3120] border-r border-[#544431]/40 z-30 transition-all duration-300 flex flex-col justify-between md:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'
      } ${
        sidebarCollapsed ? 'md:w-20' : 'md:w-64'
      } w-64`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-6 mb-4 flex items-center justify-between border-b border-[#544431]/40">
          <div className="flex items-center gap-2 overflow-hidden">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                className="w-10 h-10 shrink-0 select-none object-contain bg-white rounded-full border border-white/20 p-0.5" 
                alt="Salon Logo" 
              />
            ) : (
              <div 
                className="w-10 h-10 shrink-0 select-none flex items-center justify-center overflow-hidden bg-white rounded-full border border-white/20 p-0.5" 
                dangerouslySetInnerHTML={{ 
                  __html: PRIMARY_LOGO_SVG
                    .replace('width="70"', 'width="34"')
                    .replace('height="70"', 'height="34"')
                    .replaceAll('#2c1e13', '#FCF8E3')
                    .replaceAll('#c5a059', '#D4AF37')
                }} 
              />
            )}
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="min-w-0 leading-tight">
                <h1 className="text-sm font-bold tracking-tight text-white uppercase truncate">
                  {settings.salonName}
                </h1>
                <p className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold mt-0.5">
                  Premium Salon OS
                </p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-white/5 text-stone-300 hover:text-[#D4AF37] rounded-lg hidden md:block cursor-pointer transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
 
        {/* Navigation Actions */}
        <nav className="px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm font-medium transition-all group relative cursor-pointer ${
                  isActive 
                    ? 'bg-white text-[#3D3120] font-bold shadow-md' 
                    : 'text-stone-200 hover:bg-white/5 hover:text-white'
                }`}
                id={`sidebar-link-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-[18px] h-[18px] transition-transform group-hover:scale-105 ${
                    isActive ? 'text-[#B48A30]' : 'text-[#C5B496] group-hover:text-[#D4AF37]'
                  }`} />
                  {(!sidebarCollapsed || mobileMenuOpen) && <span>{item.label}</span>}
                </div>
                
                {item.badge && (!sidebarCollapsed || mobileMenuOpen) && (
                  <span className={`text-[10px] font-mono tracking-wider font-semibold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-[#3D3120]/10 text-[#3D3120]' : 'bg-[#544431] text-[#D4AF37]'
                  }`}>
                    {item.badge}
                  </span>
                )}
 
                {/* Tooltip for collapsed mode */}
                {sidebarCollapsed && !mobileMenuOpen && (
                  <div className="absolute left-18 bg-stone-950 text-white text-xs py-1.5 px-3 rounded-lg shadow-md opacity-0 scale-90 translate-x-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 pointer-events-none transition-all z-40 whitespace-nowrap font-sans">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
 
      {/* User Session Footer */}
      {user && (
        <div className="mt-auto p-4 shrink-0">
          <div className="p-4 bg-[#4F402C] rounded-2xl border border-[#544431]/50 text-stone-200">
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <p className="text-[10px] font-semibold text-stone-300 mb-2 uppercase tracking-wide">Shift: Morning</p>
            )}
            <div className="flex items-center justify-between gap-3 overflow-hidden">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#B48A30] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                {(!sidebarCollapsed || mobileMenuOpen) && (
                  <div className="min-w-0 flex flex-col">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <span className={`inline-block py-0.5 px-1.5 rounded-md text-[9px] font-mono font-semibold uppercase mt-0.5 max-w-max leading-tight tracking-wider ${
                      user.role === 'Admin' || user.role === 'Manager'
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        : 'bg-amber-500/10 text-amber-200 border border-amber-500/20'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                )}
              </div>
 
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <button 
                  onClick={onLogout}
                  className="p-1.5 hover:bg-white/5 text-stone-300 hover:text-rose-400 rounded-lg transition-all cursor-pointer border border-transparent hover:border-[#544431]"
                  title="Log out"
                  id="sidebar-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
            {sidebarCollapsed && !mobileMenuOpen && (
              <button 
                onClick={onLogout}
                className="w-full mt-3 flex justify-center py-2 text-[#D4AF37] hover:text-rose-400 hover:bg-white/5 border border-transparent rounded-lg transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
