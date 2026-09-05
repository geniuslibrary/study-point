import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sections from './pages/Sections';
import Students from './pages/Students';
import Fees from './pages/Fees';
import Reports from './pages/Reports';
import Memberships from './pages/Memberships';
import Expenses from './pages/Expenses';
import StaffRoles from './pages/StaffRoles';
import Settings from './pages/Settings';
import PublicReceipt from './pages/PublicReceipt';

const ProtectedRoute = ({ children, requiredModule = null }) => {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check module permission if required
  if (requiredModule && !hasPermission(requiredModule, 'view')) {
    // Find the first module they DO have permission for to avoid infinite redirects
    const fallbackRoutes = [
      { module: 'dashboard', path: '/' },
      { module: 'sections', path: '/sections' },
      { module: 'students', path: '/students' },
      { module: 'fees', path: '/fees' },
      { module: 'reports', path: '/reports' },
      { module: 'memberships', path: '/memberships' },
      { module: 'expenses', path: '/expenses' },
      { module: 'staff', path: '/staff' },
      { module: 'settings', path: '/settings' },
    ];

    const firstAllowed = fallbackRoutes.find(r => hasPermission(r.module, 'view'));
    const redirectTo = firstAllowed ? firstAllowed.path : '/login';

    // If we're already at the redirect target but still failing, show unauthorized
    if (location.pathname === redirectTo) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
          <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-sm">
            <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-500">You do not have permission to view any modules. Please contact the owner.</p>
          </div>
        </div>
      );
    }

    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/receipt/:id" element={<PublicReceipt />} />
      <Route
        path="/"
        element={
          <ProtectedRoute requiredModule="dashboard">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sections"
        element={
          <ProtectedRoute requiredModule="sections">
            <Sections />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute requiredModule="students">
            <Students />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fees"
        element={
          <ProtectedRoute requiredModule="fees">
            <Fees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredModule="reports">
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/memberships"
        element={
          <ProtectedRoute requiredModule="memberships">
            <Memberships />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute requiredModule="expenses">
            <Expenses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute requiredModule="staff">
            <StaffRoles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredModule="settings">
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
