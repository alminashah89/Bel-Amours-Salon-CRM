/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Clock, 
  Trash2, 
  Edit2, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  X,
  Tag
} from 'lucide-react';
import { Service, SalonSettings, User } from '../types';

interface ServicesViewProps {
  services: Service[];
  settings: SalonSettings;
  currentUser: User | null;
  onAddService: (service: Omit<Service, 'id'>) => void;
  onEditService: (service: Service) => void;
  onDeleteService: (id: string) => void;
  showToaster: (msg: string) => void;
}

export default function ServicesView({
  services,
  settings,
  currentUser,
  onAddService,
  onEditService,
  onDeleteService,
  showToaster,
}: ServicesViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Active editing state
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hair Cut & Styling');
  const [price, setPrice] = useState(65);
  const [duration, setDuration] = useState(45);
  const [isActive, setIsActive] = useState(true);

  // Category Options
  const categories = [
    'Hair Cut & Styling',
    'Color & Highlights',
    'Skin & Facials',
    'Massage & Therapy',
    'Nails Care'
  ];

  // Filters services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                            s.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, search, selectedCategory]);

  const openAddForm = () => {
    setName('');
    setCategory('Hair Cut & Styling');
    setPrice(75);
    setDuration(45);
    setIsActive(true);
    setShowAddModal(true);
  };

  const openEditForm = (srv: Service) => {
    setEditingService(srv);
    setName(srv.name);
    setCategory(srv.category);
    setPrice(srv.price);
    setDuration(srv.durationMinutes);
    setIsActive(srv.isActive);
    setShowEditModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddService({
      name,
      category,
      price,
      durationMinutes: duration,
      isActive,
    });
    setShowAddModal(false);
    showToaster(`Created service entry: ${name}`);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !name.trim()) return;
    onEditService({
      id: editingService.id,
      name,
      category,
      price,
      durationMinutes: duration,
      isActive,
    });
    setShowEditModal(false);
    showToaster(`Updated service entry: ${name}`);
  };

  const handleToggleActive = (srv: Service) => {
    onEditService({
      ...srv,
      isActive: !srv.isActive
    });
    showToaster(`${srv.name} status updated to ${!srv.isActive ? 'Active' : 'Inactive'}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Head actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-display font-semibold text-stone-900">Salon Treatment Menu</h1>
          <p className="text-stone-400 text-xs mt-0.5">Define master service catalog, booking durations, prices, and online status</p>
        </div>

        {(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-850 text-white font-medium py-2.5 px-4 rounded-xl text-xs sm:text-sm tracking-wide cursor-pointer transition-all active:scale-98 shadow-md"
            id="add-service-trigger-btn"
          >
            <Plus className="w-4 h-4" />
            Add Salon Service
          </button>
        )}
      </div>

      {/* Lookup Controls & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search treatments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-stone-200 focus:border-stone-90) text-stone-850 placeholder-stone-400 text-sm pl-11 pr-4 py-2 rounded-xl transition-all outline-none"
            id="service-search-input"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'All' 
                ? 'bg-stone-900 text-white shadow-xs' 
                : 'bg-white border border-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            All Services
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-stone-900 text-white shadow-xs' 
                  : 'bg-white border border-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Core Grid Menu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="services-grid-parent">
        {filteredServices.length === 0 ? (
          <div className="col-span-full py-24 text-center text-stone-400 text-xs font-mono bg-white border border-stone-100 rounded-2xl">
            No matching services found in active catalogue.
          </div>
        ) : (
          filteredServices.map((srv) => (
            <div 
              key={srv.id} 
              className={`bg-white border rounded-2xl p-5 hover:border-stone-300 transition-all flex flex-col justify-between shadow-xs ${
                srv.isActive ? 'border-stone-100' : 'border-dashed border-stone-200 opacity-65'
              }`}
              id={`service-card-${srv.id}`}
            >
              <div>
                {/* Category & Status */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-mono tracking-wider font-bold text-stone-400 uppercase bg-stone-50 shrink-0 px-2 py-0.5 rounded-md border border-stone-100">
                    {srv.category}
                  </span>
                  
                  {/* Status click action */}
                  <button
                    onClick={() => handleToggleActive(srv)}
                    className="p-1 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
                    title={srv.isActive ? "Deactivate service" : "Activate service"}
                  >
                    {srv.isActive ? (
                      <span className="bg-emerald-50 text-emerald-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Active
                      </span>
                    ) : (
                      <span className="bg-stone-100 text-stone-500 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </button>
                </div>

                {/* Name */}
                <h3 className="font-display font-medium text-stone-900 text-sm leading-snug group-hover:text-gold-700 min-h-[40px]">
                  {srv.name}
                </h3>

                {/* Price and duration metadata info */}
                <div className="flex gap-4 items-center mt-3 text-stone-500 font-mono text-[11px] h-6">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-300" /> {srv.durationMinutes} min
                  </span>
                </div>
              </div>

              {/* Card Footer controls */}
              <div className="border-t border-stone-50 pt-4 mt-4 flex justify-between items-center bg-stone-50/20 -mx-5 -mb-5 p-4 rounded-b-2xl">
                <span className="text-sm font-semibold text-stone-900 font-mono">
                  {settings.currency}{srv.price.toFixed(2)}
                </span>

                {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager') ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditForm(srv)}
                      className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-700 rounded-lg transition-colors cursor-pointer"
                      title="Edit Service details"
                      id={`service-edit-btn-${srv.id}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirmId === srv.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 p-0.5 px-1.5 rounded-lg animate-in fade-in duration-100">
                        <span className="text-[10px] text-rose-600 font-bold whitespace-nowrap">Delete?</span>
                        <button
                          onClick={() => {
                            onDeleteService(srv.id);
                            showToaster(`Deleted ${srv.name}`);
                            setDeleteConfirmId(null);
                          }}
                          className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-rose-600 rounded-md transition-all cursor-pointer animate-pulse"
                          id={`service-delete-confirm-btn-${srv.id}`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 text-[9px] font-medium text-stone-600 bg-white border border-stone-200 rounded-md transition-all cursor-pointer"
                          id={`service-delete-cancel-btn-${srv.id}`}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(srv.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete permanently"
                        id={`service-delete-btn-${srv.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-stone-400 bg-stone-100 px-2 py-1 rounded">
                    View-Only
                  </span>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* ADD SERVICE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleAddSubmit}
            className="bg-white rounded-2xl border border-stone-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-200"
            id="add-service-form"
          >
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center">
              <h3 className="font-display font-semibold text-stone-950 text-base">Register Special Treatment</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-505 block">Treatment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balayage Hand-Painted Care"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-905 bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850"
                  id="form-service-name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-505 block">Category Menu *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-905 bg-white text-xs px-3 py-2.5 rounded-xl outline-none text-stone-800"
                  id="form-service-category"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-505 block">Base Price ({settings.currency}) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-905 bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850"
                    id="form-service-price"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-550 block">Booking Duration (Mins) *</label>
                  <input
                    type="number"
                    required
                    min={5}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-905 bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850"
                    id="form-service-duration"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="text-stone-500 hover:text-stone-800 transition-colors"
                >
                  {isActive ? (
                    <ToggleRight className="w-10 h-10 text-stone-900" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-stone-300" />
                  )}
                </button>
                <div>
                  <span className="text-xs font-semibold text-stone-900 block">Available immediately</span>
                  <span className="text-[10px] text-stone-400 block">Allows receptionists to bundle this item into checkouts</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 hover:bg-stone-100 text-stone-500 hover:text-stone-800 rounded-xl text-xs transition-all cursor-pointer"
              >
                Discard
              </button>
              <button
                type="submit"
                className="bg-stone-900 hover:bg-stone-850 text-white font-medium py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
                id="save-new-service-btn"
              >
                Assemble Treatment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT SERVICE MODAL */}
      {showEditModal && editingService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleEditSubmit}
            className="bg-white rounded-2xl border border-stone-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-200"
          >
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center">
              <h3 className="font-display font-semibold text-stone-950 text-base">Modify treatment Details</h3>
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
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-505 block">Treatment Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-905 bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-550 block">Category Menu *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-905 bg-white text-xs px-3 py-2.5 rounded-xl outline-none text-stone-800"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-550 block">Base Price ({settings.currency}) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-905 bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold tracking-wider uppercase text-stone-550 block">Booking Duration (Mins) *</label>
                  <input
                    type="number"
                    required
                    min={5}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-905 bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none text-stone-850"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="text-stone-500 hover:text-stone-800 transition-colors"
                >
                  {isActive ? (
                    <ToggleRight className="w-10 h-10 text-stone-900" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-stone-300" />
                  )}
                </button>
                <div>
                  <span className="text-xs font-semibold text-stone-900 block">Active Status</span>
                  <span className="text-[10px] text-stone-400 block font-mono">Control visibility during checkouts</span>
                </div>
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
                id="update-service-confirm-btn"
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
