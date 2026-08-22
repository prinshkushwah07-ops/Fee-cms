import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  Database, 
  Users, 
  BadgeCheck 
} from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field validation errors
  const [validationErrors, setValidationErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!username.trim()) {
      errors.username = 'Username or Email is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login(username, password, rememberMe);
      showToast('Login Successful', 'Welcome to the School ERP Portal', 'success');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
      showToast('Login Failed', err.message || 'Invalid credentials', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Password recovery: Please contact your systems administrator (admin@school.edu) to reset your accounts portal password.');
  };

  return (
    <div className="login-split-container">
      {/* 1. Left Side: Decorative Branding Hero Panel (Desktop only) */}
      <div className="login-hero-panel">
        <div className="login-hero-grid"></div>
        <div className="login-hero-blob"></div>

        {/* Institution Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', zIndex: 10 }}>
          <div style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '0.625rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)'
          }}>
            <GraduationCap size={24} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
            Nexvora School ERP
          </span>
        </div>

        {/* Catchy Slogan */}
        <h1 className="login-hero-title">
          Smart Fee management <br />
          made <span>effortless</span>.
        </h1>
        <p className="login-hero-subtitle">
          Secure, automated student accounts billing portal integrated with a high-performance relational MySQL database layer.
        </p>

        {/* Floating Feature Widgets */}
        <div className="login-floating-widget">
          <div className="login-widget-card">
            <div className="login-widget-icon">
              <Database size={18} />
            </div>
            <div className="login-widget-info">
              <h5>MySQL Database Sync</h5>
              <p>Relational table queries & data cascade keys are fully active.</p>
            </div>
          </div>

          <div className="login-widget-card">
            <div className="login-widget-icon">
              <Users size={18} style={{ color: 'var(--secondary)' }} />
            </div>
            <div className="login-widget-info">
              <h5>Interactive Billing Portal</h5>
              <p>Real-time invoices, transaction histories, and pending lists.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Right Side: Centered Login Form Panel */}
      <div className="login-form-panel">
        <div className="login-form-blob"></div>

        <div className="login-form-card">
          {/* Logo Icon for Mobile View */}
          <div style={{ textAlign: 'left', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', margin: 0 }}>
              Sign In
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
              Access the accounts dashboard to record student payments.
            </p>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'left'
            }}>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="login-input-group">
              <label className="login-input-label" htmlFor="userInput">Username / Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="userInput"
                  type="text"
                  className="login-input-field"
                  placeholder="Enter username (e.g. admin)"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (validationErrors.username) {
                      setValidationErrors(prev => ({ ...prev, username: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                  autoComplete="username"
                />
                <span className="login-field-icon">
                  <User size={16} />
                </span>
              </div>
              {validationErrors.username && (
                <span className="form-feedback-error" style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  {validationErrors.username}
                </span>
              )}
            </div>

            {/* Password Input */}
            <div className="login-input-group">
              <label className="login-input-label" htmlFor="passInput">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="passInput"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input-field"
                  style={{ paddingRight: '2.5rem' }}
                  placeholder="Enter password (e.g. admin123)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                <span className="login-field-icon">
                  <Lock size={16} />
                </span>
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {validationErrors.password && (
                <span className="form-feedback-error" style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  {validationErrors.password}
                </span>
              )}
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="login-actions-row">
              <label className="login-action-checkbox">
                <input
                  type="checkbox"
                  className="login-checkbox-box"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span>Remember Me</span>
              </label>
              <a href="#forgot" onClick={handleForgotPassword} className="login-forgot-anchor">
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button type="submit" className="login-action-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }}></div>
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Credentials Guide Info */}
          <div className="login-creds-container">
            <strong>System Testing Credentials:</strong>
            <ul>
              <li>Username: <code>admin</code></li>
              <li>Password: <code>admin123</code></li>
            </ul>
          </div>

        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
