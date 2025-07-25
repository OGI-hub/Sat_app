import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { auth, logout } = useAuth();
  
  // Gestion du cas où auth est null
  if (!auth) {
    return (
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="font-bold">Satellite System</Link>
          <Link to="/login" className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded">
            Login
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="font-bold">Satellite System</Link>
        <div className="flex items-center space-x-4">
          <span>Hello, {auth.username}</span>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;