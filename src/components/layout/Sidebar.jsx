import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  IndianRupee,
  BarChart3,
  CreditCard,
  Receipt,
  ShieldCheck,
  Settings,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen, onLogout }) => {
  const { user, hasPermission } = useAuth();

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, module: 'dashboard' },
    { name: 'Sections & Seats', path: '/sections', icon: Building2, module: 'sections' },
    { name: 'Students', path: '/students', icon: Users, module: 'students' },
    { name: 'Fees & Receipts', path: '/fees', icon: IndianRupee, module: 'fees' },
    { name: 'Reports (Daily/Monthly)', path: '/reports', icon: BarChart3, module: 'reports' },
    { name: 'Memberships & Plans', path: '/memberships', icon: CreditCard, module: 'memberships' },
    { name: 'Expenses & Utility', path: '/expenses', icon: Receipt, module: 'expenses' },
    { name: 'Staff & Roles', path: '/staff', icon: ShieldCheck, module: 'staff' },
    { name: 'Settings', path: '/settings', icon: Settings, module: 'settings' },
  ];

  const allowedNavItems = allNavItems.filter((item) => hasPermission(item.module, 'view'));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Modern Sleek Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/80 transform transition-transform duration-200 ease-in-out flex flex-col shadow-xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 via-purple-50/20 to-transparent">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-slate-900 tracking-tight block">
                Study Point
              </span>
              <span className="text-[9px] font-black bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold tracking-wide flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="capitalize">{user?.role === 'owner' ? 'Owner Portal' : `${user?.role || 'Staff'} Mode`}</span>
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Main Menu
          </div>

          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Profile Card & Sign Out */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="mb-2.5 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0">
              {user?.displayName?.charAt(0) || 'O'}
            </div>
            <div className="truncate flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {user?.displayName || 'Study Point Owner'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md capitalize shrink-0">
              {user?.role || 'Owner'}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full py-2 text-slate-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
