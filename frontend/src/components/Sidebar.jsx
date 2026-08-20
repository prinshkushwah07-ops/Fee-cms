import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  History, 
  Clock, 
  BarChart3, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const activeSession = dataService.getActiveSession();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Session Years', path: '/sessions', icon: Calendar },
    { name: 'Fee Collection', path: '/collect', icon: CreditCard },
    { name: 'Payment History', path: '/history', icon: History },
    { name: 'Pending Fees', path: '/pending', icon: Clock },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={toggleSidebar}
        />
      )}

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* Brand Logo */}
        <div className="sidebar-brand">
          <GraduationCap size={28} className="brand-logo-icon" />
          <div className="brand-info">
            <span className="brand-name">Nexvora School</span>
            <span className="brand-tag">Fee Management</span>
          </div>
        </div>

        {/* Active Session Status Card */}
        {activeSession && (
          <div className="sidebar-session-card">
            <div className="session-status-light"></div>
            <div>
              <span className="session-card-label">Active Session</span>
              <span className="session-card-value">{activeSession.year}</span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (window.innerWidth <= 1024) toggleSidebar();
              }}
            >
              <item.icon size={18} className="sidebar-nav-icon" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer (User Info & Logout) */}
        <div className="sidebar-footer">
          <div className="user-profile-box">
            <div className="user-avatar">{user?.name?.charAt(0) || 'A'}</div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Administrator'}</span>
              <span className="user-role">{user?.role || 'Admin'}</span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
