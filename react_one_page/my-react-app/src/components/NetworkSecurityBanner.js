// src/components/NetworkSecurityBanner.js
import React, { useState } from 'react';
import { useIPValidation } from '../api/ipValidation';
import { ALLOWED_IP_PREFIXES } from '../api/api';

const NetworkSecurityBanner = () => {
  const { ip, network, isAllowed, message, checked, debug } = useIPValidation();
  // Always declare hooks at the top level, never conditionally
  const [showDebug, setShowDebug] = useState(false);
  
  // Render loading state while checking
  if (!checked) {
    return (
      <div className="bg-gray-100 border-l-4 border-gray-500 text-gray-700 p-2 text-sm">
        <div className="flex items-center">
          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Checking network security status...</p>
        </div>
      </div>
    );
  }
  
  // Create debug panel component
  const debugPanel = showDebug ? (
    <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
      <p><strong>IP:</strong> {ip}</p>
      <p><strong>Network:</strong> {network}</p>
      <p><strong>Allowed:</strong> {isAllowed ? 'Yes' : 'No'}</p>
      <p><strong>Allowed Prefixes:</strong> {JSON.stringify(ALLOWED_IP_PREFIXES)}</p>
      {debug && debug.checks && (
        <div>
          <p><strong>Prefix Checks:</strong></p>
          <ul className="list-disc list-inside">
            {debug.checks.map((check, index) => (
              <li key={index} className={check.matches ? "text-green-600" : "text-red-600"}>
                {check.prefix}: {check.matches ? "Match" : "No Match"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  ) : null;
  
  // Show success banner if IP is allowed
  if (isAllowed) {
    return (
      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 text-sm">
        <div className="flex items-center">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="flex-1">Secure connection: {message} ({ip}) - Network: {network}</p>
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="text-xs underline"
          >
            {showDebug ? "Hide Details" : "Show Details"}
          </button>
        </div>
        {debugPanel}
      </div>
    );
  }
  
  // Show warning if IP is not allowed
  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
      <div className="flex items-center">
        <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <p className="font-bold">Network Security Warning</p>
          <p>{message}</p>
          <p className="text-sm">IP: {ip} - Network: {network}</p>
          <p className="text-sm mt-1">You may experience access restrictions. Please connect from an authorized network.</p>
        </div>
        <button 
          onClick={() => setShowDebug(!showDebug)} 
          className="text-xs underline"
        >
          {showDebug ? "Hide Details" : "Show Details"}
        </button>
      </div>
      {debugPanel}
    </div>
  );
};

export default NetworkSecurityBanner;