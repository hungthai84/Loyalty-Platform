import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";

interface AddSegmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingSegment?: any;
  onSave: (segment: any) => void;
}

export function AddSegmentDialog({ isOpen, onClose, editingSegment, onSave }: AddSegmentDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"criteria" | "file">("criteria");
  const [color, setColor] = useState<"blue" | "emerald" | "amber" | "rose" | "violet">("blue");

  // Type: criteria
  const [conditions, setConditions] = useState<Array<{ field: string; operator: string; value: string }>>([
    { field: "spend", operator: "gte", value: "10000000" }
  ]);

  // Type: file
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [fileEntries, setFileEntries] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (editingSegment) {
        setName(editingSegment.name || "");
        setType(editingSegment.type || "criteria");
        setColor(editingSegment.color || "blue");
        
        if (editingSegment.type === "file") {
          setFileEntries(editingSegment.fileEntries || []);
          setUploadedFileName(editingSegment.fileName || "");
        } else {
          if (editingSegment.conditions && editingSegment.conditions.length > 0) {
            setConditions(editingSegment.conditions);
          } else {
            // Backward compatibility
            setConditions([
              { field: "spend", operator: "gte", value: String(editingSegment.minSpend || 0) },
              { field: "frequency", operator: "gte", value: String(editingSegment.minFrequency || 0) }
            ]);
          }
        }
      } else {
        setName("");
        setType("criteria");
        setColor("blue");
        setConditions([{ field: "spend", operator: "gte", value: "10000000" }]);
        setFileEntries([]);
        setUploadedFileName("");
      }
    }
  }, [isOpen, editingSegment]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").map(l => l.trim().replace(/['"]/g, "")).filter(Boolean);
      
      const identifiers: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        if (parts[0]) identifiers.push(parts[0].trim());
      }
      
      if (identifiers.length > 0) {
        setFileEntries(identifiers);
        toast.success(`Đã nhận diện thành công ${identifiers.length} bản ghi!`);
      } else {
        setFileEntries([]);
        toast.error("Không tìm thấy dữ liệu hợp lệ trong file!");
      }
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên nhóm thành viên!");
      return;
    }
    if (type === "file" && fileEntries.length === 0) {
      toast.error("Vui lòng tải lên file danh sách có dữ liệu hợp lệ!");
      return;
    }

    const segmentToSave = {
      id: editingSegment ? editingSegment.id : `seg_${Date.now()}`,
      name: name.trim(),
      color,
      type,
      isCustom: true,
      conditions: type === "criteria" ? conditions : [],
      fileEntries: type === "file" ? fileEntries : undefined,
      fileName: type === "file" ? uploadedFileName : undefined,
      minSpend: 0,
      minFrequency: 0,
    };

    onSave(segmentToSave);
  };

  const colors = [
    { value: "blue", hex: "bg-[#2f6cf5]" },
    { value: "emerald", hex: "bg-emerald-500" },
    { value: "amber", hex: "bg-amber-500" },
    { value: "rose", hex: "bg-rose-500" },
    { value: "violet", hex: "bg-violet-500" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border/50 text-left p-0 rounded-3xl overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-muted/20">
          <DialogTitle className="text-xl font-bold font-heading flex flex-col gap-1 text-foreground">
            {editingSegment ? "Chỉnh sửa Nhóm thành viên" : "Tạo Mới Nhóm Thành Viên"}
            <span className="text-sm font-normal text-muted-foreground w-full break-normal leading-relaxed mt-1">
              Phân khúc khách hàng để có những chiến lược tiếp thị chuẩn xác và tỉ lệ chuyển đổi cao hơn.
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Quick templates */}
          {!editingSegment && (
            <div className="bg-[#2f6cf5]/5 border border-[#2f6cf5]/20 rounded-2xl p-4 space-y-2 text-left">
              <div className="flex items-center gap-2 text-[#2f6cf5]">
                <span className="text-xs font-black uppercase tracking-wider block">🎟️ Mẫu Phân Khúc Nhanh</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tải các mẫu điều kiện định sẵn theo chiến dịch chăm sóc hoặc tặng quà của bạn.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setName("Nhóm xem Anh Trai Say Hi (6 tháng cuối 2026)");
                    setColor("violet");
                    setType("criteria");
                    setConditions([
                      { field: "product_name", operator: "contains", value: "độc đáo, đặc quyền" },
                      { field: "purchase_date", operator: "between", value: "6_thang_cuoi_2026" }
                    ]);
                    toast.success("Đã tải mẫu phân khúc vé Anh Trai Say Hi!");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  🎟️ Mẫu: Vé Anh Trai Say Hi (6 tháng cuối 2026)
                </button>
              </div>
            </div>
          )}

          {/* Tên & Màu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="text-xs uppercase font-black text-foreground tracking-wider block">
                Tên Segment
              </label>
              <Input
                placeholder="Ví dụ: Khách VIP HCM (Chi tiêu > 50tr)"
                className="bg-background h-10 border-border text-xs font-semibold"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-xs uppercase font-black text-foreground tracking-wider block">
                Màu Nhận Diện
              </label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value as any)}
                    className={`w-10 h-10 rounded-full transition-all ${c.hex} border-4 ${color === c.value ? "border-background shadow-md transform scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="border border-border/60 rounded-xl overflow-hidden">
            <div className="flex -mb-px">
              <button
                className={`flex-1 py-3 text-xs font-bold transition-colors ${type === "criteria" ? "bg-background text-foreground border-b-2 border-[#2f6cf5]" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                onClick={() => setType("criteria")}
              >
                Nhóm Động (Tiêu Chí Cập Nhật)
              </button>
              <button
                className={`flex-1 py-3 text-xs font-bold transition-colors ${type === "file" ? "bg-background text-foreground border-b-2 border-[#2f6cf5]" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                onClick={() => setType("file")}
              >
                Tải lên Danh sách (CSV/Tĩnh)
              </button>
            </div>

            <div className="bg-background p-5 border-t border-border/60">
              <Badge variant="outline" className="mb-4 bg-muted/30 border-border/50 text-muted-foreground text-[10px] font-medium leading-relaxed block max-w-none">
                {type === "criteria" 
                 ? "Hệ thống tự động liên tục bổ sung hoặc loại bỏ các khách hàng dựa vào thiết lập điều kiện phía dưới giúp nhóm luôn tươi."
                 : "Hệ thống sẽ rà soát chéo các email / số điện thoại hoặc mã CMND trong danh sách đối chiếu với cơ sở dữ liệu."}
              </Badge>

              {type === "criteria" ? (
                <div className="space-y-3">
                  {conditions.map((cond, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center bg-muted/10 p-2 rounded-lg border border-border/40">
                      <select 
                        className="h-9 w-full sm:w-1/3 bg-card border border-border rounded-md px-2 text-xs font-semibold outline-none text-foreground"
                        value={cond.field}
                        onChange={(e) => {
                          const newConds = [...conditions];
                          const selectedField = e.target.value;
                          newConds[idx].field = selectedField;
                          
                          if (selectedField === "product_name") {
                            newConds[idx].operator = "contains";
                            newConds[idx].value = "";
                          } else if (selectedField === "purchase_date") {
                            newConds[idx].operator = "between";
                            newConds[idx].value = "6_thang_cuoi_2026";
                          } else {
                            newConds[idx].operator = "gte";
                            newConds[idx].value = "1000000";
                          }
                          setConditions(newConds);
                        }}
                      >
                        <option value="spend">Tổng Chi Tiêu Lũy Kế</option>
                        <option value="frequency">Tần Suất Mua Sắm</option>
                        <option value="points">Hạn Mức Điểm Tích Lũy</option>
                        <option value="product_name">Sản phẩm đã mua (Từ khóa)</option>
                        <option value="purchase_date">Thời gian mua hàng</option>
                      </select>

                      <select 
                        className="h-9 w-full sm:w-1/4 bg-card border border-border rounded-md px-2 text-xs font-semibold outline-none text-foreground"
                        value={cond.operator}
                        onChange={(e) => {
                          const newConds = [...conditions];
                          const selectedOp = e.target.value;
                          newConds[idx].operator = selectedOp;
                          
                          if (cond.field === "purchase_date") {
                            if (selectedOp === "between") {
                              newConds[idx].value = "6_thang_cuoi_2026";
                            } else {
                              newConds[idx].value = new Date().toISOString().split('T')[0];
                            }
                          }
                          setConditions(newConds);
                        }}
                      >
                        {cond.field === "product_name" ? (
                          <>
                            <option value="contains">Chứa từ khóa</option>
                            <option value="eq">Bằng chính xác</option>
                          </>
                        ) : cond.field === "purchase_date" ? (
                          <>
                            <option value="between">Trong khoảng</option>
                            <option value="gte">Từ ngày (≥)</option>
                            <option value="lte">Đến ngày (≤)</option>
                          </>
                        ) : (
                          <>
                            <option value="gte">Lớn hơn hoặc bằng (≥)</option>
                            <option value="lte">Nhỏ hơn hoặc bằng (≤)</option>
                            <option value="eq">Bằng chính xác (=)</option>
                          </>
                        )}
                      </select>

                      {cond.field === "product_name" ? (
                        <Input 
                          placeholder="Ví dụ: độc đáo, đặc quyền" 
                          type="text"
                          className="h-9 w-full sm:w-1/3 bg-background font-sans text-xs" 
                          value={cond.value}
                          onChange={(e) => {
                            const newConds = [...conditions];
                            newConds[idx].value = e.target.value;
                            setConditions(newConds);
                          }}
                        />
                      ) : cond.field === "purchase_date" ? (
                        cond.operator === "between" ? (
                          <div className="flex flex-col sm:flex-row gap-1.5 w-full sm:w-1/3 min-w-0">
                            <select
                              className="h-9 w-full bg-card border border-border rounded-md px-1.5 text-xs font-semibold outline-none text-foreground shrink-0"
                              value={cond.value.startsWith("custom:") ? "custom" : cond.value}
                              onChange={(e) => {
                                const newConds = [...conditions];
                                const selectedPreset = e.target.value;
                                if (selectedPreset === "custom") {
                                  newConds[idx].value = "custom:2026-07-01:2026-12-31";
                                } else {
                                  newConds[idx].value = selectedPreset;
                                }
                                setConditions(newConds);
                              }}
                            >
                              <option value="6_thang_cuoi_2026">6 tháng cuối 2026</option>
                              <option value="6_thang_dau_2026">6 tháng đầu 2026</option>
                              <option value="ca_nam_2026">Cả năm 2026</option>
                              <option value="last_30_days">30 ngày gần đây</option>
                              <option value="last_180_days">180 ngày gần đây</option>
                              <option value="custom">Tự chọn ngày...</option>
                            </select>
                            
                            {cond.value.startsWith("custom:") && (() => {
                              const parts = cond.value.split(":");
                              const start = parts[1] || "";
                              const end = parts[2] || "";
                              return (
                                <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto">
                                  <input 
                                    type="date"
                                    value={start}
                                    onChange={(e) => {
                                      const newConds = [...conditions];
                                      newConds[idx].value = `custom:${e.target.value}:${end}`;
                                      setConditions(newConds);
                                    }}
                                    className="h-9 w-[100px] bg-background border border-border rounded-md px-1 text-[10px] outline-none text-foreground font-mono"
                                  />
                                  <span className="text-[9px] text-muted-foreground">đến</span>
                                  <input 
                                    type="date"
                                    value={end}
                                    onChange={(e) => {
                                      const newConds = [...conditions];
                                      newConds[idx].value = `custom:${start}:${e.target.value}`;
                                      setConditions(newConds);
                                    }}
                                    className="h-9 w-[100px] bg-background border border-border rounded-md px-1 text-[10px] outline-none text-foreground font-mono"
                                  />
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <Input 
                            type="date"
                            className="h-9 w-full sm:w-1/3 bg-background text-xs font-mono" 
                            value={cond.value}
                            onChange={(e) => {
                              const newConds = [...conditions];
                              newConds[idx].value = e.target.value;
                              setConditions(newConds);
                            }}
                          />
                        )
                      ) : (
                        <Input 
                          placeholder="Giá trị..." 
                          type="number"
                          className="h-9 w-full sm:w-1/3 bg-background font-mono text-xs" 
                          value={cond.value}
                          onChange={(e) => {
                            const newConds = [...conditions];
                            newConds[idx].value = e.target.value;
                            setConditions(newConds);
                          }}
                        />
                      )}

                      <button 
                        onClick={() => {
                           if (conditions.length <= 1) return;
                           const newConds = [...conditions];
                           newConds.splice(idx, 1);
                           setConditions(newConds);
                        }}
                        className="w-9 h-9 shrink-0 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button 
                    onClick={() => {
                        setConditions([...conditions, { field: "spend", operator: "gte", value: "0" }]);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 py-2.5 mt-2 bg-muted/40 hover:bg-muted text-muted-foreground text-xs font-bold rounded-lg border border-dashed border-border transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Bổ sung thêm điều kiện AND
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border/80 bg-muted/10 p-6 rounded-xl flex flex-col items-center justify-center text-center relative group hover:bg-muted/30 hover:border-[#2f6cf5]/50 transition-all cursor-pointer">
                    <input 
                      type="file" 
                      accept=".csv"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={handleFileUpload}
                    />
                    <div className="w-10 h-10 bg-[#2f6cf5]/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-4 h-4 text-[#2f6cf5]" />
                    </div>
                    {uploadedFileName ? (
                      <div>
                        <p className="text-xs font-bold text-[#2f6cf5]">{uploadedFileName}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Đã nhận diện {fileEntries.length} bản ghi</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-foreground mb-1">Click tải lên hoặc kéo thả tệp (.csv)</p>
                        <p className="text-[10px] text-muted-foreground">Đảm bảo cột đầu tiên là ID, Email hoặc SĐT khách hàng.</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/50 bg-muted/10 flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-muted-foreground hover:bg-muted border border-transparent hover:border-border rounded-xl transition-all cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-[#2f6cf5] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#2f6cf5]/90 hover:shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Lưu Nhóm
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
