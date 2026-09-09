import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, LogOut, ShieldCheck, Key } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import { useAuth } from '../../context/AuthContext';
import { fetchCollectionData } from '../../firebase/storageService';
import { COLLECTIONS } from '../../utils/constants';
import { getUserDisplayName } from '../../utils/helpers';

const getHeaderRoleBadge = (user) => {
  if (!user) return 'Staff';
  if (user.role === 'owner' || user.role === 'role_owner') return '👑 Owner';
  if (user.roleLabel && user.roleLabel.toLowerCase() !== 'custom') return user.roleLabel;
  if (user.role === 'receptionist' || user.role === 'role_receptionist') return '🛎️ Receptionist';
  if (user.role === 'manager' || user.role === 'role_manager') return '👔 Branch Manager';
  if (user.role === 'custom') return '⚙️ Custom Role';
  return user.role;
};

const Header = ({ title, onMenuClick, onLogout }) => {
  const { user, logout } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const [students, fees, visitors] = await Promise.all([
          fetchCollectionData(COLLECTIONS.STUDENTS),
          fetchCollectionData(COLLECTIONS.FEES),
          fetchCollectionData(COLLECTIONS.VISITORS),
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

        // 2. Demo Alerts (Last Day of Demo + Demo Expired)
        const demoAlertsCount = (visitors || []).filter((v) => {
          if (v.status === 'converted' || v.status === 'not_interested' || v.purpose === 'inquiry') {
            return false;
          }
          const endD = new Date(v.endDate || v.startDate || now);
          endD.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((endD.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 0; // 0 = last day, < 0 = expired
        }).length;

        setUnreadCount(expiringCount + demoAlertsCount);
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
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md h-16 border-b border-gray-200 shadow-2xs px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-tight truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Bell Button */}
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-2 sm:p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-xl relative transition-colors cursor-pointer"
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
            <div className="w-8 sm:w-9 h-8 sm:h-9 bg-indigo-100/90 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              {getUserDisplayName(user).charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[120px]">
                {getUserDisplayName(user)}
              </p>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 mt-0.5 inline-block">
                {getHeaderRoleBadge(user)}
              </span>
            </div>
          </div>

          {/* Direct Sign Out Button in Header */}
          <button
            type="button"
            onClick={onLogout || logout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50/80 border border-rose-200/90 rounded-xl transition-all shadow-2xs cursor-pointer ml-1 active:scale-95 shrink-0"
            title="Sign Out / Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
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
