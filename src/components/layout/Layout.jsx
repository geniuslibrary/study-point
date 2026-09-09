import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../common/ConfirmDialog';
import { LogOut } from 'lucide-react';

const Layout = ({ children, title = 'Dashboard' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const auth = useAuth();

  const handleLogoutClick = () => {
    setIsSidebarOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      if (auth && auth.logout) {
        await auth.logout();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogoutClick}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header
          title={title}
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={handleLogoutClick}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-7 pb-28 md:pb-8">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>

        <MobileNav />
      </div>

      <ConfirmDialog
        isOpen={isLogoutModalOpen}
        onClose={() => !loggingOut && setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out (लॉगआउट)"
        message="क्या आप वाकई StudyPoint से Sign Out करना चाहते हैं?"
        confirmText="हाँ, Sign Out करें"
        cancelText="रद्द करें (Cancel)"
        variant="danger"
        icon={LogOut}
        loading={loggingOut}
      />
    </div>
  );
};

export default Layout;
