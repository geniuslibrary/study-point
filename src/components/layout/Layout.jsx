import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children, title = 'Dashboard' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const auth = useAuth();

  const handleLogout = () => {
    if (auth && auth.logout) {
      auth.logout();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header
          title={title}
          onMenuClick={() => setIsSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-7 pb-28 md:pb-8">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
};

export default Layout;
