// src/api/ipValidation.js
import React from 'react';
import { validateClientIP, ALLOWED_IP_PREFIXES } from './api';

// Add this function at the top level of the file
const identifyNetwork = (ip) => {
  if (ip.startsWith('10.72.177.')) return 'EMI Network';
  if (ip.startsWith('10.72.')) return 'EMI Network (Other Subnet)';
  if (ip.startsWith('192.168.56.')) return 'VirtualBox Network';
  if (ip === '127.0.0.1') return 'Localhost';
  return 'Unknown Network';
};

// Hook for React components to use IP validation
export const useIPValidation = () => {
  const [ipStatus, setIpStatus] = React.useState({
    ip: 'checking...',
    network: 'Detecting...',
    isAllowed: false,
    message: 'Checking network authorization...',
    checked: false,
    debug: {}
  });

  React.useEffect(() => {
    const checkIP = async () => {
      try {
        console.log('IP validation hook starting...');
        
        // Use the validateClientIP function from api.js
        const result = await validateClientIP();
        console.log('validateClientIP returned:', result);
        
        // Set the state with all the information from the validation
        setIpStatus({
          ...result,
          // Ensure network is properly set
          network: result.network || identifyNetwork(result.ip),
        });
      } catch (error) {
        console.error('Error in IP validation hook:', error);
        setIpStatus({
          ip: 'error',
          network: 'Error',
          isAllowed: false,
          message: 'Error checking network authorization',
          checked: true,
          error: error.toString()
        });
      }
    };

    checkIP();
  }, []);

  return ipStatus;
};

// Export the identifyNetwork function for use elsewhere
export { identifyNetwork };

export default useIPValidation;