import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    const isSuperuser = localStorage.getItem('isSuperuser') === 'true';
    return token ? { token, username, isSuperuser } : null;
  });
  const [sessionInfo, setSessionInfo] = useState(null);

  const login = (token, username, isSuperuser, remember) => {
    console.log("Login successful, token:", token);
    
    if (remember) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('username', username);
      localStorage.setItem('isSuperuser', isSuperuser);
    } else {
      // Even if not remembered, store in session storage for the current session
      sessionStorage.setItem('authToken', token);
      sessionStorage.setItem('username', username);
      sessionStorage.setItem('isSuperuser', isSuperuser);
    }
    
    setAuth({ token, username, isSuperuser });
  };

  const logout = async () => {
    try {
      // Call logout API if authenticated
      if (auth?.token) {
        await api.post('/auth/logout/');
      }
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      // Clear storage and state
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('isSuperuser');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('isSuperuser');
      setAuth(null);
      setSessionInfo(null);
      
      // Redirect to login page
      window.location.href = '/login';
    }
  };

  // Session timeout and activity monitoring
  useEffect(() => {
    if (!auth?.token) return;

    console.log("Setting up session monitoring");
    
    // Initialize last activity time
    let lastActivityTime = Date.now();
    let inactivityTimeout;
    let sessionCheckInterval;
    let lastPingTime = 0;
    
    // Function to check session status with server
    const checkSessionStatus = async () => {
      try {
        const response = await api.get('/auth/check-session-status/');
        console.log("Session check response:", response.data);
        
        if (response.data.time_remaining) {
          setSessionInfo({
            expiresAt: new Date(response.data.expires_at),
            timeRemaining: response.data.time_remaining
          });
        }
      } catch (error) {
        console.log('Session check failed:', error);
        logout();
      }
    };
    
    // Function to ping server to keep session alive
    const pingSessionServer = async () => {
      try {
        await api.get('/auth/ping-session/');
        console.log("Session pinged");
      } catch (error) {
        console.log('Session ping failed:', error);
        if (error.response && error.response.status === 401) {
          logout();
        }
      }
    };
    
    // Reset inactivity timer and optionally ping server
    const resetInactivityTimer = () => {
      lastActivityTime = Date.now();
      
      // Clear existing timeout
      clearTimeout(inactivityTimeout);
      
      // Ping server to keep session alive (throttled)
      const now = Date.now();
      if (now - lastPingTime > 10000) { // Max once every 10 seconds
        lastPingTime = now;
        pingSessionServer();
      }
      
      // Set new timeout - 20 seconds of inactivity will trigger logout
      inactivityTimeout = setTimeout(() => {
        console.log("Inactivity timeout reached! Last activity was:", new Date(lastActivityTime));
        logout();
      }, 19000); // Slightly less than server timeout (20s)
    };
    
    // Track user activity to reset timer
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners for all activity events
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, false);
    });
    
    // Check session status periodically with server
    sessionCheckInterval = setInterval(checkSessionStatus, 10000); // Every 10 seconds
    
    // Initial session check and timer
    checkSessionStatus();
    resetInactivityTimer();
    
    // Cleanup function
    return () => {
      clearTimeout(inactivityTimeout);
      clearInterval(sessionCheckInterval);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, false);
      });
    };
  }, [auth]);

  return (
    <AuthContext.Provider value={{ auth, login, logout, sessionInfo }}>
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