import React from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="bg-background font-sans text-foreground min-h-screen flex w-full transition-all duration-200">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Settings Page Area */}
      <main className="ml-[260px] flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-headline-md font-bold text-primary mb-1">
            System Settings
          </h1>
          <p className="text-body-md text-muted-foreground">
            Manage your store information, preferences, and view account logs
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          
          {/* Card 1: Account Profile */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-title-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_circle</span>
              Account Information
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-body-md font-medium text-muted-foreground">Full Name</span>
                <span className="text-body-md font-bold">{user?.fullName || 'Cashier 01'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-body-md font-medium text-muted-foreground">Email Address</span>
                <span className="text-body-md font-bold">{user?.email || 'cashier1@store.com'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-body-md font-medium text-muted-foreground">Access Level</span>
                <span className="px-3 py-1 rounded-full text-label-md font-bold bg-primary-container text-on-primary-container capitalize">
                  {user?.role || 'cashier'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Store Information */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-title-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">store</span>
              Store Configuration
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-body-md font-medium text-muted-foreground">Store Name</span>
                <span className="text-body-md font-bold">Emerald POS & Inventory</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-body-md font-medium text-muted-foreground">Currency Setup</span>
                <span className="text-body-md font-bold">USD ($)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-body-md font-medium text-muted-foreground">Default Tax (VAT)</span>
                <span className="text-body-md font-bold">10% (Included on checkout)</span>
              </div>
            </div>
          </div>

          {/* Card 3: System Status */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
            <h2 className="text-title-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">dns</span>
              System Environment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-secondary p-4 rounded-xl text-center border border-border">
                <p className="text-label-md text-muted-foreground font-bold">FRONTEND STATUS</p>
                <p className="text-headline-sm font-extrabold text-green-600 dark:text-green-400 mt-1 flex items-center justify-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block animate-ping"></span>
                  Online
                </p>
                <p className="text-label-md text-muted-foreground mt-1">Vite + React v19</p>
              </div>
              <div className="bg-secondary p-4 rounded-xl text-center border border-border">
                <p className="text-label-md text-muted-foreground font-bold">BACKEND SERVER</p>
                <p className="text-headline-sm font-extrabold text-green-600 dark:text-green-400 mt-1 flex items-center justify-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block animate-ping"></span>
                  Online
                </p>
                <p className="text-label-md text-muted-foreground mt-1">Node/Express Port 5000</p>
              </div>
              <div className="bg-secondary p-4 rounded-xl text-center border border-border">
                <p className="text-label-md text-muted-foreground font-bold">DATABASE</p>
                <p className="text-headline-sm font-extrabold text-green-600 dark:text-green-400 mt-1 flex items-center justify-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block animate-ping"></span>
                  Connected
                </p>
                <p className="text-label-md text-muted-foreground mt-1">PostgreSQL v16</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
