import React, { useState, useEffect } from 'react';
import { X, File as FileIcon, Folder, Map, FileText, Image as ImageIcon, Search, LogOut, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { googleSignIn, initAuth, getAccessToken, logout } from '../../lib/workspace';
import firebaseConfig from '../../../firebase-applet-config.json';
import { toast } from 'sonner';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

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

  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically load Google Client API (gapi)
    let script: HTMLScriptElement | null = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
    
    const loadPicker = () => {
      if (window.gapi) {
        window.gapi.load('picker', {
          callback: () => {
            setPickerLoaded(true);
          },
          onerror: () => {
            setLoadError("Không thể tải thư viện Google Picker");
          }
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGapiLoaded(true);
        loadPicker();
      };
      script.onerror = () => {
        setLoadError("Không thể tải Google API Loader");
      };
      document.body.appendChild(script);
    } else {
      setGapiLoaded(true);
      if (window.gapi) {
        loadPicker();
      }
    }
  }, []);

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

  const openOfficialPicker = async () => {
    const token = await getAccessToken();
    if (!token) {
      toast.error("Vui lòng kết nối Google Drive trước để lấy quyền truy cập!");
      return;
    }

    if (!window.gapi || !window.google || !window.google.picker) {
      toast.error("Không thể khởi động Google Picker trực tiếp. Các trình chặn quảng cáo hoặc cơ chế bảo mật sandbox iframe đang ngăn chặn tải script Google. Vui lòng sử dụng Trình duyệt bên dưới hoặc chạy ứng dụng ở Tab mới.");
      return;
    }

    try {
      const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
      docsView.setMimeTypes("text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.google-apps.spreadsheet");

      const picker = new window.google.picker.PickerBuilder()
        .addView(docsView)
        .setOAuthToken(token)
        .setDeveloperKey(firebaseConfig.apiKey)
        .setAppId(firebaseConfig.projectId)
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0];
            onPick({
              id: doc.id,
              name: doc.name,
              mimeType: doc.mimeType,
              url: doc.url || `https://drive.google.com/open?id=${doc.id}`
            });
          }
        })
        .build();
      picker.setVisible(true);
    } catch (err: any) {
      console.error("Google Picker builder error:", err);
      toast.error("Lỗi khởi tạo Google Picker: " + err.message);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left font-sans">
      <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-100">
        
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
              </svg>
              Kết nối Google Workspace
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Nhập danh sách khách hàng trực tiếp từ Google Drive hoặc Google Picker</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50/50 flex flex-col">
          {needsAuth ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 my-auto">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <FileIcon className="w-8 h-8 text-blue-500 animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Kết nối Tài khoản Google</h3>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                Đăng nhập tài khoản Google của bạn để chọn tệp trực tiếp từ Drive và sử dụng giao diện Google Picker chính thức.
              </p>
              
              <button 
                onClick={handleLogin} 
                disabled={isLoggingIn}
                className="gsi-material-button mt-4 shadow-sm hover:shadow-md border-slate-350 transition-all font-sans"
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
                  <span className="gsi-material-button-contents font-bold">{isLoggingIn ? 'Đang kết nối...' : 'Liên kết tài khoản Google'}</span>
                  <span style={{display: 'none'}}>Sign in with Google</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full flex-1">
              {/* Premium Google Picker Prompt */}
              <div className="p-4 bg-blue-50/50 border-b border-blue-100/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Google Picker Đã Được Kích Hoạt!
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-lg leading-relaxed font-sans">
                    <strong>Khuyên dùng:</strong> Bấm nút bên phải để kích hoạt hộp chọn chính chủ của Google. Hỗ trợ tìm kiếm thông minh, xem biểu mẫu, lọc tệp thuận tiện. Đảm bảo bạn không chặn popup của website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openOfficialPicker}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-[10px] shadow-md hover:shadow-lg transition-all cursor-pointer w-full md:w-auto shrink-0"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
                  </svg>
                  Bật Google Picker chính thức 🔗
                </button>
              </div>

              {/* Inline Browser Navigation */}
              <div className="p-4 bg-white border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1 overflow-x-auto text-xs text-gray-600 pb-1 flex-1 w-full">
                  <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest shrink-0 mr-1">Duyệt nhanh:</span>
                  {folderHistory.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                      <button 
                        type="button"
                        onClick={() => handleNavigateBack(index)}
                        className="hover:bg-gray-100 px-2 py-1 rounded transition-colors whitespace-nowrap font-bold text-gray-700"
                      >
                        {folder.name}
                      </button>
                      {index < folderHistory.length - 1 && <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <form onSubmit={handleSearch} className="relative flex-1 sm:flex-initial">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm tệp..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-4 py-1.5 text-xs border-gray-200 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-36 bg-gray-50/50"
                    />
                  </form>
                  <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[10px] transition-colors cursor-pointer" title="Đăng xuất Google">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subfiles & Folder Visuals */}
              <div className="p-4 flex-1 overflow-auto bg-gray-50/20 max-h-[40vh]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-white rounded-[10px] border border-dashed border-gray-200 p-8 max-w-md mx-auto my-4">
                    <FileIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-xs">Không có tệp CSV hoặc trang tính phù hợp tại đây.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {files.map((file) => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => handleFileClick(file)}
                        className="flex flex-col items-center p-3 bg-white border border-gray-150 rounded-[10px] hover:border-blue-500 hover:shadow-sm transition-all text-center group cursor-pointer"
                      >
                        <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-[10px] mb-2 group-hover:bg-blue-50 transition-colors">
                          {file.thumbnailLink ? (
                            <img src={file.thumbnailLink} alt={file.name} referrerPolicy="no-referrer" className="w-8 h-8 object-cover rounded" />
                          ) : (
                            getFileIcon(file.mimeType)
                          )}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 truncate w-full px-1" title={file.name}>
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
          border-radius: 8px;
          box-sizing: border-box;
          color: #1f1f1f;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          height: 38px;
          letter-spacing: 0.25px;
          outline: none;
          overflow: hidden;
          padding: 0 16px;
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
          height: 18px;
          margin-right: 10px;
          min-width: 18px;
          width: 18px;
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
          font-weight: 600;
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
