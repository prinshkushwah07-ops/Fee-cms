import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { Menu, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { dataService } from '../services/dataService';

const AppLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch active session on mount
  useEffect(() => {
    if (user) {
      dataService.getActiveSession()
        .then(session => {
          setActiveSession(session);
          setSessionLoading(false);
        })
        .catch(err => {
          console.error('Error fetching active session:', err);
          setSessionLoading(false);
        });
    } else {
      setSessionLoading(false);
    }
  }, [user]);

  // Show loading spinner if auth is checking session or database session is loading
  if (authLoading || sessionLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div className="stat-value" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--primary-light)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Synchronizing Database...</span>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect to Login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Header Bar */}
        <header className="main-header">
          <div className="header-left">
            <button className="header-menu-btn" onClick={toggleSidebar} aria-label="Toggle Sidebar">
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="header-title">
                <span className="header-title-text">School ERP Portal</span>
              </span>
            </div>
          </div>

          <div className="header-right">
            {/* Active Session Indicator */}
            {activeSession && (
              <div className="header-session-select">
                <Calendar size={16} style={{ color: 'var(--primary)' }} />
                <span className="header-session-text">Session: <strong>{activeSession.year}</strong></span>
              </div>
            )}
            
            {/* Direct Quick Pay Shortcut */}
            <Link to="/collect" className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
              + Collect Fee
            </Link>
          </div>
        </header>

        {/* Child Router Outlets */}
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
