import React, { useState, useRef } from "react";
import { 
  X, Upload, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, 
  ChevronRight, Play, Loader2, Table as TableIcon, RefreshCw, BarChart 
} from "lucide-react";
import * as motion from "motion/react-client";
import { db } from "@/lib/firebase";
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";
import { AttributeDefinition, Company } from "@/types";
import { toast } from "sonner";

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
  
  // Mapping of [Database Field Key] -> [CSV Column Index]
  const [mappings, setMappings] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error("Tệp CSV không có dữ liệu!");
        return;
      }

      const headers = parsed[0];
      const rows = parsed.slice(1);

      setCsvHeaders(headers);
      setCsvRows(rows);

      // Perform auto-mapping based on field label approximations
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
    reader.readAsText(file, "UTF-8");
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
          const docRef = doc(db, `users/${userId}/customers`, cust.id);
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
            <span className="text-[10px] font-black tracking-widest text-[#2f6cf5] bg-[#2f6cf5]/10 px-2.5 py-1 rounded-full uppercase">
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
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-primary text-primary-foreground' : step > 1 ? 'bg-primary/20 text-primary' : 'bg-border'}`}>1</span>
            <span>Tải tệp CSV</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-primary text-primary-foreground' : step > 2 ? 'bg-primary/20 text-primary' : 'bg-border'}`}>2</span>
            <span>Ánh xạ cột dữ liệu</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-primary text-primary-foreground' : step > 3 ? 'bg-primary/20 text-primary' : 'bg-border'}`}>3</span>
            <span>Kiểm duyệt & Thử nghiệm</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          <div className={`flex items-center gap-2 ${step >= 4 ? 'text-primary' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-primary text-primary-foreground' : 'bg-border'}`}>4</span>
            <span>Thực hiện nhập</span>
          </div>
        </div>

        {/* Form panel bodies */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* STEP 1: UPLOAD FILE DRAG AND DROP */}
          {step === 1 && (
            <div className="space-y-4 py-4">
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
                <div className="text-[10px] text-muted-foreground bg-muted hover:bg-muted/80 py-1.5 px-3.5 rounded-full border border-border/40">
                  Hỗ trợ tối đa 5,000 khách hàng mỗi lượt tải lên
                </div>
              </div>

              {/* Sample standard template help */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/40 text-left space-y-2">
                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block">Mẫu tệp CSV tiêu chuẩn gợi ý</span>
                <p className="text-xs text-muted-foreground">Hệ thống phân tích thông minh sẽ tự động liên kết các cột dựa trên tên tiêu đề. Bạn có thể xây dựng CSV với các dòng tương ứng:</p>
                <div className="font-mono text-[10px] p-3 bg-card border border-border/80 rounded-xl text-foreground overflow-x-auto whitespace-nowrap">
                  Họ tên, Email, Số điện thoại, Điểm số, Link FB, Zalo, Mã chi nhánh, v.v.
                </div>
              </div>
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
                  <thead className="bg-muted font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
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
                              <span className="text-[10px] text-muted-foreground block font-mono">
                                Kiểu dữ liệu: {field.type === "number" ? "Số nguyên" : field.type === "boolean" ? "Đúng / Sai" : "Chuỗi ký tự"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            {isMapped ? (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold py-0.5 px-2 rounded-full border border-emerald-500/20">
                                Đã liên kết ({csvHeaders[selectedVal]})
                              </span>
                            ) : field.required ? (
                              <span className="text-[10px] bg-rose-500/10 text-rose-500 font-bold py-0.5 px-2 rounded-full border border-rose-500/20">
                                Chưa ánh xạ *
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-500/10 text-slate-500 font-medium py-0.5 px-2 rounded-full border border-slate-500/20">
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
                <span className="text-[10px] font-black uppercase text-[#2f6cf5] tracking-widest block">Xem thử dữ liệu thực tế mẫu</span>
                <p className="text-xs text-muted-foreground">Kiểm duyệt định dạng của 5 dòng dữ liệu đầu tiên trước khi lưu trữ chính thức vào tập dữ liệu Firestore.</p>
              </div>

              {/* Matched Data Table */}
              <div className="border border-border/85 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-muted font-bold text-muted-foreground uppercase text-[10px] border-b border-border/80">
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
                          <td className="p-3 text-muted-foreground font-mono">{cust.email || "Chưa thiết lập"}</td>
                          <td className="p-3 text-muted-foreground font-mono">{cust.phone || "Chưa thiết lập"}</td>
                          <td className="p-3 font-bold text-[#2f6cf5]">{cust.points ?? 0} pts</td>
                          <td className="p-3">
                            <span className="bg-muted px-2 py-0.5 rounded-md font-mono text-[10px] text-muted-foreground">
                              {cust.companyId ? companies.find(c => c.id === cust.companyId)?.name || cust.companyId : "Cá nhân"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="bg-blue-500/15 text-blue-600 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-blue-500/10">
                              NEW_MEMBER (Mới)
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {customFields.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {customFields.map(cf => (
                                  cust[cf.key] !== undefined ? (
                                    <span key={cf.key} className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.2 rounded border border-border">
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
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Phân tích tệp</span>
                  <div className="text-xl font-mono font-bold text-foreground mt-1">{csvRows.length} KH</div>
                  <p className="text-xs text-muted-foreground mt-0.5">Tổng số khách hàng được phát hiện trong tệp CSV hiện tại.</p>
                </div>
                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 text-left">
                  <span className="text-[10px] font-black uppercase text-primary">Các chính sách mặc định</span>
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
                    <span className="absolute font-mono text-sm font-bold text-foreground">{importProgress}%</span>
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

                  <div className="bg-muted/40 p-4.5 rounded-2xl border border-border/80 text-left text-xs font-mono space-y-2">
                    <div className="flex justify-between border-b border-border/40 pb-2">
                      <span className="text-muted-foreground text-[10px] uppercase font-sans">Chi tiết tác vụ</span>
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
                      <span className="text-muted-foreground text-[10px] uppercase font-sans">Thời điểm xử lý</span>
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
    </div>
  );
}
