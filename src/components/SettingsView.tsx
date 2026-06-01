/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { PRIMARY_LOGO_SVG, SECONDARY_LOGO_SVG } from './BrandLogos';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Clock, 
  Settings as SettingsIcon, 
  KeyRound, 
  Stamp,
  Save,
  Trash,
  Globe,
  Facebook,
  Instagram,
  HeartHandshake,
  Upload,
  User,
  CheckCircle,
  FileText
} from 'lucide-react';
import { SalonSettings } from '../types';

interface SettingsViewProps {
  settings: SalonSettings;
  onUpdateSettings: (newSettings: SalonSettings) => void;
  showToaster: (msg: string) => void;
  onClearDatabase?: () => void;
  currentUser?: any;
  onUpdateUserProfile?: (updatedUser: any, passwordToUpdate?: string) => void;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  showToaster,
  onClearDatabase,
  currentUser,
  onUpdateUserProfile,
}: SettingsViewProps) {
  
  // Settings Form States
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [clearPassphrase, setClearPassphrase] = useState('');
  
  const [salonName, setSalonName] = useState(settings.salonName);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [taxRate, setTaxRate] = useState(settings.taxRate * 100); // convert decimal to percentage
  const [currency, setCurrency] = useState(settings.currency);
  const [openHours, setOpenHours] = useState(settings.openHours);
  
  // NEW ADMIN CONFIGS STATES
  const [complaintNumber, setComplaintNumber] = useState(settings.complaintNumber || '');
  const [websiteUrl, setWebsiteUrl] = useState(settings.websiteUrl || '');
  const [facebookLink, setFacebookLink] = useState(settings.facebookLink || '');
  const [instagramLink, setInstagramLink] = useState(settings.instagramLink || '');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber || '');
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');

  // Admin Profile States
  const [adminName, setAdminName] = useState(currentUser?.name || '');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || '');

  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAdminPassword = () => {
    try {
      const raw = localStorage.getItem('belamour-operators');
      if (raw && currentUser) {
        const list = JSON.parse(raw);
        const op = list.find((item: any) => item.id === currentUser.id);
        return op?.password || 'admin';
      }
    } catch(e) {}
    return 'admin';
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      salonName,
      phone,
      email,
      address,
      taxRate: taxRate / 100, // convert back to decimal
      currency,
      openHours,
      complaintNumber: complaintNumber.trim(),
      websiteUrl: websiteUrl.trim(),
      facebookLink: facebookLink.trim(),
      instagramLink: instagramLink.trim(),
      whatsappNumber: whatsappNumber.trim(),
      receiptFooter: receiptFooter.trim(),
      logoUrl
    });
    showToaster('Salon profile settings refreshed successfully');
  };

  const handleSaveAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim()) {
      showToaster("Admin credentials fields are mandatory.");
      return;
    }
    if (onUpdateUserProfile && currentUser) {
      onUpdateUserProfile({
        ...currentUser,
        name: adminName.trim(),
        email: adminEmail.trim()
      });
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToaster('Filing incomplete. Check all password requirements');
      return;
    }

    const actualOldPassword = getAdminPassword();
    if (oldPassword !== actualOldPassword) {
      showToaster('Incorrect current password token. Re-enter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToaster('Verification failed: Passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      showToaster('Security limit: Passphrase must be at least 4 characters');
      return;
    }

    if (onUpdateUserProfile && currentUser) {
      onUpdateUserProfile({
        ...currentUser
      }, newPassword);
      showToaster('Password lock rotated successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        showToaster("Upload cancelled: Logo image must be smaller than 1.5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoUrl(base64String);
        showToaster('Custom logo staged. Save below to apply!');
      };
      reader.readAsDataURL(file);
    }
  };

  const clearStagedLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToaster('Staged logo cleared. Default brand asset restored.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-display font-semibold text-stone-900">Workspace Configurations</h1>
        <p className="text-stone-400 text-xs mt-0.5">Customize local salon brand properties, thermal receipts, social handles, and security credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form: General Profile Properties (col-span-2) */}
        <div className="lg:col-span-2 bg-white border border-stone-100 rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-50">
            <h3 className="text-sm font-display font-semibold text-stone-950 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-stone-400" /> Salon Branding & Register defaults
            </h3>
            <span className="text-[9px] font-mono bg-stone-50 text-stone-500 font-bold px-2 py-0.5 rounded-md border border-stone-100">
              LEDGER MASTER
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            
            {/* Salon Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Salon Corporate Name *</label>
                <input
                  type="text"
                  required
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                  id="settings-salon-name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Operating Hours Overview *</label>
                <input
                  type="text"
                  required
                  value={openHours}
                  onChange={(e) => setOpenHours(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Contacts & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Brand Telephone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Concierge Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Physical Location Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none"
              />
            </div>

            {/* Calculations and tax parameterizing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Default Sales Tax (%) *</label>
                <input
                  type="number"
                  required
                  step={0.01}
                  min={0}
                  max={40}
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none font-mono"
                  id="settings-tax-rate"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Currency Symbol *</label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none text-center font-mono"
                />
              </div>
            </div>

            {/* NEW ADDITIONS - SOCIALS, SUPPORT, WEB & FOOTERS */}
            <div className="border-t border-stone-105 pt-5 space-y-4">
              <div>
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#B48A30] block">Additional Admin Properties</span>
                <p className="text-[#8F7657] text-[10px] mt-0.5">Control support hotlines, social community handles, and receipt layout footers</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5 text-stone-400" /> Support / Complaint Line
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0347 8361531"
                    value={complaintNumber}
                    onChange={(e) => setComplaintNumber(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-stone-400" /> Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://belamour-spa.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block flex items-center gap-1">
                    <Facebook className="w-3.5 h-3.5 text-stone-400" /> Facebook Link
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. facebook.com/belamour"
                    value={facebookLink}
                    onChange={(e) => setFacebookLink(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block flex items-center gap-1">
                    <Instagram className="w-3.5 h-3.5 text-stone-400" /> Instagram Handle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. @belamour_salonandspa"
                    value={instagramLink}
                    onChange={(e) => setInstagramLink(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block flex items-center gap-1 font-sans">
                    WhatsApp Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +92 333 1234567"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-stone-400" /> Thermal Receipt Footer custom line
                </label>
                <textarea
                  placeholder="e.g. YOUR BEAUTY & HEALTH ARE OUR PASSION"
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2.5 rounded-xl outline-none resize-none h-16"
                />
              </div>
            </div>

            {/* LOGO MANAGEMENT SECTION */}
            <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-5 mt-6 space-y-4">
              <div>
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-stone-900 block">Logo Management Suite</span>
                <p className="text-stone-400 text-[10.5px] mt-0.5">Upload a local image logo to brand custom dashboards, layouts, interfaces, and customer printed receipts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Custom Upload Block */}
                <div className="bg-white border border-stone-200/50 p-4 rounded-xl flex flex-col justify-between items-center text-center space-y-3">
                  <div className="w-full">
                    {logoUrl ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={logoUrl} 
                          className="max-h-20 object-contain p-1.5 border border-stone-200 rounded-lg bg-stone-50 shadow-xs" 
                          alt="Custom Uploaded Logo" 
                        />
                        <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/70 font-semibold mt-2.5 block">
                          ✓ CUSTOM LOGO ACTIVE
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-2 text-stone-400">
                        <Upload className="w-8 h-8 text-stone-300 mb-1 animate-pulse" />
                        <span className="text-[10px] font-mono font-medium">NO CUSTOM IMAGE</span>
                        <p className="text-[9.5px] text-stone-400 max-w-xs mt-0.5">Standard vector badges are currently used across forms.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 w-full pt-1.5">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 text-center text-[10px] font-bold px-3 py-2 bg-[#C5A059] text-white hover:bg-[#B48A30] rounded-xl transition-all cursor-pointer shadow-xs active:scale-97"
                    >
                      {logoUrl ? 'Replace Logo' : 'Upload Salon Logo'}
                    </button>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={clearStagedLogo}
                        className="text-center text-[10px] font-bold px-3 py-2 bg-stone-100 text-rose-600 hover:bg-rose-50 border border-stone-200 rounded-xl transition-all cursor-pointer"
                      >
                        Delete Logo
                      </button>
                    )}
                  </div>
                </div>

                {/* Legacy Co-Brand Preview Fallback details */}
                <div className="bg-white border border-stone-200/50 p-4 rounded-xl flex flex-col justify-between items-center text-center space-y-2">
                  <div className="flex items-center justify-center bg-stone-50 p-2 rounded-lg border border-stone-100" style={{ minHeight: '84px' }} dangerouslySetInnerHTML={{ __html: PRIMARY_LOGO_SVG }} />
                  <div>
                    <span className="text-[10px] font-bold text-stone-800 uppercase block">Fallback Core Vector</span>
                    <p className="text-[9.5px] text-stone-400 mt-0.5 leading-tight">Master brand badge shown on empty states and default receipt placeholders.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToaster('Underlying vector brand system remains locked as core fallback.')}
                    className="text-[9.5px] font-semibold px-3 py-1 bg-stone-50 border border-stone-200 rounded-lg text-stone-500 transition-all"
                  >
                    View Fallback Asset
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="text-right pt-2 border-t border-stone-100">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-850 text-white font-semibold py-2.5 px-6 rounded-xl text-xs sm:text-sm tracking-wider cursor-pointer transition-all active:scale-98"
                id="save-settings-btn"
              >
                <Save className="w-4 h-4" /> Save Brand Changes
              </button>
            </div>

          </form>

        </div>

        {/* Right Form Check: Account settings and security (col-span-1) */}
        <div className="flex flex-col gap-6">
          
          {/* Section 1: Update Admin Profile Information */}
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-stone-50">
              <h3 className="text-sm font-display font-semibold text-stone-950 flex items-center gap-1.5">
                <User className="w-4 h-4 text-stone-400" /> Admin Profile Info
              </h3>
            </div>

            <form onSubmit={handleSaveAdminProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-50block text-stone-500">Admin Staff Name *</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2 rounded-xl outline-none"
                  id="settings-admin-name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-50block text-stone-500">Login Username / Email *</label>
                <input
                  type="text"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2 rounded-xl outline-none"
                  id="settings-admin-email"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-750 font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer border border-stone-200/50"
                id="update-admin-profile-btn"
              >
                Update Profile Info
              </button>
            </form>
          </div>

          {/* Section 2: Change Admin Password */}
          <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-xs flex-1">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-stone-50">
              <h3 className="text-sm font-display font-semibold text-stone-950 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-stone-300" /> Change Password
              </h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Current Passphrase *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2 rounded-xl outline-none"
                  id="settings-old-pass"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">New Passphrase *</label>
                <input
                  type="password"
                  placeholder="Min 4 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2 rounded-xl outline-none"
                  id="settings-new-pass"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-500 block">Retype Passphrase *</label>
                <input
                  type="password"
                  placeholder="Retype password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-900 text-xs px-3.5 py-2 rounded-xl outline-none"
                  id="settings-confirm-pass"
                />
              </div>

              <div className="pt-1.5">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 bg-stone-900 text-white hover:bg-stone-850 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-md active:scale-97"
                  id="update-password-btn"
                >
                  Rotate Password Lock
                </button>
              </div>
            </form>
          </div>
          
        </div>

      </div>

      {/* Database Sweep Section */}
      <div className="bg-white border border-stone-100 rounded-2xl p-6 shadow-xs">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-stone-50">
          <h3 className="text-sm font-display font-semibold text-rose-950 flex items-center gap-1.5 font-bold">
            <Trash className="w-4 h-4 text-rose-500" /> Database Management & Memory Sweep
          </h3>
          <span className="text-[9px] font-mono bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-md border border-rose-100">
            DESTRUCTIVE ZONE
          </span>
        </div>
        
        <p className="text-xs text-stone-500 mb-4 leading-relaxed">
          Permanently delete all custom sales transactions, invoices, customer cards, and expense logs from this terminal's database. This will prepare the applet with standard, fresh ledger states. <strong>Services menu and branding configurations will be kept intact.</strong>
        </p>

        {!showConfirmClear ? (
          <button
            type="button"
            onClick={() => setShowConfirmClear(true)}
            className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-2.5 px-5 rounded-xl text-xs transition-all pointer-events-auto cursor-pointer border border-rose-200 font-bold"
          >
            <Trash className="w-4 h-4" /> Clear All Demo / Custom Data
          </button>
        ) : (
          <div className="bg-rose-50/50 border border-rose-200/60 p-4 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs font-bold text-rose-800">Are you absolutely sure you want to clear the entire log history?</p>
            <p className="text-[11px] text-stone-600">Type <span className="font-mono bg-white border border-stone-200 px-1 py-0.5 rounded font-bold text-stone-900 select-none">RESET</span> in the box below to confirm this action:</p>
            
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="RESET"
                value={clearPassphrase}
                onChange={(e) => setClearPassphrase(e.target.value)}
                className="bg-white border border-rose-200 focus:border-rose-500 font-mono text-xs px-3.5 py-2.5 rounded-xl outline-none uppercase w-48 shadow-xs"
              />
              <button
                type="button"
                disabled={clearPassphrase !== 'RESET'}
                onClick={() => {
                  if (onClearDatabase) {
                    onClearDatabase();
                  }
                  setShowConfirmClear(false);
                  setClearPassphrase('');
                }}
                className={`inline-flex items-center gap-1.5 font-bold py-2.5 px-5 rounded-xl text-xs transition-all tracking-wider ${
                  clearPassphrase === 'RESET' 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md' 
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                Confirm Wipe Now
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmClear(false);
                  setClearPassphrase('');
                }}
                className="px-4 py-2.5 text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
