// src/api/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// List of allowed IP prefixes for client-side verification - make more specific
export const ALLOWED_IP_PREFIXES = [
  '127.0.0.1',       // localhost
  '10.72.177.',      // Specific EMI network subnet
  '192.168.56.1',    // Specific VirtualBox IP
];

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to add authentication token
api.interceptors.request.use((config) => {
  // Try both localStorage and sessionStorage
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
  // Log URL and token for debugging
  console.log(`Request to ${config.url} with token: ${token ? token.substring(0, 5) + '...' : 'none'}`);
  
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Add response interceptor to handle session errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log(`Error in request to ${error.config?.url}: ${error.message}`);
    
    // Handle session timeout/expiration
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log('Authentication error:', error.response.data);
      
      // Check if it's a session expiration
      const isSessionExpired = error.response.data && 
                              (error.response.data.expired || 
                               error.response.data.detail === 'Invalid token' ||
                               error.response.data.error === 'Session expired');
      
      if (isSessionExpired) {
        console.log('Session expired, clearing storage and redirecting');
        
        // Clear storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('isSuperuser');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('isSuperuser');
        
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Session management endpoints (keep /auth prefix)
export const checkSessionStatus = () => api.get('/auth/check-session-status/');
export const extendSession = (extendBy) => api.post('/auth/extend-session/', { extend_by: extendBy });
export const pingSession = () => api.get('/auth/ping-session/');

// Helper function to wait for auth before making requests
export const waitForAuth = (callback, maxAttempts = 5, interval = 200) => {
  let attempts = 0;
  
  const checkAuth = () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      callback();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(checkAuth, interval);
    } else {
      console.warn('Auth token not found after multiple attempts');
    }
  };
  
  checkAuth();
};

// Enhanced client IP detection with multiple methods
export const getClientIP = async () => {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    console.log('Fetching client IP from server...');
    const response = await api.get(`/api/client-ip/?t=${timestamp}`);
    console.log('Server responded with IP data:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching client IP from server:', error);
    
    // Try third-party service as fallback
    try {
      console.log('Trying third-party IP service...');
      const externalResponse = await fetch('https://api.ipify.org?format=json');
      const externalData = await externalResponse.json();
      console.log('External IP service returned:', externalData);
      return {
        status: 'success',
        ip: externalData.ip,
        source: 'external'
      };
    } catch (externalError) {
      console.error('External IP service failed:', externalError);
      
      // Last resort - development fallback
      if (window.location.hostname === 'localhost') {
        return {
          status: 'success',
          ip: '127.0.0.1',
          source: 'fallback'
        };
      }
      
      return {
        status: 'error',
        ip: 'unknown',
        message: 'Could not determine IP address'
      };
    }
  }
};

// Improved client IP validation with more strict checking
export const validateClientIP = async () => {
  try {
    console.log('Starting IP validation process...');
    const ipData = await getClientIP();
    console.log('IP data received:', ipData);
    
    if (ipData.status === 'success' && ipData.ip) {
      // Log each prefix check for debugging
      const checkResults = ALLOWED_IP_PREFIXES.map(prefix => ({
        prefix,
        matches: ipData.ip.startsWith(prefix)
      }));
      
      console.log('Prefix check results:', checkResults);
      
      // Check if IP starts with any allowed prefix
      const isAllowed = checkResults.some(result => result.matches);
      
      // Identify the network
      let network = 'Unknown Network';
      if (ipData.ip === '127.0.0.1') network = 'Localhost';
      else if (ipData.ip.startsWith('10.72.177.')) network = 'EMI Network';
      else if (ipData.ip.startsWith('192.168.56.')) network = 'VirtualBox Network';
      
      console.log(`IP ${ipData.ip} identified as: ${network}, Allowed: ${isAllowed}`);
      
      return {
        ip: ipData.ip,
        network,
        isAllowed,
        message: isAllowed 
          ? 'Connected from authorized network' 
          : 'Warning: You appear to be connecting from outside the authorized network',
        checked: true,
        debug: {
          prefixes: ALLOWED_IP_PREFIXES,
          checks: checkResults
        }
      };
    }
    
    return {
      ip: ipData.ip || 'unknown',
      network: 'Unknown',
      isAllowed: false,
      message: ipData.message || 'Could not validate IP address',
      checked: true
    };
  } catch (error) {
    console.error('IP validation error:', error);
    
    // For development, return a success response with localhost
    if (window.location.hostname === 'localhost') {
      return {
        ip: '127.0.0.1',
        network: 'Localhost',
        isAllowed: true,
        message: 'Development mode - localhost',
        checked: true
      };
    }
    
    return {
      ip: 'error',
      network: 'Error',
      isAllowed: false,
      message: 'Error checking network authorization',
      checked: true
    };
  }
};

export default api;