import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { NotificationBar } from './components/NotificationBar';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { PosView } from './views/PosView';
import { CustomersView } from './views/CustomersView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { ProfileView } from './views/ProfileView';

const MainAppContent: React.FC = () => {
  const { currentUserSession, currentPage } = useStore();

  if (!currentUserSession) {
    return <LoginView />;
  }

  const renderCurrentView = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardView />;
      case 'inventory':
        return <InventoryView />;
      case 'pos':
        return <PosView />;
      case 'customers':
        return <CustomersView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex flex-col font-sans dir-rtl">
      {/* Top Notification Clock & Market Bar */}
      <NotificationBar />

      {/* Main Header / Top Bar */}
      <TopBar />

      {/* Layout Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Page Main Content */}
        <main className="flex-1 md:mr-[240px] p-4 sm:p-8 min-h-[calc(100vh-96px)]">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Floating Toast System */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainAppContent />
    </StoreProvider>
  );
}
