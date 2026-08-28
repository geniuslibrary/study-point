import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const ProtectedRoute = ({ children, requiredModule = null }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check module permission if required
  if (requiredModule && !hasPermission(requiredModule, 'view')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
