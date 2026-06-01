import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  ChevronRight,
  ChevronDown,
  X,
  Layers,
  Briefcase,
} from "lucide-react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Company } from "@/types";
import { toast } from "sonner";
import { useFirebase } from "@/components/FirebaseProvider";

export function CompanyManager() {
  const { user } = useFirebase();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    type: "company" as "company" | "branch",
    parentId: "",
  });

  useEffect(() => {
    if (!user?.uid || user?.isLocal) {
      setLoading(false);
      return;
    }

    const companiesPath = "companies";
    const q = query(collection(db, companiesPath));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Company[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Company);
        });
        // Sort alphabetically
        list.sort((a, b) => a.name.localeCompare(b.name));
        setCompanies(list);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
        toast.error("Không thể tải danh sách công ty");
      },
    );
    return unsubscribe;
  }, [user]);

  const handleOpenForm = (company?: Company, isBranchOf?: string) => {
    if (company) {
      setIsEditing(true);
      setEditId(company.id);
      setFormData({
        name: company.name || "",
        address: company.address || "",
        type: company.type || "company",
        parentId: company.parentId || "",
      });
    } else {
      setIsEditing(false);
      setEditId("");
      setFormData({
        name: "",
        address: "",
        type: isBranchOf ? "branch" : "company",
        parentId: isBranchOf || "",
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Vui lòng nhập tên");
    if (!user?.uid || user?.isLocal)
      return toast.error(
        "Vui lòng đăng nhập bằng Google để thực hiện thao tác này",
      );

    try {
      const companiesPath = "companies";
      if (isEditing && editId) {
        await updateDoc(doc(db, companiesPath, editId), {
          name: formData.name,
          address: formData.address,
          type: formData.type,
          parentId: formData.type === "branch" ? formData.parentId : null,
          updatedAt: serverTimestamp(),
        });
        toast.success("Cập nhật thành công");
      } else {
        const newRef = doc(collection(db, companiesPath));
        await setDoc(newRef, {
          name: formData.name,
          address: formData.address,
          type: formData.type,
          parentId: formData.type === "branch" ? formData.parentId : null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: user.uid,
        });
        toast.success("Thêm mới thành công");
      }
      setShowForm(false);
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "companies" } }),
      );
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!user?.uid || user?.isLocal)
      return toast.error("Vui lòng đăng nhập bằng Google để thực hiện thao tác này");
    
    setDeleteConfirm({ id, name });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      const companiesPath = "companies";
      await deleteDoc(doc(db, companiesPath, deleteConfirm.id));
      toast.success("Xóa thành công");
      window.dispatchEvent(
        new CustomEvent("crm-config-saved", { detail: { tab: "companies" } }),
      );
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Build tree
  const parentCompanies = companies.filter((c) => c.type !== "branch");
  const branches = companies.filter((c) => c.type === "branch");

  return (
    <div className="space-y-6">
      <div className="bg-[#2f6cf5]/5 border border-[#2f6cf5]/25 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2.5 bg-[#2f6cf5]/15 rounded-xl text-[#2f6cf5] shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-[#2f6cf5] text-sm">
            Quản lý Công ty & Chi nhánh
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Thiết lập cấu trúc doanh nghiệp của bạn, bao gồm các công ty mẹ và
            chi nhánh trực thuộc, giúp tổ chức hệ thống dễ dàng hơn.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" /> DANH SÁCH TỔ CHỨC
        </h3>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm Công ty
        </button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex justify-center p-10">
            <span className="text-muted-foreground text-sm">Đang tải...</span>
          </div>
        ) : parentCompanies.length === 0 && branches.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Chưa có công ty nào.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {parentCompanies.map((company) => {
              const companyBranches = branches.filter(
                (b) => b.parentId === company.id,
              );
              const isExpanded = expandedIds[company.id] !== false; // default to true

              return (
                <div
                  key={company.id}
                  className="border border-border/60 rounded-xl overflow-hidden hover:border-border transition-colors"
                >
                  <div
                    onClick={(e) =>
                      companyBranches.length > 0 && toggleExpand(company.id, e)
                    }
                    className={`bg-muted/10 p-4 flex items-center justify-between border-b ${isExpanded && companyBranches.length > 0 ? "border-border/40" : "border-transparent"} ${companyBranches.length > 0 ? "cursor-pointer hover:bg-muted/20" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {companyBranches.length > 0 ? (
                        <div className="text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </div>
                      ) : (
                        <div className="w-5" /> // spacer
                      )}
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">
                          {company.name}{" "}
                          <span className="text-xs font-normal text-muted-foreground ml-2">
                            ({companyBranches.length} chi nhánh)
                          </span>
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />{" "}
                          {company.address || "Chưa cập nhật địa chỉ"}
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenForm(undefined, company.id)}
                        className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                        title="Thêm chi nhánh"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenForm(company)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        title="Sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id, company.name)}
                        className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {companyBranches.length > 0 && isExpanded && (
                    <div className="p-4 space-y-3 bg-card pl-14">
                      {companyBranches.map((branch, index) => (
                        <div
                          key={branch.id}
                          className="group relative flex items-center justify-between pl-4 py-2 hover:bg-muted/30 rounded-lg transition-colors border border-transparent hover:border-border/60"
                        >
                          {/* Tree connecting line */}
                          <div
                            className="absolute -left-5 top-0 bottom-0 w-px bg-border/60"
                            style={{
                              height:
                                index === companyBranches.length - 1
                                  ? "50%"
                                  : "100%",
                            }}
                          />
                          <div className="absolute -left-5 top-1/2 w-4 h-px bg-border/60" />

                          <div className="flex items-center gap-3">
                            <Layers className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-semibold text-sm text-foreground">
                                {branch.name}
                              </div>
                              {branch.address && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {branch.address}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenForm(branch)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(branch.id, branch.name)
                              }
                              className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Branches without valid parents */}
            {branches.filter(
              (b) => !parentCompanies.find((p) => p.id === b.parentId),
            ).length > 0 && (
              <div className="pt-4 mt-6 border-t border-border/50">
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3 px-2">
                  Chi nhánh không trực thuộc
                </h4>
                <div className="space-y-2">
                  {branches
                    .filter(
                      (b) => !parentCompanies.find((p) => p.id === b.parentId),
                    )
                    .map((branch) => (
                      <div
                        key={branch.id}
                        className="flex items-center justify-between p-3 border border-border/60 rounded-xl bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <Layers className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-semibold text-sm text-foreground">
                              {branch.name}{" "}
                              <span className="text-xs font-normal text-rose-500 ml-2">
                                (Mất công ty mẹ)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenForm(branch)}
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(branch.id, branch.name)}
                            className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border/60 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
              <h3 className="font-bold text-lg">
                {isEditing
                  ? `Sửa ${formData.type === "branch" ? "Chi nhánh" : "Công ty"}`
                  : `Thêm ${formData.type === "branch" ? "Chi nhánh" : "Công ty"}`}
              </h3>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                  Loại hình
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        type: "company",
                        parentId: "",
                      })
                    }
                    className={`flex-1 py-2 text-sm font-bold rounded-xl border ${formData.type === "company" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    Công ty mẹ
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "branch" })}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl border ${formData.type === "branch" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    Chi nhánh
                  </button>
                </div>
              </div>

              {formData.type === "branch" && (
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                    Trực thuộc công ty
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) =>
                      setFormData({ ...formData, parentId: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                    required
                  >
                    <option value="">-- Chọn công ty mẹ --</option>
                    {parentCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="Vd: Atelier VN, Chi nhánh Quận 1..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">
                  Địa chỉ
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none min-h-[80px]"
                  placeholder="Địa chỉ cụ thể..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-border/50 mt-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow-md hover:scale-105 transition-all"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Bạn có chắc chắn muốn xóa <strong>"{deleteConfirm.name}"</strong>? Các chi nhánh con (nếu có) sẽ không bị xóa tự động, bạn sẽ phải tự xóa chúng sau.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-bold bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-2.5 text-sm font-bold bg-rose-500 text-white rounded-xl shadow-md hover:bg-rose-600 hover:shadow-lg transition-all"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
