import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, IndianRupee, BarChart3, Receipt, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileNav = () => {
  const { hasPermission } = useAuth();

  const allNavItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard, module: 'dashboard' },
    { name: 'Sections', path: '/sections', icon: Building2, module: 'sections' },
    { name: 'Students', path: '/students', icon: Users, module: 'students' },
    { name: 'Fees', path: '/fees', icon: IndianRupee, module: 'fees' },
    { name: 'Reports', path: '/reports', icon: BarChart3, module: 'reports' },
  ];

  const allowedItems = allNavItems.filter((item) => hasPermission(item.module, 'view'));

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 pb-safe shadow-lg">
      <div className="flex items-center justify-around h-16 px-1">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-indigo-600 font-bold' : 'text-gray-500 hover:text-gray-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
