// C:\Users\hp\OneDrive - MSFT\Desktop\Authentification_\react_one_page\my-react-app\src\components\RecentFilesWidget.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const RecentFilesWidget = () => {
  const { auth } = useAuth();
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest first, 'asc' for oldest first

  useEffect(() => {
    if (!auth) return;
    
    const fetchRecentFiles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulated data for now - this will be replaced with actual API call
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data for demonstration
        const mockRecentFiles = [
          {
            satellite_id: 2,
            satellite_name: "MOHAMMEDIA-SAT",
            subsystem_id: 6,
            file_id: 14,
            updated_date: "2025-07-20 14:30:00",
            updated_time_ago: "4 days ago",
            latest_version: 1
          },
          {
            satellite_id: 2,
            satellite_name: "MOHAMMEDIA-SAT",
            subsystem_id: 6,
            file_id: 5,
            updated_date: "2025-07-15 09:45:20",
            updated_time_ago: "9 days ago",
            latest_version: 3
          },
          {
            satellite_id: 1,
            satellite_name: "UM5-EOSAT",
            subsystem_id: 3,
            file_id: 7,
            updated_date: "2025-07-10 16:22:15",
            updated_time_ago: "14 days ago",
            latest_version: 2
          }
        ];
        
        // Sort based on sortOrder
        const sortedFiles = sortOrder === 'desc' 
          ? mockRecentFiles 
          : [...mockRecentFiles].reverse();
          
        setRecentFiles(sortedFiles);
        
        /* Uncomment this when the API endpoint is ready
        const response = await api.get(`/api/files/recent?sort=${sortOrder}`);
        
        if (response.data && response.data.status === "success") {
          setRecentFiles(response.data.data || []);
        } else {
          setError("Failed to fetch recent files");
          setRecentFiles([]);
        }
        */
      } catch (err) {
        console.error("Error fetching recent files:", err);
        setError("Error connecting to server");
        setRecentFiles([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentFiles();
  }, [auth, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recently Updated Files</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recently Updated Files</h2>
        </div>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Recently Updated Files</h2>
        <button 
          onClick={toggleSortOrder}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <span className="mr-1">Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {sortOrder === 'desc' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            )}
          </svg>
        </button>
      </div>
      
      {recentFiles.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satellite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subsystem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentFiles.map((file) => (
                <tr key={`${file.satellite_id}-${file.subsystem_id}-${file.file_id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{file.satellite_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Subsystem {file.subsystem_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">File {file.file_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{file.updated_date}</div>
                    <div className="text-xs text-gray-400">{file.updated_time_ago}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => window.location.href = `/dashboard/satellite/${file.satellite_id}/subsystem/${file.subsystem_id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No recently updated files found.</p>
        </div>
      )}
    </div>
  );
};

export default RecentFilesWidget;