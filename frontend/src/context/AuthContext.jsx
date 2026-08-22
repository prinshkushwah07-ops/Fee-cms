import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);



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
      const data = await api.post('/auth/login', { username, password });
      const userData = {
        ...data.user,
        loginTime: new Date().toISOString()
      };
      
      setUser(userData);
      localStorage.setItem('fee_system_user', JSON.stringify(userData));
      
      setLoading(false);
      return userData;
    } catch (err) {
      setLoading(false);
      throw err;
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
