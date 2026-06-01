/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Wifi, 
  ChevronDown, 
  Menu,
  Clock,
  Sparkle
} from 'lucide-react';
import { User, SalonSettings } from '../types';
import { PRIMARY_LOGO_SVG } from './BrandLogos';

interface HeaderProps {
  user: User | null;
  settings: SalonSettings;
  onNavigate: (view: string) => void;
  onMobileMenuToggle: () => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (val: string) => void;
  showToaster: (msg: string) => void;
  onLogout?: () => void;
}

export default function Header({
  user,
  settings,
  onNavigate,
  onMobileMenuToggle,
  globalSearchQuery,
  setGlobalSearchQuery,
  showToaster,
  onLogout,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // High-fidelity Mock Alerts
  const notifications = [
    { id: 1, text: 'New walk-in registered: Guest (Sam)', time: '12 mins ago', unread: true },
    { id: 2, text: 'Receipt TX-10501 sent to printer', time: '1 hr ago', unread: false },
    { id: 3, text: 'Eleanor Vance updated customer notes', time: '3 hrs ago', unread: false },
  ];

  const handleGlobalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalSearchQuery(e.target.value);
    // If we're not inside the customers view or POS view, typing in the search bar should automatically navigate to Customers to optimize checkout!
    // This is super receptionist-friendly!
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      showToaster(`Filtering directories for: "${globalSearchQuery}"`);
      onNavigate('customers');
    }
  };

  return (
    <header className="sticky top-0 w-full h-16 bg-white/85 backdrop-blur-md border-b border-stone-100 flex items-center justify-between px-6 z-20">
      
      {/* Brand logo, search, and mobile toggle */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button 
          onClick={onMobileMenuToggle}
          className="p-2 -ml-1.5 hover:bg-stone-50 rounded-lg md:hidden text-stone-600 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dashboard Top Header Brand Logo */}
        <div className="flex items-center gap-2 select-none shrink-0">
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              className="w-8 h-8 shrink-0 select-none object-contain bg-stone-50 rounded-full border border-stone-200 p-0.5" 
              alt="Salon Logo" 
            />
          ) : (
            <div className="w-8 h-8 flex items-center justify-center shrink-0" dangerouslySetInnerHTML={{ __html: PRIMARY_LOGO_SVG.replace('width="70"', 'width="30"').replace('height="70"', 'height="30"') }} />
          )}
          <span className="font-serif font-semibold tracking-wide text-xs text-stone-800 uppercase hidden sm:block">BEL'AMOUR</span>
        </div>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search VIP customers, phone, or invoices... (Enter)"
            value={globalSearchQuery}
            onChange={handleGlobalSearchChange}
            onKeyDown={handleSearchKeyPress}
            className="w-full bg-stone-50 border border-stone-200 hover:border-stone-300 focus:border-stone-900 focus:bg-white text-stone-850 placeholder-stone-400 text-sm pl-10 pr-4 py-2 rounded-xl transition-all outline-none"
            id="global-search-input"
          />
        </div>
      </div>

      {/* Meta Indicators, Offline Sync Status, and Notification widgets */}
      <div className="flex items-center gap-4">
        
        {/* Sync Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-stone-50 border border-stone-100 rounded-lg text-xs font-mono text-stone-500">
          <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>CLOUD SYNCED</span>
        </div>

        {/* Local Clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 bg-stone-50 border border-stone-100 rounded-lg font-mono">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          <span>POS ACTIVE</span>
        </div>

        {/* Notifications Icon with Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-stone-50 text-stone-600 rounded-xl relative cursor-pointer"
            id="notifications-bell-btn"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in duration-200">
              <div className="px-4 py-2 border-b border-stone-50 flex justify-between items-center">
                <span className="font-display font-medium text-xs tracking-wider uppercase text-stone-400">Notifications</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">New Alerts</span>
              </div>
              <div className="divide-y divide-stone-50 max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3.5 hover:bg-stone-50 text-xs transition-colors cursor-pointer">
                    <p className={`text-stone-800 ${notif.unread ? 'font-medium' : ''}`}>{notif.text}</p>
                    <span className="text-[10px] text-stone-400 block mt-1">{notif.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-stone-50 text-center">
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    showToaster('Cleared notification stack');
                  }}
                  className="text-stone-500 hover:text-stone-800 text-[11px] font-medium"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropper (Receptionist Info) */}
        {user && (
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:bg-stone-50 p-1.5 rounded-xl transition-all cursor-pointer"
              id="header-profile-dropdown"
            >
              <div className="w-8 h-8 rounded-full bg-gold-600 flex items-center justify-center text-white font-display font-medium text-xs">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="text-xs font-semibold text-stone-700 hidden sm:block">{user.name.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in duration-150">
                <div className="px-4 py-2 border-b border-stone-50">
                  <div className="text-xs font-semibold text-stone-800">{user.name}</div>
                  <div className="text-[10px] text-stone-400">{user.email}</div>
                </div>
                
                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                >
                  Salon Profile Settings
                </button>

                <button 
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('reports');
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                >
                  Sales Performance Metrics
                </button>

                {onLogout && (
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors border-t border-stone-100 font-semibold"
                  >
                    Close Session (Sign Out)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}
