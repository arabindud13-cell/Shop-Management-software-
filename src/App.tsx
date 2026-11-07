/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShopProvider, useShop } from './context/ShopContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { RechargeView } from './views/RechargeView';
import { MoneyTransferView } from './views/MoneyTransferView';
import { ExpensesView } from './views/ExpensesView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { KhataBookView } from './views/KhataBookView';
import { AndroidAppView } from './views/AndroidAppView';
import { AuthView } from './views/AuthView';
import { OpeningBalanceModal } from './components/OpeningBalanceModal';
import { AddTransactionModal } from './components/modals/AddTransactionModal';
import { ViewReceiptModal } from './components/modals/ViewReceiptModal';
import { GenerateReceiptModal } from './components/modals/GenerateReceiptModal';
import { ReceiptHistoryModal } from './components/modals/ReceiptHistoryModal';

function MainShopApp() {
  const { user, loading } = useAuth();
  const {
    isAddModalOpen,
    modalInitialType,
    modalInitialCategory,
    modalTransferDirection,
    closeAddModal,
    selectedReceipt,
    isReceiptModalOpen,
    closeReceiptModal,
    isGenerateReceiptModalOpen,
    prefillReceiptTxn,
    closeGenerateReceiptModal,
    isReceiptHistoryModalOpen,
    closeReceiptHistoryModal,
  } = useShop();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOpeningBalanceModalOpen, setIsOpeningBalanceModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-2xl animate-pulse mb-3">
          র
        </div>
        <p className="text-sm font-semibold text-slate-300">রাধা মাধব অনলাইন সেন্টার লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onOpenOpeningBalance={() => setIsOpeningBalanceModalOpen(true)}
            setActiveTab={setActiveTab}
          />
        );
      case 'transactions':
        return <TransactionsView />;
      case 'khata':
        return <KhataBookView onOpenAndroidApp={() => setActiveTab('android-app')} />;
      case 'android-app':
        return <AndroidAppView onBackToWebsite={() => setActiveTab('dashboard')} />;
      case 'recharge':
        return <RechargeView />;
      case 'money-transfer':
        return <MoneyTransferView />;
      case 'expenses':
        return <ExpensesView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onOpenOpeningBalance={() => setIsOpeningBalanceModalOpen(true)}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        onOpenOpeningBalance={() => setIsOpeningBalanceModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Opening Balance Modal */}
      <OpeningBalanceModal
        isOpen={isOpeningBalanceModalOpen}
        onClose={() => setIsOpeningBalanceModalOpen(false)}
      />

      {/* Global Quick Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        initialType={modalInitialType}
        initialCategory={modalInitialCategory}
        initialTransferDirection={modalTransferDirection}
      />

      {/* Global Receipt Viewer Modal */}
      <ViewReceiptModal
        isOpen={isReceiptModalOpen}
        receipt={selectedReceipt}
        onClose={closeReceiptModal}
      />

      {/* Global Generate Receipt Modal */}
      <GenerateReceiptModal
        isOpen={isGenerateReceiptModalOpen}
        onClose={closeGenerateReceiptModal}
        prefillTxn={prefillReceiptTxn}
      />

      {/* Global Saved Receipt History Modal */}
      <ReceiptHistoryModal
        isOpen={isReceiptHistoryModalOpen}
        onClose={closeReceiptHistoryModal}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ShopProvider>
            <MainShopApp />
          </ShopProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
