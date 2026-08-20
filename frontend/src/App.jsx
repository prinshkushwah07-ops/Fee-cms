import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import Sessions from './pages/Sessions';
import FeeCollection from './pages/FeeCollection';
import PaymentHistory from './pages/PaymentHistory';
import FeeReceipt from './pages/FeeReceipt';
import PendingFees from './pages/PendingFees';
import Reports from './pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Unified Login System Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes Layout */}
            <Route path="/" element={<AppLayout />}>
              {/* Dashboard */}
              <Route index element={<Dashboard />} />
              
              {/* Student Management */}
              <Route path="students" element={<Students />} />
              <Route path="students/:admissionNo" element={<StudentDetail />} />
              
              {/* Session Management */}
              <Route path="sessions" element={<Sessions />} />
              
              {/* Fee Management & Collection */}
              <Route path="collect" element={<FeeCollection />} />
              <Route path="history" element={<PaymentHistory />} />
              <Route path="receipt/:receiptNo" element={<FeeReceipt />} />
              
              {/* Pending Fees */}
              <Route path="pending" element={<PendingFees />} />
              
              {/* Reports */}
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* Fallback to Dashboard/Login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
