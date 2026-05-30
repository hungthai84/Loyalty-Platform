import React, { useState, useEffect } from 'react';
import { X, File as FileIcon, Folder, Map, FileText, Image as ImageIcon, Search, LogOut } from 'lucide-react';
import { googleSignIn, initAuth, getAccessToken, logout } from '../../lib/workspace';

interface GoogleDrivePickerProps {
  onPick: (file: any) => void;
  onCancel: () => void;
}

export function GoogleDrivePicker({ onPick, onCancel }: GoogleDrivePickerProps) {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [folderHistory, setFolderHistory] = useState<{id: string, name: string}[]>([{id: 'root', name: 'My Drive'}]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setNeedsAuth(false);
        fetchFiles(token, 'root');
      },
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        fetchFiles(result.accessToken, 'root');
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setNeedsAuth(true);
    setFiles([]);
  };

  const fetchFiles = async (token: string, folderId: string, query: string = '') => {
    setLoading(true);
    try {
      let q = `'${folderId}' in parents and trashed = false`;
      if (query) {
        q = `name contains '${query}' and trashed = false`;
      }
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,thumbnailLink,iconLink)&orderBy=folder,name`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getAccessToken();
    if (token) {
      fetchFiles(token, currentFolder, searchQuery);
    }
  };

  const handleFileClick = async (file: any) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      const token = await getAccessToken();
      if (token) {
        setCurrentFolder(file.id);
        setFolderHistory([...folderHistory, { id: file.id, name: file.name }]);
        setSearchQuery('');
        fetchFiles(token, file.id);
      }
    } else {
      onPick({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        url: `https://drive.google.com/open?id=${file.id}`
      });
    }
  };

  const handleNavigateBack = async (index: number) => {
    const newHistory = folderHistory.slice(0, index + 1);
    const targetFolder = newHistory[newHistory.length - 1];
    setFolderHistory(newHistory);
    setCurrentFolder(targetFolder.id);
    const token = await getAccessToken();
    if (token) {
      fetchFiles(token, targetFolder.id);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder className="w-5 h-5 text-gray-500" />;
    if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (mimeType.includes('spreadsheet')) return <Map className="w-5 h-5 text-green-600" />;
    return <FileIcon className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Select File from Google Drive</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50/50">
          {needsAuth ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <FileIcon className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Connect Google Drive</h3>
              <p className="text-gray-500 max-w-md">
                Sign in with Google to browse and select files directly from your Drive.
              </p>
              <button 
                onClick={handleLogin} 
                disabled={isLoggingIn}
                className="gsi-material-button mt-4"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{display: 'block'}}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">{isLoggingIn ? 'Signing in...' : 'Sign in with Google'}</span>
                  <span style={{display: 'none'}}>Sign in with Google</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto text-sm text-gray-600 pb-1 flex-1">
                  {folderHistory.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                      <button 
                        onClick={() => handleNavigateBack(index)}
                        className="hover:bg-gray-100 px-2 py-1 rounded transition-colors whitespace-nowrap"
                      >
                        {folder.name}
                      </button>
                      {index < folderHistory.length - 1 && <span className="text-gray-400">/</span>}
                    </React.Fragment>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-sm border-gray-200 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                    />
                  </form>
                  <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Disconnect Google Drive">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 overflow-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No files found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {files.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => handleFileClick(file)}
                        className="flex flex-col items-center p-4 bg-white border border-gray-100 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center group"
                      >
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg mb-3 group-hover:bg-blue-50 transition-colors">
                          {file.thumbnailLink ? (
                            <img src={file.thumbnailLink} alt={file.name} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            getFileIcon(file.mimeType)
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate w-full" title={file.name}>
                          {file.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .gsi-material-button {
          background-color: white;
          background-image: none;
          border: 1px solid #747775;
          border-radius: 4px;
          box-sizing: border-box;
          color: #1f1f1f;
          cursor: pointer;
          font-family: 'Roboto', arial, sans-serif;
          font-size: 14px;
          height: 40px;
          letter-spacing: 0.25px;
          outline: none;
          overflow: hidden;
          padding: 0 12px;
          position: relative;
          text-align: center;
          transition: background-color .218s, border-color .218s, box-shadow .218s;
          vertical-align: middle;
          white-space: nowrap;
          width: auto;
          max-width: 400px;
          min-width: min-content;
        }
        .gsi-material-button .gsi-material-button-icon {
          height: 20px;
          margin-right: 12px;
          min-width: 20px;
          width: 20px;
        }
        .gsi-material-button .gsi-material-button-content-wrapper {
          align-items: center;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          height: 100%;
          justify-content: space-between;
          position: relative;
          width: 100%;
        }
        .gsi-material-button .gsi-material-button-contents {
          flex-grow: 1;
          font-family: 'Roboto', arial, sans-serif;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: top;
        }
        .gsi-material-button .gsi-material-button-state {
          transition: opacity .218s;
          bottom: 0;
          left: 0;
          opacity: 0;
          position: absolute;
          right: 0;
          top: 0;
        }
        .gsi-material-button:disabled {
          cursor: default;
          background-color: #ffffff61;
          border-color: #1f1f1f1f;
        }
        .gsi-material-button:disabled .gsi-material-button-contents {
          opacity: 38%;
        }
        .gsi-material-button:disabled .gsi-material-button-icon {
          opacity: 38%;
        }
        .gsi-material-button:not(:disabled):active .gsi-material-button-state, 
        .gsi-material-button:not(:disabled):focus .gsi-material-button-state {
          background-color: #303030;
          opacity: 12%;
        }
        .gsi-material-button:not(:disabled):hover {
          box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
        }
        .gsi-material-button:not(:disabled):hover .gsi-material-button-state {
          background-color: #303030;
          opacity: 8%;
        }
      `}} />
    </div>
  );
}
