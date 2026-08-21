import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('DEBUG (AuthContext): API_URL is:', API_URL);
console.log('DEBUG (AuthContext): VITE_API_URL from env is:', import.meta.env.VITE_API_URL);
console.log('DEBUG (AuthContext): All env keys and values:', JSON.stringify(import.meta.env));



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (session restore)
    const storedUser = localStorage.getItem('fee_system_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('fee_system_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password, rememberMe) => {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid username or password.');
      }

      const data = await res.json();
      const userData = {
        ...data.user,
        loginTime: new Date().toISOString()
      };
      
      setUser(userData);
      
      if (rememberMe) {
        localStorage.setItem('fee_system_user', JSON.stringify(userData));
      } else {
        localStorage.setItem('fee_system_user', JSON.stringify(userData)); // fallback for dashboard state persistence
      }
      
      setLoading(false);
      return userData;
    } catch (err) {
      setLoading(false);
      throw new Error(err.message || 'Authentication service connection error.');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fee_system_user');
    sessionStorage.removeItem('fee_system_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
