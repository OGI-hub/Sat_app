import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

const SatelliteDashboard = ({ adminMode = false, initialSearchResults = null }) => {
  const { auth } = useAuth();
  const [satellites, setSatellites] = useState([]);
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [subsystems, setSubsystems] = useState([]);
  const [selectedSubsystem, setSelectedSubsystem] = useState(null);
  const [files, setFiles] = useState([]);
  const [fileVersions, setFileVersions] = useState({});
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState({
    satellites: false,
    subsystems: false,
    files: false,
    versions: false,
    metadata: false,
    download: false
  });
  const [error, setError] = useState(null);

  // Chargement initial des satellites
  useEffect(() => {
    if (!auth) return; // Only fetch if authenticated
    
    const fetchSatellites = async () => {
      setLoading(prev => ({...prev, satellites: true}));
      try {
        const response = await api.get('/api/satellites/');
        console.log("Satellites response:", response.data);
        setSatellites(response.data.data.satellites || []);
      } catch (err) {
        console.error("Satellite fetch error:", err);
        setError({ type: 'error', message: "Failed to fetch satellites list" });
      } finally {
        setLoading(prev => ({...prev, satellites: false}));
      }
    };

    fetchSatellites();
  }, [auth]);

  
  // Chargement des sous-systèmes quand un satellite est sélectionné
  useEffect(() => {
    if (!auth || !selectedSatellite) return;

    const fetchSubsystems = async () => {
      setLoading(prev => ({...prev, subsystems: true}));
      setSelectedSubsystem(null);
      setFiles([]);
      setFileVersions({});
      
      try {
        const response = await api.get(
          `/api/satellites/${selectedSatellite}/subsystems/`
        );
        console.log("Subsystems response:", response.data);
        // Utilisez response.data.subsystems et item.id
        const subsystemsData = response.data.subsystems.map(item => item.id);
        setSubsystems(subsystemsData);
      } catch (err) {
        console.error("Subsystems error:", err);
        setError({ 
          type: 'error', 
          message: `Erreur: ${err.response?.data?.detail || err.message}`
        });
      } finally {
        setLoading(prev => ({...prev, subsystems: false}));
      }
    };

    fetchSubsystems();
  }, [auth, selectedSatellite]);

  useEffect(() => {
    if (initialSearchResults && initialSearchResults.length > 0) {
      // Pre-select the satellite from the first search result
      const firstResult = initialSearchResults[0];
      setSelectedSatellite(firstResult.satellite_id);
      
      // When the satellite is set, the subsystems will be loaded
      // Then we can set the subsystem in another useEffect
    }
  }, [initialSearchResults]);

  useEffect(() => {
    if (initialSearchResults && initialSearchResults.length > 0 && subsystems.length > 0) {
      const firstResult = initialSearchResults[0];
      if (firstResult.subsystem_id && subsystems.includes(firstResult.subsystem_id)) {
        setSelectedSubsystem(firstResult.subsystem_id);
      }
    }
  }, [initialSearchResults, subsystems]);

  // Chargement des fichiers quand un sous-système est sélectionné
  useEffect(() => {
    if (!auth || !selectedSatellite || !selectedSubsystem) return;

    const fetchFiles = async () => {
      setLoading(prev => ({...prev, files: true}));
      setFileVersions({});
      
      try {
        const response = await api.get(
          `/api/satellites/${selectedSatellite}/subsystems/${selectedSubsystem}/files/`
        );
        console.log("Files response:", response.data);
        // Correction clé ici - vérification de la réponse et fallback
        const filesData = response.data?.files || [];
        setFiles(filesData);
      } catch (err) {
        console.error("Files error:", err);
        setError({ 
          type: 'error', 
          message: `Failed to fetch files: ${err.response?.data?.detail || err.message}`
        });
        setFiles([]); // Réinitialiser à un tableau vide en cas d'erreur
      } finally {
        setLoading(prev => ({...prev, files: false}));
      }
    };

    fetchFiles();
  }, [auth, selectedSatellite, selectedSubsystem]);

  // Function to toggle versions display
  const toggleVersions = (fileId) => {
    setFileVersions(prev => {
      // If versions are already showing, hide them
      if (prev[fileId]) {
        const newVersions = {...prev};
        delete newVersions[fileId];
        return newVersions;
      }
      // Otherwise, return the same state (to be filled in by getFileVersions)
      return prev;
    });
    
    // If we're hiding versions, we're done
    if (fileVersions[fileId]) {
      return;
    }
    
    // Otherwise, fetch versions
    getFileVersions(fileId);
  };

  // Chargement des versions pour un fichier
  const getFileVersions = async (fileId) => {
    if (!auth || !selectedSatellite || !selectedSubsystem || !fileId) return;

    setLoading(prev => ({...prev, versions: true}));
    setMetadata(null);
    
    try {
      const url = `/api/satellites/${selectedSatellite}/subsystems/${selectedSubsystem}/files/${fileId}/`;
      console.log(`Fetching versions from: ${url}`);
      
      const response = await api.get(url);
      console.log("Versions response:", response.data);
      
      // Check if response data has the expected structure
      if (response.data && response.data.status === "success") {
        setFileVersions(prev => ({
          ...prev,
          [fileId]: response.data.data || []
        }));
      } else {
        console.warn("Unexpected response structure:", response.data);
        setError({ 
          type: 'error', 
          message: "Server returned data in unexpected format" 
        });
        // Set empty array to avoid UI issues
        setFileVersions(prev => ({
          ...prev,
          [fileId]: []
        }));
      }
    } catch (err) {
      console.error("Versions error:", err);
      
      // Get detailed error information
      const errorDetails = err.response?.data || err.message;
      console.error("Error details:", errorDetails);
      
      setError({ 
        type: 'error', 
        message: `Failed to fetch file versions: ${JSON.stringify(errorDetails)}` 
      });
      
      // If there's no versions data, set an empty array
      setFileVersions(prev => ({
        ...prev,
        [fileId]: []
      }));
    } finally {
      setLoading(prev => ({...prev, versions: false}));
    }
  };

  const getFileMetadata = async (fileId, fileVer) => {
    if (!auth || !selectedSatellite || !selectedSubsystem || !fileId || !fileVer) return;

    setLoading(prev => ({...prev, metadata: true}));
    
    try {
      // Add trailing slash to URL
      const url = `/api/satellites/${selectedSatellite}/subsystems/${selectedSubsystem}/files/${fileId}/version/${fileVer}/`;
      console.log(`Fetching metadata from: ${url}`);
      
      const response = await api.get(url);
      console.log("Metadata response:", response.data);
      
      if (response.data && response.data.status === "success") {
        setMetadata(response.data.data || {});
      } else {
        console.warn("Unexpected metadata response:", response.data);
        setError({ 
          type: 'error', 
          message: "Failed to get metadata: Server returned unexpected data format" 
        });
      }
    } catch (err) {
      console.error("Metadata error:", err);
      const errorDetails = err.response?.data?.detail || err.message;
      setError({ 
        type: 'error', 
        message: `Failed to fetch metadata: ${errorDetails}` 
      });
    } finally {
      setLoading(prev => ({...prev, metadata: false}));
    }
  };

  const downloadFile = async (fileId, fileVer) => {
    if (!auth || !selectedSatellite || !selectedSubsystem || !fileId || !fileVer) return;

    setLoading(prev => ({...prev, download: true}));
    
    try {
      // Add trailing slash to URL
      const url = `/api/satellites/${selectedSatellite}/subsystems/${selectedSubsystem}/files/${fileId}/version/${fileVer}/download/`;
      console.log(`Downloading file from: ${url}`);
      
      const response = await api.get(url, { responseType: "blob" });
      console.log("Download response received");
      
      // Create download link
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `sat${selectedSatellite}_sub${selectedSubsystem}_file${fileId}_v${fileVer}.bin`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      // Clean up URL object
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (err) {
      console.error("Download error:", err);
      const errorDetails = err.response?.data?.detail || err.message;
      setError({ 
        type: 'error', 
        message: `Failed to download file: ${errorDetails}` 
      });
    } finally {
      setLoading(prev => ({...prev, download: false}));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {!adminMode && (
        <div className="bg-space-blue text-white p-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-3xl font-bold">Satellite Data Management</h1>
          <p className="text-accent-light mt-2">
            Interactive dashboard for satellite data exploration
          </p>
        </div>
      )}

      {/* Satellite Selection */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Satellite Selection</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Satellite</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => setSelectedSatellite(parseInt(e.target.value))}
              value={selectedSatellite || ""}
              disabled={loading.satellites}
            >
              <option value="" disabled>-- Select --</option>
              {satellites.map((sat) => (
                <option key={sat.id} value={sat.id}>
                  {sat.name} (ID: {sat.id})
                </option>
              ))}
            </select>
          </div>
          
          {selectedSatellite && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Subsystem</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => setSelectedSubsystem(parseInt(e.target.value))}
                value={selectedSubsystem || ""}
                disabled={loading.subsystems || !selectedSatellite}
              >
                <option value="" disabled>-- Select --</option>
                {subsystems.map((subId) => (
                  <option key={subId} value={subId}>
                    Subsystem {subId}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Loading Indicators */}
      {loading.subsystems && (
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <p className="text-gray-600">Loading subsystems...</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '50%' }}></div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="font-medium">Error: {error.message || "Le fichier ne contient aucune version!!"}</p>
          </div>
          {/* Add a dismiss button */}
          <div className="mt-2 flex justify-end">
            <button 
              onClick={() => setError(null)} 
              className="text-sm text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Files List */}
      {selectedSubsystem && files.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Files in Subsystem {selectedSubsystem}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <React.Fragment key={file.file_id}>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">File {file.file_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => toggleVersions(file.file_id)}
                          className={`${loading.versions ? 'opacity-50 cursor-not-allowed' : 'text-blue-600 hover:text-blue-900'} mr-3`}
                          disabled={loading.versions}
                        >
                          {fileVersions[file.file_id] ? 'Hide Versions' : 'Show Versions'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Versions for this file */}
                    {fileVersions[file.file_id] && (
                      <tr>
                        <td colSpan="2" className="px-6 py-4 bg-gray-50">
                          <div className="ml-8">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Versions:</h4>
                            {fileVersions[file.file_id].length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {fileVersions[file.file_id].map((version) => (
                                  <div key={version.file_ver} className="bg-gray-100 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="text-xs font-medium text-gray-500">Version:</span>
                                        <p className="text-sm font-semibold">{version.file_ver}</p>
                                      </div>
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => getFileMetadata(file.file_id, version.file_ver)}
                                          className={`${loading.metadata ? 'opacity-50 cursor-not-allowed' : 'text-green-600 hover:text-green-800'} text-xs`}
                                          disabled={loading.metadata}
                                        >
                                          Metadata
                                        </button>
                                        <button
                                          onClick={() => downloadFile(file.file_id, version.file_ver)}
                                          className={`${loading.download ? 'opacity-50 cursor-not-allowed' : 'text-purple-600 hover:text-purple-800'} text-xs`}
                                          disabled={loading.download}
                                        >
                                          Download
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-yellow-50 p-4 rounded border border-yellow-100 text-yellow-800">
                                <p className="text-center">No versions found for this file</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metadata Display */}
      {metadata && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">File Metadata</h3>
            <button
              onClick={() => setMetadata(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          
          <div className="space-y-6">
            {/* File Information Section */}
            {metadata["File Information"] && (
              <div>
                <h4 className="text-md font-medium text-blue-600 mb-3 border-b pb-2">
                  File Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(metadata["File Information"]).map(([key, value]) => (
                    <div key={key} className="flex">
                      <div className="w-1/3 font-medium text-gray-600">{key}:</div>
                      <div className="w-2/3 text-gray-800">
                        {key === "Status" ? (
                          <span className={value === "Active" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {value}
                          </span>
                        ) : (
                          value
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps Section */}
            {metadata["Timestamps"] && (
              <div>
                <h4 className="text-md font-medium text-blue-600 mb-3 border-b pb-2">
                  Timestamps
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(metadata["Timestamps"]).map(([key, value]) => (
                    <div key={key} className="flex">
                      <div className="w-1/3 font-medium text-gray-600">{key}:</div>
                      <div className="w-2/3 text-gray-800">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Storage Information Section */}
            {metadata["Storage Information"] && (
              <div>
                <h4 className="text-md font-medium text-blue-600 mb-3 border-b pb-2">
                  Storage Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(metadata["Storage Information"]).map(([key, value]) => (
                    <div key={key} className="flex">
                      <div className="w-1/3 font-medium text-gray-600">{key}:</div>
                      <div className="w-2/3 text-gray-800">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message (if present) */}
            {metadata.Message && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded text-yellow-800">
                <div className="font-medium">Note:</div>
                <div>{metadata.Message}</div>
              </div>
            )}
            
            {/* For direct error display or simple metadata format */}
            {!metadata["File Information"] && !metadata["Timestamps"] && !metadata.Message && (
              <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm text-gray-800">{JSON.stringify(metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty States */}
      {selectedSubsystem && !loading.files && files.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p className="text-gray-500">No files found for this subsystem</p>
        </div>
      )}
    </div>
  );
};

export default SatelliteDashboard;