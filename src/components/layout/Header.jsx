import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, LogOut, ShieldCheck, Key } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import { useAuth } from '../../context/AuthContext';
import { fetchCollectionData } from '../../firebase/storageService';
import { COLLECTIONS } from '../../utils/constants';

const Header = ({ title, onMenuClick }) => {
  const { user, logout } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const [students, fees] = await Promise.all([
          fetchCollectionData(COLLECTIONS.STUDENTS),
          fetchCollectionData(COLLECTIONS.FEES),
        ]);

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // 1. Expiring in <= 3 days
        const expiringCount = students.filter((s) => {
          if (s.status !== 'active' || !s.membershipEnd) return false;
          const endD = s.membershipEnd?.toDate
            ? s.membershipEnd.toDate()
            : new Date(s.membershipEnd);
          endD.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((endD.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 3;
        }).length;

        // 2. Pending fees for month
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentMonthPaidStudentIds = new Set(
          fees.filter((f) => f.month === currentMonth && f.status === 'paid').map((f) => f.studentId)
        );
        const pendingFeesCount = students.filter(
          (s) => s.status === 'active' && !currentMonthPaidStudentIds.has(s.id)
        ).length;

        setUnreadCount(expiringCount + pendingFeesCount);
      } catch (e) {
        console.error(e);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white h-16 border-b border-gray-200 shadow-2xs px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell Button */}
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl relative transition-colors cursor-pointer"
            title="Open Notifications & 3-Day Expiry Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 bg-red-600 text-white font-extrabold text-[10px] px-1 rounded-full flex items-center justify-center animate-bounce shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Role Badge & Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="w-9 h-9 bg-indigo-100/90 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs">
              {user?.displayName?.charAt(0) || 'O'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">
                {user?.displayName || 'Study Point Owner'}
              </p>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded capitalize">
                {user?.role || 'Owner'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Dropdown Panel */}
      <NotificationPanel
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </>
  );
};

export default Header;
