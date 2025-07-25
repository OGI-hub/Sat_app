import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import NetworkSecurityBanner from './components/NetworkSecurityBanner';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          {/* Add the NetworkSecurityBanner here, right after Navbar */}
          <NetworkSecurityBanner />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              {/* Route publique */}
              <Route path="/login" element={<Login />} />

              {/* Route protégée - Utilisateur standard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Route protégée - Admin seulement */}
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Redirection par défaut */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Page 404 */}
              <Route path="*" element={
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800">404</h1>
                  <p className="text-xl text-gray-600 mt-4">Page non trouvée</p>
                </div>
              } />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;