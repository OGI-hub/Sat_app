import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { auth } = useAuth(); // Now this will work as it's inside AuthProvider
  
  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !auth?.isSuperuser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;