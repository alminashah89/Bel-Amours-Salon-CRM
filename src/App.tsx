/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  getStoredSettings, 
  getStoredServices, 
  generateNextInvoiceNumber
} from './mockData';
import { Customer, Service, Receipt, SalonSettings, User, Expense } from './types';
import { db, handleFirestoreError, OperationType, cleanUndefined } from './firebase';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  collection
} from 'firebase/firestore';
import { Lock } from 'lucide-react';

// Importing Visual Component Suite
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import CustomersView from './components/CustomersView';
import POSView from './components/POSView';
import ServicesView from './components/ServicesView';
import ReceiptsHistoryView from './components/ReceiptsHistoryView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import ThermalReceipt from './components/ThermalReceipt';
import ExpensesView from './components/ExpensesView';

export default function App() {
  // 1. Session state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 2. Database Collection States
  const [settings, setSettings] = useState<SalonSettings>({
    salonName: "Bél'Amour",
    phone: '0333 0717123',
    email: 'belamourspasaloon@gmail.com',
    address: 'Commercial Area Phase 5, DHA, Lahore, Pakistan',
    taxRate: 0.16,
    currency: 'PKR',
    openHours: 'Mon - Sun: 11:00 AM - 9:00 PM',
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // 3. Navigation and layouts UI control
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Searching
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // 4. POS Checkouts & Loyalty crossovers states
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [preselectedCustomerForPOS, setPreselectedCustomerForPOS] = useState<Customer | null>(null);
  const [activeReceiptForModal, setActiveReceiptForModal] = useState<Receipt | null>(null);

  // 5. Toast System state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize and Synchronize Salon Settings from Firebase Firestore in Real-Time
  useEffect(() => {
    const docRef = doc(db, 'settings', 'salon');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SalonSettings;
        setSettings(data);
      } else {
        // Document doesn't exist yet, seed it with the default local settings
        const defaultSettings = getStoredSettings();
        setDoc(docRef, cleanUndefined(defaultSettings)).then(() => {
          setSettings(defaultSettings);
        }).catch(err => {
          console.error("Failed to seed default settings to Firebase:", err);
        });
      }
    }, (error) => {
      console.error("Error fetching settings from Firebase:", error);
    });

    return () => unsubscribe();
  }, []);

  // Synchronize Customers from Firestore in Real-Time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const list: Customer[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Customer);
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setCustomers(list);
    }, (error) => {
      console.error("Error fetching customers from Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  // Synchronize Services from Firestore in Real-Time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'services'), (snapshot) => {
      const list: Service[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Service);
      });
      if (list.length === 0) {
        // Empty catalogue? Seed default high-fidelity items dynamically!
        const defaults = getStoredServices();
        for (const s of defaults) {
          setDoc(doc(db, 'services', s.id), cleanUndefined(s)).catch(e => {
            console.error("Failed to seed service catalogue:", e);
          });
        }
      } else {
        list.sort((a, b) => a.name.localeCompare(b.name));
        setServices(list);
      }
    }, (error) => {
      console.error("Error fetching services from Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  // Synchronize Receipts/Transactions from Firestore in Real-Time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'receipts'), (snapshot) => {
      const list: Receipt[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Receipt);
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setReceipts(list);
    }, (error) => {
      console.error("Error fetching receipts from Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  // Synchronize Expenses from Firestore in Real-Time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const list: Expense[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Expense);
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setExpenses(list);
    }, (error) => {
      console.error("Error fetching expenses from Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  // Toast builder
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4000);
  };

  // State setters with Firebase Firestore persistence handlers
  const handleUpdateSettings = async (newSettings: SalonSettings) => {
    if (currentUser?.role === 'Cashier') {
      triggerToast("Access Denied: Cashiers are strictly forbidden from managing settings.");
      return;
    }
    try {
      const docRef = doc(db, 'settings', 'salon');
      await setDoc(docRef, cleanUndefined(newSettings));
      triggerToast('Salon settings saved to Firebase Firestore');
    } catch (e) {
      console.error("Error updating settings in Firebase:", e);
      triggerToast('Database Error: Failed to save changes in the cloud.');
    }
  };

  const handleAddExpense = async (exp: Omit<Expense, 'id' | 'createdBy'>) => {
    if (currentUser?.role === 'Cashier') {
      triggerToast("Access Denied: Cashiers are strictly forbidden from managing expenses.");
      return;
    }
    const id = `exp-${Date.now()}`;
    const next: Expense = {
      ...exp,
      id,
      createdBy: currentUser?.name || "BEL'AMOUR"
    };
    try {
      await setDoc(doc(db, 'expenses', id), cleanUndefined(next));
      triggerToast(`Expense record saved: ${next.category}`);
    } catch (error) {
      console.error("Error saving expense:", error);
      triggerToast("Error: Failed to save expense.");
    }
  };

  const handleEditExpense = async (exp: Expense) => {
    if (currentUser?.role === 'Cashier') {
      triggerToast("Access Denied: Cashiers are strictly forbidden from managing expenses.");
      return;
    }
    try {
      await setDoc(doc(db, 'expenses', exp.id), cleanUndefined(exp));
      triggerToast(`Expense record updated: ${exp.category}`);
    } catch (error) {
      console.error("Error updating expense:", error);
      triggerToast("Error: Failed to update expense.");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (currentUser?.role === 'Cashier') {
      triggerToast("Access Denied: Cashiers are strictly forbidden from deleting records.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'expenses', id));
      triggerToast('Expense record deleted successfully');
    } catch (error) {
      console.error("Error deleting expense:", error);
      triggerToast("Error: Failed to delete expense record.");
    }
  };

  const handleAddCustomer = (c: Omit<Customer, 'id' | 'totalSpending' | 'visitCount' | 'createdAt'>, customId?: string) => {
    const id = customId || `cust-${Date.now()}`;
    const next: Customer = {
      ...c,
      id,
      totalSpending: 0,
      visitCount: 0,
      createdAt: new Date().toISOString()
    };
    setDoc(doc(db, 'customers', id), cleanUndefined(next)).catch(error => {
      console.error("Error saving customer profile:", error);
      triggerToast("Error: Failed to create customer profile.");
    });
    setActiveCustomer(next);
    triggerToast(`Created customer file for: ${next.name}`);
    return next;
  };

  const handleEditCustomer = async (c: Customer) => {
    try {
      await setDoc(doc(db, 'customers', c.id), cleanUndefined(c));
      if (activeCustomer?.id === c.id) {
        setActiveCustomer(c);
      }
      triggerToast(`Updates saved for: ${c.name}`);
    } catch (error) {
      console.error("Error updating customer profile:", error);
      triggerToast("Error: Failed to save edits.");
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'customers', id));
      if (currentUser?.role === 'Cashier') {
        triggerToast('Customer profile deleted (Cashier: entered by mistake confirmation)');
      } else {
        triggerToast('Customer loyalty file deleted');
      }
    } catch (error) {
      console.error("Error deleting customer profile:", error);
      triggerToast("Error: Failed to delete customer loyalty profile.");
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    if (currentUser?.role === 'Cashier') {
      triggerToast("Access Denied: Cashiers are strictly forbidden from deleting records.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'receipts', id));
      await deleteDoc(doc(db, 'transactions', id));
      triggerToast('Receipt record deleted successfully');
    } catch (error) {
      console.error("Error deleting receipt:", error);
      triggerToast("Error: Failed to delete receipt record.");
    }
  };

  const handleAddService = async (s: Omit<Service, 'id'>) => {
    if (currentUser?.role === 'Cashier') {
      triggerToast("Access Denied: Cashiers are strictly forbidden from managing services.");
      return;
    }
    const id = `srv-${Date.now()}`;
    const next: Service = {
      ...s,
      id
    };
    try {
      await setDoc(doc(db, 'services', id), cleanUndefined(next));
      triggerToast(`Created service menu card for: ${next.name}`);
    } catch (error) {
      console.error("Error adding service:", error);
      triggerToast("Error: Failed to add service menu card.");
    }
  };

  const handleEditService = async (s: Service) => {
    if (currentUser?.role === 'Cashier') {
      triggerToast("Access Denied: Cashiers are strictly forbidden from managing services.");
      return;
    }
    try {
      await setDoc(doc(db, 'services', s.id), cleanUndefined(s));
      triggerToast(`Updates saved for: ${s.name}`);
    } catch (error) {
      console.error("Error editing service:", error);
      triggerToast("Error: Failed to update service menu item.");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (currentUser?.role === 'Cashier') {
      triggerToast("Access Denied: Cashiers are strictly forbidden from deleting records.");
      return;
    }
    try {
      await deleteDoc(doc(db, 'services', id));
      triggerToast('Service card deleted successfully');
    } catch (error) {
      console.error("Error deleting service:", error);
      triggerToast("Error: Failed to delete service.");
    }
  };

  // Trigger Checkout finalize
  const handleRegisterCheckoutComplete = async (preReceipt: Receipt) => {
    const sequentialInvoiceNo = generateNextInvoiceNumber(receipts);
    
    // Assign correct sequential number
    const finalReceipt: Receipt = {
      ...preReceipt,
      receiptNo: sequentialInvoiceNo,
    };

    try {
      // 1. Save Receipt to receipts collection
      await setDoc(doc(db, 'receipts', finalReceipt.id), cleanUndefined(finalReceipt));

      // 2. Save Receipt mirroring to transactions collection (as requested)
      await setDoc(doc(db, 'transactions', finalReceipt.id), cleanUndefined(finalReceipt));

      // 3. If NOT Walk-In, update corresponding customer spend, visits counters and last visit date
      if (finalReceipt.customerId) {
        const custDoc = customers.find(c => c.id === finalReceipt.customerId);
        if (custDoc) {
          const nextSpend = custDoc.totalSpending + finalReceipt.total;
          const nextVisits = custDoc.visitCount + 1;
          const updatedCust = {
            ...custDoc,
            totalSpending: nextSpend,
            visitCount: nextVisits,
            lastVisit: finalReceipt.date
          };
          await setDoc(doc(db, 'customers', finalReceipt.customerId), cleanUndefined(updatedCust));
        }
      }

      // 4. Trigger thermal receipt modal automatically upon checkout
      setActiveReceiptForModal(finalReceipt);
      triggerToast(`Checkout Successful: Generated invoice ${sequentialInvoiceNo}`);
    } catch (error) {
      console.error("Error processing checkout in Firestore:", error);
      triggerToast("Database Error: Failed to secure billing in the cloud.");
      handleFirestoreError(error, OperationType.WRITE, `receipts/${finalReceipt.id}`);
    }
  };

  // Logouts
  const handleLogout = () => {
    setCurrentUser(null);
    triggerToast('Secure session logged out');
  };

  const handleClearDatabase = async () => {
    if (currentUser?.role === 'Cashier') {
      triggerToast("Access Denied: Cashiers are strictly forbidden from deleting records.");
      return;
    }
    try {
      // Clear customers
      for (const c of customers) {
        await deleteDoc(doc(db, 'customers', c.id));
      }
      // Clear receipts & transactions
      for (const r of receipts) {
        await deleteDoc(doc(db, 'receipts', r.id));
        await deleteDoc(doc(db, 'transactions', r.id));
      }
      // Clear expenses
      for (const e of expenses) {
        await deleteDoc(doc(db, 'expenses', e.id));
      }
      triggerToast('Database Memory Sweep: Wiped all customers, receipts, and expenses successfully');
    } catch (error) {
      console.error("Error cleaning cloud databases:", error);
      triggerToast("Error: Failed to perform clean cloud database sweep.");
    }
  };

  // If user is not logged in, render the login panel
  if (!currentUser) {
    return (
      <AuthView 
        onLoginSuccess={(usr) => {
          setCurrentUser(usr);
          triggerToast(`Logged in successfully as ${usr.name}`);
        }} 
        settings={settings} 
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-stone-50 text-stone-900 selection:bg-stone-900 selection:text-white font-sans overflow-x-hidden antialiased flex" id="crm-main-layout">
      
      {/* 2. PERSISTENT SIDEBAR LAYOUT */}
      <Sidebar 
        currentView={currentView}
        onNavigate={(v) => {
          setCurrentView(v);
          setMobileMenuOpen(false); // Close mobile tray
        }}
        user={currentUser}
        onLogout={handleLogout}
        settings={settings}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* Mobile background shade filter */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-20 md:hidden"
        />
      )}

      {/* 3. SCROLLABLE CORE VIEW CANVAS */}
      <div className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
      }`}>
        
        {/* Sticky Global Top Header */}
        <Header 
          user={currentUser}
          settings={settings}
          onNavigate={setCurrentView}
          onMobileMenuToggle={() => setMobileMenuOpen(prev => !prev)}
          globalSearchQuery={globalSearchQuery}
          setGlobalSearchQuery={setGlobalSearchQuery}
          showToaster={triggerToast}
          onLogout={handleLogout}
        />

        {/* Dynamic page container view */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' && (
            <DashboardView 
              receipts={receipts}
              customers={customers}
              services={services}
              settings={settings}
              expenses={expenses}
              currentUser={currentUser}
              onNavigate={setCurrentView}
              onSelectCustomer={(c) => {
                setActiveCustomer(c);
                setCurrentView('customers');
              }}
            />
          )}

          {currentView === 'customers' && (
            <CustomersView 
              customers={customers}
              receipts={receipts}
              settings={settings}
              activeCustomer={activeCustomer}
              setActiveCustomer={setActiveCustomer}
              onAddCustomer={handleAddCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              globalSearchQuery={globalSearchQuery}
              onNavigate={setCurrentView}
              services={services}
              activeReceptionistObj={currentUser}
              onCheckoutComplete={handleRegisterCheckoutComplete}
            />
          )}

          {currentView === 'pos' && (
            <POSView 
              customers={customers}
              services={services}
              settings={settings}
              activeReceptionistObj={currentUser}
              onCheckoutComplete={handleRegisterCheckoutComplete}
              showToaster={triggerToast}
              preselectedCustomer={preselectedCustomerForPOS || activeCustomer}
              setPreselectedCustomer={setPreselectedCustomerForPOS}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'services' && (
            <ServicesView 
              services={services}
              settings={settings}
              currentUser={currentUser}
              onAddService={handleAddService}
              onEditService={handleEditService}
              onDeleteService={handleDeleteService}
              showToaster={triggerToast}
            />
          )}

          {currentView === 'receipts' && (
            <ReceiptsHistoryView 
              receipts={receipts}
              settings={settings}
              onOpenReceipt={(rec) => setActiveReceiptForModal(rec)}
              showToaster={triggerToast}
              onDeleteReceipt={handleDeleteReceipt}
              currentUser={currentUser}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView 
              receipts={receipts}
              customers={customers}
              services={services}
              settings={settings}
              currentUser={currentUser}
              expenses={expenses}
            />
          )}

          {currentView === 'settings' && (
            currentUser?.role === 'Cashier' ? (
              <div className="bg-white border border-stone-200/60 p-8 rounded-2xl flex flex-col items-center text-center justify-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                  <Lock className="w-5 h-5 shrink-0" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900">Access Restricted</h3>
                <p className="text-stone-500 text-[11px] max-w-sm">Cashiers are strictly forbidden from viewing or modifying salon configurations, corporate branding, and system administrative attributes.</p>
              </div>
            ) : (
              <SettingsView 
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                showToaster={triggerToast}
                onClearDatabase={handleClearDatabase}
                currentUser={currentUser}
                onUpdateUserProfile={(updatedUser, passwordToUpdate) => {
                  try {
                    const raw = localStorage.getItem('belamour-operators');
                    let list = [];
                    if (raw) {
                      list = JSON.parse(raw);
                    } else {
                      list = [
                        { id: 'user-admin', name: 'BelAmour Admin', email: 'admin@belamour.com', role: 'Admin', password: 'admin' },
                        { id: 'user-cashier', name: 'BelAmour Cashier', email: 'cashier@belamour.com', role: 'Cashier', password: 'cashier' }
                      ];
                    }
                    const updatedList = list.map((op: any) => {
                      if (op.id === currentUser.id) {
                        const newOpProfile = {
                          ...op,
                          name: updatedUser.name,
                          email: updatedUser.email
                        };
                        if (passwordToUpdate) {
                          newOpProfile.password = passwordToUpdate;
                        }
                        return newOpProfile;
                      }
                      return op;
                    });
                    localStorage.setItem('belamour-operators', JSON.stringify(updatedList));
                    setCurrentUser(updatedUser);
                    triggerToast('Admin profile saved successfully');
                  } catch (e) {
                    console.error("Failed to update profile", e);
                    triggerToast('Database Error: Failed to save operator profile details');
                  }
                }}
              />
            )
          )}

          {currentView === 'expenses' && (
            <ExpensesView 
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              currentUser={currentUser}
              settings={settings}
            />
          )}
        </main>

        {/* Global static footer */}
        <footer className="py-6 border-t border-stone-100 bg-white flex flex-col md:flex-row justify-between items-center px-8 gap-4">
          <div className="flex flex-col items-center md:items-start text-stone-500 font-mono text-[10px]">
            <span className="font-semibold text-stone-800 uppercase">Bel Amours Salon & Spa • Register Portal</span>
            <span>Support: <a href="mailto:belamourspasaloon@gmail.com" className="hover:underline text-amber-700 font-semibold">belamourspasaloon@gmail.com</a></span>
          </div>
          <div className="flex gap-4">
            <a 
              href="https://www.instagram.com/belamour_salonandspa?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
              target="_blank" 
              referrerPolicy="no-referrer"
              className="text-[10px] font-mono font-semibold text-[#B48A30] hover:text-[#916E24] border border-[#B48A30]/30 hover:border-[#B48A30] px-3 py-1 rounded-lg transition-all bg-amber-500/5"
            >
              Instagram: @belamour_salonandspa
            </a>
          </div>
          <div className="text-[10px] text-stone-400 font-mono">
            STATION: ACTIVE • SECURITY CHECK OK
          </div>
        </footer>
      </div>

      </div>

      {/* 4. HIGH-FIDELITY ACTIVE THERMAL RECEIPT MODAL */}
      {activeReceiptForModal && (
        <ThermalReceipt 
          receipt={activeReceiptForModal}
          settings={settings}
          onClose={() => setActiveReceiptForModal(null)}
          showToaster={triggerToast}
        />
      )}

      {/* 5. FLOATING COMPACT TOAST NOTIFICATION */}
      {toastMessage && (
        <div 
          className="fixed bottom-6 right-6 font-mono bg-stone-900 border border-white/10 text-white shadow-xl shadow-stone-900/20 px-4 py-3 rounded-xl flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5 duration-200 text-xs"
          id="global-toast-message"
        >
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
