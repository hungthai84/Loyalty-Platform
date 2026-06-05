import React, { useState, useRef, useEffect } from "react";
import { 
 X, Upload, AlertCircle, CheckCircle2, ArrowLeft, 
 ChevronRight, Play, Loader2, Table as TableIcon, RefreshCw,
 Users, LogOut, Search
} from "lucide-react";
import * as motion from "motion/react-client";
import { db } from "@/lib/firebase";
import { doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { AttributeDefinition, Company } from "@/types";
import { toast } from "sonner";
import { GoogleDrivePicker } from "../drive/GoogleDrivePicker";
import { downloadDriveFile, googleSignIn, initAuth, logout, fetchGoogleContacts, GoogleContact } from "../../lib/workspace";

interface ImportCustomersDialogProps {
 onClose: () => void;
 attributes: AttributeDefinition[];
 companies: Company[];
 userId: string;
}

interface MappingField {
 key: string;
 label: string;
 isCustom: boolean;
 type: "text" | "number" | "boolean";
 required?: boolean;
}

// Custom robust CSV parser that handles quotes, escaping, and line breaks
function parseCSV(text: string): string[][] {
 const lines: string[][] = [];
 let row: string[] = [];
 let inQuotes = false;
 let currentVal = '';

 for (let i = 0; i < text.length; i++) {
 const char = text[i];
 const nextChar = text[i + 1];

 if (char === '"') {
 if (inQuotes && nextChar === '"') {
 currentVal += '"';
 i++; // skip next quote
 } else {
 inQuotes = !inQuotes;
 }
 } else if (char === ',' && !inQuotes) {
 row.push(currentVal.trim());
 currentVal = '';
 } else if ((char === '\r' || char === '\n') && !inQuotes) {
 if (char === '\r' && nextChar === '\n') {
 i++; // skip standard CRLF
 }
 row.push(currentVal.trim());
 if (row.length > 1 || row[0] !== '') {
 lines.push(row);
 }
 row = [];
 currentVal = '';
 } else {
 currentVal += char;
 }
 }
 if (row.length > 0 || currentVal !== '') {
 row.push(currentVal.trim());
 lines.push(row);
 }
 return lines;
}

export function ImportCustomersDialog({ onClose, attributes, companies, userId }: ImportCustomersDialogProps) {
 const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
 const [dragActive, setDragActive] = useState(false);
 const [fileName, setFileName] = useState("");
 const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
 const [csvRows, setCsvRows] = useState<string[][]>([]);

 // Source selection & Contacts states
 const [sourceMode, setSourceMode] = useState<"csv" | "contacts">("csv");
 const [googleContacts, setGoogleContacts] = useState<GoogleContact[]>([]);
 const [filteredContacts, setFilteredContacts] = useState<GoogleContact[]>([]);
 const [selectedContactIds, setSelectedContactIds] = useState<Record<string, boolean>>({});
 const [contactsLoading, setContactsLoading] = useState(false);
 const [contactsSearch, setContactsSearch] = useState("");
 const [contactsNeedsAuth, setContactsNeedsAuth] = useState(true);
 const [isContactsAuthLoading, setIsContactsAuthLoading] = useState(false);

 const loadContacts = async () => {
   setContactsLoading(true);
   try {
     const data = await fetchGoogleContacts();
     setGoogleContacts(data);
     setFilteredContacts(data);
     // Select all by default
     const initialSelected: Record<string, boolean> = {};
     data.forEach(item => {
       initialSelected[item.resourceName] = true;
     });
     setSelectedContactIds(initialSelected);
   } catch (err: any) {
     toast.error(err.message || "Không thể tải danh bạ Google.");
   } finally {
     setContactsLoading(false);
   }
 };

 useEffect(() => {
   if (sourceMode === "contacts") {
     const unsubscribe = initAuth(
       async (user, token) => {
         setContactsNeedsAuth(false);
         loadContacts();
       },
       () => setContactsNeedsAuth(true)
     );
     return () => unsubscribe();
   }
 }, [sourceMode]);

 const handleContactsLogin = async () => {
   setIsContactsAuthLoading(true);
   try {
     const result = await googleSignIn();
     if (result) {
       setContactsNeedsAuth(false);
       loadContacts();
     }
   } catch (err: any) {
     toast.error("Đăng nhập Google thất bại: " + err.message);
   } finally {
     setIsContactsAuthLoading(false);
   }
 };

 const handleContactsLogout = async () => {
   await logout();
   setContactsNeedsAuth(true);
   setGoogleContacts([]);
   setFilteredContacts([]);
 };

 const handleContactsSearchChange = (val: string) => {
   setContactsSearch(val);
   const lower = val.toLowerCase();
   const filtered = googleContacts.filter(c => 
     c.name.toLowerCase().includes(lower) || 
     c.email.toLowerCase().includes(lower) || 
     c.phone.toLowerCase().includes(lower)
   );
   setFilteredContacts(filtered);
 };

 const toggleSelectAllContacts = () => {
   const allSelected = filteredContacts.every(c => selectedContactIds[c.resourceName]);
   const newState = { ...selectedContactIds };
   filteredContacts.forEach(c => {
     newState[c.resourceName] = !allSelected;
   });
   setSelectedContactIds(newState);
 };

 const toggleContactSelected = (id: string) => {
   setSelectedContactIds(prev => ({
     ...prev,
     [id]: !prev[id]
   }));
 };

 const executeContactsImport = async () => {
   const selectedList = filteredContacts.filter(c => selectedContactIds[c.resourceName]);
   if (selectedList.length === 0) {
     toast.error("Vui lòng chọn ít nhất 1 liên hệ để nhập!");
     return;
   }

   setStep(4);
   setImporting(true);
   setImportProgress(0);

   const customersToImport = selectedList.map(item => {
     const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
     const cleanPhone = item.phone.trim();
     return {
       id: `KH-GCON-${randHex}`,
       userId,
       name: item.name,
       email: item.email || "",
       phone: cleanPhone || "",
       points: 0,
       activityStatus: "NEW_MEMBER",
       createdAt: serverTimestamp(),
       updatedAt: serverTimestamp(),
       customFields: {}
     };
   });

   try {
     const batchSize = 100;
     let loaded = 0;

     for (let i = 0; i < customersToImport.length; i += batchSize) {
       const chunk = customersToImport.slice(i, i + batchSize);
       const batch = writeBatch(db);

       chunk.forEach(cust => {
         const docRef = doc(db, `customers`, cust.id);
         batch.set(docRef, cust);
       });

       await batch.commit();
       loaded += chunk.length;
       setImportProgress(Math.round((loaded / customersToImport.length) * 100));
       setImportedCount(loaded);
     }

     toast.success(`Đã đồng bộ thành công ${loaded} liên hệ vào CRM!`);
   } catch (err: any) {
     console.error(err);
     toast.error(`Có lỗi xảy ra khi nhập danh bạ: ${err.message || err}`);
   } finally {
     setImporting(false);
   }
 };
 
 // Mapping of [Database Field Key] -> [CSV Column Index]
 const [mappings, setMappings] = useState<Record<string, number>>({});
 const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [isDownloadingDriveFile, setIsDownloadingDriveFile] = useState(false);

 // Firestore execution states
 const [importing, setImporting] = useState(false);
 const [importProgress, setImportProgress] = useState(0);
 const [importedCount, setImportedCount] = useState(0);

 // Field definitions to map to
 const standardFields: MappingField[] = [
 { key: "name", label: "Họ tên khách hàng", isCustom: false, type: "text", required: true },
 { key: "email", label: "Địa chỉ Email", isCustom: false, type: "text" },
 { key: "phone", label: "Số điện thoại", isCustom: false, type: "text" },
 { key: "points", label: "Điểm CRM khởi tạo", isCustom: false, type: "number" },
 { key: "facebook", label: "Link FB", isCustom: false, type: "text" },
 { key: "zalo", label: "SĐT Zalo hoặc ID", isCustom: false, type: "text" },
 { key: "linkedin", label: "LinkedIn", isCustom: false, type: "text" },
 { key: "instagram", label: "Instagram", isCustom: false, type: "text" },
 { key: "tiktok", label: "TikTok", isCustom: false, type: "text" },
 { key: "companyId", label: "Chi nhánh / Công ty (Mã ID)", isCustom: false, type: "text" },
 ];

 const customFields: MappingField[] = attributes.map(attr => ({
 key: attr.key,
 label: `${attr.label} (Trường tùy chỉnh)`,
 isCustom: true,
 type: attr.type === "number" ? "number" : attr.type === "boolean" ? "boolean" : "text",
 }));

 const allFields = [...standardFields, ...customFields];

 const handleDrag = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 if (e.type === "dragenter" || e.type === "dragover") {
 setDragActive(true);
 } else if (e.type === "dragleave") {
 setDragActive(false);
 }
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setDragActive(false);

 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 processFile(e.dataTransfer.files[0]);
 }
 };

 const handleDriveFilePicked = async (file: any) => {
    setShowDrivePicker(false);
    setIsDownloadingDriveFile(true);
    setFileName(file.name);
    try {
      const text = await downloadDriveFile(file.id);
      processTextContent(text);
    } catch (error: any) {
      toast.error("Lỗi khi tải tệp từ Google Drive: " + error.message);
      setFileName("");
    } finally {
      setIsDownloadingDriveFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 processFile(e.target.files[0]);
 }
 };

 const processFile = (file: File) => {
 if (!file.name.endsWith(".csv")) {
 toast.error("Vui lòng tải lên tệp định dạng .CSV");
 return;
 }

 setFileName(file.name);
 const reader = new FileReader();
 reader.onload = (e) => {
 const text = e.target?.result as string;
 if (!text) return;

 processTextContent(text);
 };
 reader.readAsText(file, "UTF-8");
  };

  const processTextContent = (text: string) => {
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      toast.error("Tệp CSV không có dữ liệu!");
      return;
    }

    const headers = parsed[0];
    const rows = parsed.slice(1);

    setCsvHeaders(headers);
    setCsvRows(rows);

    const initialMappings: Record<string, number> = {};
    allFields.forEach(field => {
      const fieldNorm = field.label.toLowerCase().replace(/\s+/g, "");
      const keyNorm = field.key.toLowerCase();
      
      const foundIndex = headers.findIndex(h => {
        const hNorm = h.toLowerCase().replace(/\s+/g, "");
        return hNorm.includes(fieldNorm) || fieldNorm.includes(hNorm) || 
               hNorm.includes(keyNorm) || keyNorm.includes(hNorm);
      });

      if (foundIndex !== -1) {
        initialMappings[field.key] = foundIndex;
      }
    });

    setMappings(initialMappings);
    setStep(2);
  };

 // Convert mapped values & preview details
 const getMappedPreviewData = () => {
 return csvRows.slice(0, 5).map((row) => {
 const obj: Record<string, any> = {};
 allFields.forEach(f => {
 const colIndex = mappings[f.key];
 if (colIndex !== undefined && colIndex !== -1 && row[colIndex] !== undefined) {
 let val: any = row[colIndex];
 if (f.type === "number") {
 const parsedNum = parseFloat(val.replace(/[^\d.-]/g, ''));
 val = isNaN(parsedNum) ? 0 : parsedNum;
 } else if (f.type === "boolean") {
 val = ["true", "yes", "có", "1", "thật"].includes(val.toLowerCase().trim());
 }
 obj[f.key] = val;
 }
 });
 return obj;
 });
 };

 // Run validation checks
 const validateMappings = () => {
 // Check if Name which is required is mapped
 if (mappings["name"] === undefined || mappings["name"] === -1) {
 toast.error("Bắt buộc phải ánh xạ cột 'Họ tên khách hàng'.");
 return false;
 }
 return true;
 };

 const executeImport = async () => {
 if (!validateMappings()) return;
 setStep(4);
 setImporting(true);
 setImportProgress(0);

 const mappedCustomers: any[] = [];

 // Translate all rows based on mappings
 csvRows.forEach((row, rowIndex) => {
 const customerObj: any = {
 userId,
 createdAt: serverTimestamp(),
 updatedAt: serverTimestamp(),
 activityStatus: "NEW_MEMBER", // Default customer is classified as a new member
 customFields: {}
 };

 let hasData = false;

 allFields.forEach(f => {
 const colIndex = mappings[f.key];
 if (colIndex !== undefined && colIndex !== -1 && row[colIndex] !== undefined && row[colIndex] !== "") {
 hasData = true;
 let val: any = row[colIndex];
 if (f.type === "number") {
 const numStr = val.replace(/[^\d.-]/g, '');
 const parsedNum = parseFloat(numStr);
 val = isNaN(parsedNum) ? 0 : parsedNum;
 } else if (f.type === "boolean") {
 val = ["true", "1", "yes", "có", "active"].includes(String(val).toLowerCase().trim());
 }

 if (f.isCustom) {
 customerObj.customFields[f.key] = val;
 } else {
 customerObj[f.key] = val;
 }
 }
 });

 // Special case: make sure we have a solid generated id or fallback name
 if (hasData && customerObj.name) {
 // Auto-generate ID if name is provided, clean email
 if (!customerObj.id) {
 // Generate customized alphanumeric code like VIP-XXXXXX
 const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
 customerObj.id = `KH-${randHex}`;
 }
 mappedCustomers.push(customerObj);
 }
 });

 if (mappedCustomers.length === 0) {
 toast.error("Không tìm thấy dòng hợp lệ nào để nhập!");
 setImporting(false);
 return;
 }

 try {
 // Chunk batches of 500 records (Firestore batch limit)
 const batchSize = 100;
 let loaded = 0;

 for (let i = 0; i < mappedCustomers.length; i += batchSize) {
 const chunk = mappedCustomers.slice(i, i + batchSize);
 const batch = writeBatch(db);

 chunk.forEach(cust => {
 const docRef = doc(db, `customers`, cust.id);
 batch.set(docRef, cust);
 });

 await batch.commit();
 loaded += chunk.length;
 setImportProgress(Math.round((loaded / mappedCustomers.length) * 100));
 setImportedCount(loaded);
 }

 toast.success(`Đã nhập thành phố dữ liệu ${loaded} khách hàng thành công!`);
 } catch (err: any) {
 console.error(err);
 toast.error(`Có lỗi xảy ra trong quá trình nhập: ${err.message || err}`);
 } finally {
 setImporting(false);
 }
 };

 return (
 <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 15 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 15 }}
 className="bg-card border border-border/80 shadow-2xl w-full max-w-4xl max-h-[90vh] rounded-[2rem] overflow-hidden flex flex-col text-left"
 >
 {/* Header toolbar */}
 <div className="p-6 border-b border-border/60 flex items-center justify-between bg-primary/5">
 <div>
 <span className="text-xs font-black tracking-widest text-[#2f6cf5] bg-[#2f6cf5]/10 px-2.5 py-1 rounded-full uppercase">
 Công cụ CRM
 </span>
 <h4 className="text-xl font-black font-heading tracking-tight text-foreground mt-2">
 Nhập danh sách khách hàng hàng loạt
 </h4>
 </div>
 <button 
 type="button"
 onClick={onClose}
 className="w-10 h-10 rounded-full border border-border/80 hover:bg-muted/50 cursor-pointer flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Progress Timeline steps */}
 <div className="px-8 py-3.5 bg-muted/40 border-b border-border/50 flex items-center gap-6 text-xs font-bold text-muted-foreground select-none">
 <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : ''}`}>
 <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'bg-primary text-primary-foreground' : step > 1 ? 'bg-primary/20 text-primary' : 'bg-border'}`}>1</span>
 <span>Tải tệp CSV</span>
 </div>
 <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
 <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : ''}`}>
 <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-primary text-primary-foreground' : step > 2 ? 'bg-primary/20 text-primary' : 'bg-border'}`}>2</span>
 <span>Ánh xạ cột dữ liệu</span>
 </div>
 <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
 <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : ''}`}>
 <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-primary text-primary-foreground' : step > 3 ? 'bg-primary/20 text-primary' : 'bg-border'}`}>3</span>
 <span>Kiểm duyệt & Thử nghiệm</span>
 </div>
 <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
 <div className={`flex items-center gap-2 ${step >= 4 ? 'text-primary' : ''}`}>
 <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step === 4 ? 'bg-primary text-primary-foreground' : 'bg-border'}`}>4</span>
 <span>Thực hiện nhập</span>
 </div>
 </div>

 {/* Form panel bodies */}
 <div className="flex-1 overflow-y-auto p-6 space-y-4">
 
 {/* STEP 1: SELECT SOURCE METHOD (CSV vs GOOGLE CONTACTS) */}

  {step === 1 && (
  <div className="space-y-5 py-2 font-sans">
    {/* Tabs for source selection */}
    <div className="grid grid-cols-2 gap-4 border-b border-border/40 pb-4">
      <button
        type="button"
        onClick={() => setSourceMode("csv")}
        className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 font-bold text-xs border transition-all cursor-pointer ${
          sourceMode === "csv"
            ? "bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5] shadow-xs"
            : "bg-background border-border hover:bg-muted text-muted-foreground hover:text-foreground"
        }`}
      >
        <TableIcon className="w-5 h-5" />
        Nhập từ tệp CSV / Google Drive
      </button>
      <button
        type="button"
        onClick={() => setSourceMode("contacts")}
        className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 font-bold text-xs border transition-all cursor-pointer ${
          sourceMode === "contacts"
            ? "bg-[#2f6cf5]/10 text-[#2f6cf5] border-[#2f6cf5] shadow-xs"
            : "bg-background border-border hover:bg-muted text-muted-foreground hover:text-foreground"
        }`}
      >
        <Users className="w-5 h-5" />
        Nhập từ Danh bạ Google (Contacts)
      </button>
    </div>

    {sourceMode === "csv" ? (
      <div className="space-y-4">
        <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
        dragActive 
        ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" 
        : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
        }`}
        >
        <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv" 
        className="hidden" 
        />
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Upload className="w-8 h-8" />
        </div>
        <div className="space-y-1">
        <p className="text-sm font-bold text-foreground">Kéo thả tệp thư mục CSV vào đây</p>
        <p className="text-xs text-muted-foreground">Hoặc nhấp để chọn tệp tin từ máy tính định dạng .CSV</p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted hover:bg-muted/80 py-1.5 px-3.5 rounded-full border border-border/40">
        Hỗ trợ tối đa 5,000 khách hàng mỗi lượt tải lên
        </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-2">
          <span className="text-xs text-muted-foreground/80">Bạn cũng có thể duyệt tìm tệp CSV từ lưu trữ đám mây:</span>
          <button
            type="button"
            onClick={() => setShowDrivePicker(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-muted hover:bg-muted/85 text-foreground px-4 py-2.5 rounded-xl border border-border/60 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Thêm tệp từ Google Drive
          </button>
        </div>

        {/* Sample standard template help */}
        <div className="bg-muted/40 p-4 rounded-2xl border border-border/40 text-left space-y-2">
        <span className="text-xs font-black uppercase text-muted-foreground tracking-widest block">Mẫu tệp CSV tiêu chuẩn gợi ý</span>
        <p className="text-xs text-muted-foreground">Hệ thống phân tích thông minh sẽ tự động liên kết các cột dựa trên tên tiêu đề. Bạn có thể xây dựng CSV với các dòng tương ứng:</p>
        <div className="text-xs p-3 bg-card border border-border/80 rounded-xl text-foreground overflow-x-auto whitespace-nowrap">
        Họ tên, Email, Số điện thoại, Điểm số, Link FB, Zalo, Mã chi nhánh, v.v.
        </div>
        </div>
      </div>
    ) : (
      /* GOOGLE CONTACTS FLOW */
      <div className="space-y-4">
        {contactsNeedsAuth ? (
          <div className="border border-border/60 rounded-3xl p-8 bg-muted/20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center border border-blue-500/15">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-sm font-sans">
              <h5 className="font-heading font-black text-sm text-foreground">Kết nối Danh bạ Google Contacts</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ủy quyền quyền truy cập danh bạ an toàn qua Google People API để hiển thị, lọc danh sách cá nhân và thêm trực tiếp vào CRM.
              </p>
            </div>
            <button
              type="button"
              onClick={handleContactsLogin}
              disabled={isContactsAuthLoading}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isContactsAuthLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang khởi tạo oauth...
                </>
              ) : (
                <>
                  Kết nối tài khoản Google
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 font-sans">
            {/* Search, metrics and logout */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-muted/45 p-3.5 rounded-2xl border border-border/50">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Lọc liên hệ theo tên, SĐT hoặc email..."
                  value={contactsSearch}
                  onChange={(e) => handleContactsSearchChange(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs border border-border/80 bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 animate-none"
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground font-mono">
                  Phát hiện: <strong>{filteredContacts.length}</strong> / {googleContacts.length}
                </span>
                <button
                  type="button"
                  onClick={handleContactsLogout}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 border border-rose-500/15 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" /> Đăng xuất
                </button>
              </div>
            </div>

            {/* Contacts Table / Checklist view */}
            <div className="border border-border/80 rounded-2xl overflow-hidden max-h-[250px] overflow-y-auto shadow-xs bg-card">
              {contactsLoading ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">Đang lấy dữ liệu từ Google Contacts API...</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground text-xs space-y-1">
                  <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/55 mb-2" />
                  <p className="font-bold">Không tìm thấy liên hệ nào</p>
                  <p>Vui lòng thử tìm kiếm với từ khóa khác.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-muted text-muted-foreground font-bold tracking-wider uppercase text-[10px] border-b border-border sticky top-0 z-10">
                    <tr>
                      <th className="p-3 w-10">
                        <input
                          type="checkbox"
                          checked={filteredContacts.length > 0 && filteredContacts.every(c => selectedContactIds[c.resourceName])}
                          onChange={toggleSelectAllContacts}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/30 outline-none cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Liên hệ</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Số điện thoại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredContacts.map(c => {
                      const isSelected = !!selectedContactIds[c.resourceName];
                      return (
                        <tr
                          key={c.resourceName}
                          onClick={() => toggleContactSelected(c.resourceName)}
                          className={`hover:bg-muted/20 cursor-pointer ${isSelected ? 'bg-[#2f6cf5]/5' : ''}`}
                        >
                          <td className="p-3 w-10" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleContactSelected(c.resourceName)}
                              className="w-4 h-4 rounded text-primary focus:ring-primary/30 outline-none cursor-pointer"
                            />
                          </td>
                          <td className="p-3 flex items-center gap-2.5 font-sans">
                            {c.photoUrl ? (
                              <img
                                src={c.photoUrl}
                                alt={c.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover border border-border"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-[10px] border border-primary/20">
                                {c.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="font-extrabold text-foreground truncate max-w-[150px]">{c.name}</div>
                          </td>
                          <td className="p-3 text-muted-foreground/85 font-sans">{c.email || "—"}</td>
                          <td className="p-3 text-muted-foreground/85 font-sans">{c.phone || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Actions for google contacts sync */}
            {!contactsLoading && filteredContacts.length > 0 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Đã chọn: <strong>{filteredContacts.filter(c => selectedContactIds[c.resourceName]).length}</strong> liên hệ
                </span>
                <button
                  type="button"
                  onClick={executeContactsImport}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-black px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Tiến hành nhập vào CRM
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </div>
  )}

{/* STEP 2: COLUMN MAPPING DIALOG PANEL */}
 {step === 2 && (
 <div className="space-y-4">
 <div className="bg-amber-500/10 text-amber-800 dark:text-amber-400 p-3.5 rounded-2xl border border-amber-500/20 text-xs flex items-start gap-2.5">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <div className="space-y-0.5">
 <p className="font-bold">Thiết Lập Ánh Xạ Cột Cấu Hình</p>
 <p>Ánh xạ các thuộc tính dữ liệu CRM (bên trái) tương ứng với các cột tiêu đề phát hiện được trên tệp CSV của bạn (bên phải).</p>
 </div>
 </div>

 {/* Fields List details */}
 <div className="border border-border rounded-2xl overflow-hidden shadow-xs">
 <table className="w-full text-left text-xs">
 <thead className="bg-muted font-bold text-muted-foreground uppercase text-xs tracking-wider border-b border-border">
 <tr>
 <th className="p-3">Thuộc tính CRM</th>
 <th className="p-3">Trạng thái cột</th>
 <th className="p-3">Cột tương ứng trên CSV</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border/65">
 {allFields.map((field) => {
 const selectedVal = mappings[field.key];
 const isMapped = selectedVal !== undefined && selectedVal !== -1;

 return (
 <tr key={field.key} className="hover:bg-muted/30">
 <td className="p-3">
 <div className="space-y-0.5">
 <span className="font-bold text-foreground">
 {field.label}
 {field.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
 </span>
 <span className="text-xs text-muted-foreground block ">
 Kiểu dữ liệu: {field.type === "number" ? "Số nguyên" : field.type === "boolean" ? "Đúng / Sai" : "Chuỗi ký tự"}
 </span>
 </div>
 </td>
 <td className="p-3">
 {isMapped ? (
 <span className="text-xs bg-emerald-500/10 text-emerald-600 font-bold py-0.5 px-2 rounded-full border border-emerald-500/20">
 Đã liên kết ({csvHeaders[selectedVal]})
 </span>
 ) : field.required ? (
 <span className="text-xs bg-rose-500/10 text-rose-500 font-bold py-0.5 px-2 rounded-full border border-rose-500/20">
 Chưa ánh xạ *
 </span>
 ) : (
 <span className="text-xs bg-slate-500/10 text-slate-500 font-medium py-0.5 px-2 rounded-full border border-slate-500/20">
 Bỏ qua thuộc tính này
 </span>
 )}
 </td>
 <td className="p-3">
 <select
 value={selectedVal ?? -1}
 onChange={(e) => {
 const val = parseInt(e.target.value);
 setMappings(prev => ({
 ...prev,
 [field.key]: val
 }));
 }}
 className="bg-background border border-border rounded-xl text-xs px-2.5 py-1.5 outline-none font-bold w-full max-w-xs focus:ring-2 focus:ring-primary/20"
 >
 <option value={-1}>-- Bỏ qua không nhập --</option>
 {csvHeaders.map((header, idx) => (
 <option key={idx} value={idx}>{idx + 1}. {header}</option>
 ))}
 </select>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 {/* Action navigators */}
 <div className="flex items-center justify-between pt-4 border-t border-border">
 <button
 type="button"
 onClick={() => setStep(1)}
 className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted px-4 py-2 rounded-xl transition-all"
 >
 <ArrowLeft className="w-4 h-4" /> Quay lại chọn tệp
 </button>

 <button
 type="button"
 onClick={() => {
 if (validateMappings()) {
 setStep(3);
 }
 }}
 className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md px-5 py-2.5 rounded-xl transition-all cursor-pointer"
 >
 Xác nhận ánh xạ, Xem thử <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}

 {/* STEP 3: PREVIEW DATA */}
 {step === 3 && (
 <div className="space-y-4">
 <div className="space-y-1">
 <span className="text-xs font-black uppercase text-[#2f6cf5] tracking-widest block">Xem thử dữ liệu thực tế mẫu</span>
 <p className="text-xs text-muted-foreground">Kiểm duyệt định dạng của 5 dòng dữ liệu đầu tiên trước khi lưu trữ chính thức vào tập dữ liệu Firestore.</p>
 </div>

 {/* Matched Data Table */}
 <div className="border border-border/85 rounded-2xl overflow-hidden shadow-2xs">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs whitespace-nowrap">
 <thead className="bg-muted font-bold text-muted-foreground uppercase text-xs border-b border-border/80">
 <tr>
 <th className="p-3">Tên Khách Hàng</th>
 <th className="p-3">Email</th>
 <th className="p-3">Số Điện Thoại</th>
 <th className="p-3">Điểm Khởi Tạo</th>
 <th className="p-3">Chi Nhánh</th>
 <th className="p-3">Trạng Thái Mặc Định</th>
 <th className="p-3">Dữ Liệu Trường Tùy Chỉnh</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border/60">
 {getMappedPreviewData().map((cust, i) => (
 <tr key={i} className="hover:bg-muted/20">
 <td className="p-3 font-extrabold text-foreground">{cust.name || "—"}</td>
 <td className="p-3 text-muted-foreground ">{cust.email || "Chưa thiết lập"}</td>
 <td className="p-3 text-muted-foreground ">{cust.phone || "Chưa thiết lập"}</td>
 <td className="p-3 font-bold text-[#2f6cf5]">{cust.points ?? 0} pts</td>
 <td className="p-3">
 <span className="bg-muted px-2 py-0.5 rounded-md text-xs text-muted-foreground">
 {cust.companyId ? companies.find(c => c.id === cust.companyId)?.name || cust.companyId : "Cá nhân"}
 </span>
 </td>
 <td className="p-3">
 <span className="bg-blue-500/15 text-blue-600 font-extrabold text-xs px-2 py-0.5 rounded-full border border-blue-500/10">
 NEW_MEMBER (Mới)
 </span>
 </td>
 <td className="p-3 text-muted-foreground">
 {customFields.length > 0 ? (
 <div className="flex flex-wrap gap-1.5">
 {customFields.map(cf => (
 cust[cf.key] !== undefined ? (
 <span key={cf.key} className="bg-accent text-accent-foreground text-xs px-1.5 py-0.2 rounded border border-border">
 {cf.key}: {String(cust[cf.key])}
 </span>
 ) : null
 ))}
 </div>
 ) : "—"}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Summary stat cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 text-left">
 <span className="text-xs font-black uppercase text-muted-foreground">Phân tích tệp</span>
 <div className="text-xl font-bold text-foreground mt-1">{csvRows.length} KH</div>
 <p className="text-xs text-muted-foreground mt-0.5">Tổng số khách hàng được phát hiện trong tệp CSV hiện tại.</p>
 </div>
 <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 text-left">
 <span className="text-xs font-black uppercase text-primary">Các chính sách mặc định</span>
 <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
 Khách hàng mới tạo mặc định mang nhãn <strong>NEW_MEMBER</strong> để áp dụng luật chuyển đổi sau này. Điểm tự động tích lũy dựa trên cấu hình.
 </p>
 </div>
 </div>

 {/* Action buttons */}
 <div className="flex items-center justify-between pt-4 border-t border-border">
 <button
 type="button"
 onClick={() => setStep(2)}
 className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted px-4 py-2 rounded-xl"
 >
 <ArrowLeft className="w-4 h-4" /> Quay lại ánh xạ cột
 </button>

 <button
 type="button"
 onClick={executeImport}
 className="flex items-center gap-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md px-6 py-3 rounded-xl cursor-pointer"
 >
 <Play className="w-4 h-4 fill-current" /> Bắt đầu ghi vào hệ thống
 </button>
 </div>
 </div>
 )}

 {/* STEP 4: PROGRESS REPORT AND METRICS */}
 {step === 4 && (
 <div className="space-y-6 text-center py-10 max-w-md mx-auto">
 {importing ? (
 <>
 <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
 <Loader2 className="w-16 h-16 text-[#2f6cf5] animate-spin" />
 <span className="absolute text-sm font-bold text-foreground">{importProgress}%</span>
 </div>
 <div className="space-y-2">
 <h5 className="font-bold text-lg text-foreground">Đang tải cấu hình dữ liệu khách hàng...</h5>
 <p className="text-xs text-muted-foreground leading-relaxed">
 Đang xử lý phân đoạn thông tin và viết nhật ký vào Firestore cơ sở dữ liệu. Tiến trình: {importedCount} / {csvRows.length} dòng dữ liệu.
 </p>
 </div>
 <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
 <div className="bg-primary h-2.5 transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
 </div>
 </>
 ) : (
 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="space-y-5"
 >
 <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
 <CheckCircle2 className="w-8 h-8" />
 </div>
 <div className="space-y-1">
 <h5 className="font-bold text-lg text-foreground">Ghi nhận dữ liệu thành công!</h5>
 <p className="text-xs text-muted-foreground">
 Hoàn thành nạp thuộc tính và cấu trúc khách hàng.
 </p>
 </div>

 <div className="bg-muted/40 p-4.5 rounded-2xl border border-border/80 text-left text-xs space-y-2">
 <div className="flex justify-between border-b border-border/40 pb-2">
 <span className="text-muted-foreground text-xs uppercase font-sans">Chi tiết tác vụ</span>
 <span className="text-primary font-bold">IMPORT REPORT</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Nhập thành công:</span>
 <span className="font-bold text-foreground">{importedCount} dòng khách hàng</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Trạng thái khởi tạo:</span>
 <span className="font-bold text-emerald-500">NEW_MEMBER</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground text-xs uppercase font-sans">Thời điểm xử lý</span>
 <span className="text-muted-foreground">{new Date().toLocaleTimeString()}</span>
 </div>
 </div>

 <button
 type="button"
 onClick={onClose}
 className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 transition-all shadow-md cursor-pointer"
 >
 Hoàn tất & Đóng trình nhập liệu
 </button>
 </motion.div>
 )}
 </div>
 )}

 </div>
       </motion.div>
      {showDrivePicker && (
        <GoogleDrivePicker 
          onPick={handleDriveFilePicked}
          onCancel={() => setShowDrivePicker(false)}
        />
      )}
    </div>
  );
}